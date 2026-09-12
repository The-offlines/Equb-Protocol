import { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";

// Extend W3SSdk type to include methods that exist in the SDK but aren't in type definitions
declare module "@circle-fin/w3s-pw-web-sdk" {
  interface W3SSdk {
    // Kept for compatibility with older SDK builds. The installed SDK uses
    // the callback passed directly to execute().
    setOnSuccess?(callback: (result: unknown) => void): void;
    setOnError?(callback: (error: unknown) => void): void;
  }
}

let sdk: W3SSdk | null = null;

type CircleChallengeError = {
  message: string;
  code?: unknown;
};

type ChallengeCompleteHandler = (
  error: CircleChallengeError | undefined,
  result?: unknown,
) => void | Promise<void>;

export function initCircleSdk() {
  if (typeof window === "undefined") {
    return null;
  }

  if (!sdk) {
    const appId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID;
    if (!appId) {
      throw new Error("Circle app ID is not configured.");
    }

    sdk = new W3SSdk({
      appSettings: {
        appId,
      },
    });
  }

  return sdk;
}

export type ExecuteContractTxRequest = {
  userToken: string;
  encryptionKey: string;
  walletId: string;
  contractAddress: string;
  abiFunctionSignature: string;
  abiParameters: string[];
};

export async function getCircleWalletId(userToken: string, walletAddress?: string): Promise<string> {
  const response = await fetch("/api/circle/wallet-id", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userToken, walletAddress }),
  });
  const payload = (await response.json()) as { walletId?: string; error?: string };
  if (!response.ok || !payload.walletId) {
    throw new Error(payload.error ?? "Unable to find your Arc wallet.");
  }

  return payload.walletId;
}

export function formatCircleError(error: unknown): string {
  if (error instanceof Error) {
    const details = error.cause ? `; cause: ${formatCircleError(error.cause)}` : "";
    return `${error.message}${details}`;
  }
  if (typeof error === "object" && error !== null) {
    const value = error as Record<string, unknown>;
    const parts = ["shortMessage", "message", "details", "code", "status"]
      .filter((key) => value[key] !== undefined)
      .map((key) => `${key}: ${typeof value[key] === "string" ? value[key] : JSON.stringify(value[key])}`);
    if (value.cause) parts.push(`cause: ${formatCircleError(value.cause)}`);
    if (parts.length) return parts.join("; ");
    return "Circle rejected or closed the approval.";
  }
  return typeof error === "string" ? error : "Unknown Circle transaction error.";
}

export async function getContractChallengeId({
  userToken,
  walletId,
  contractAddress,
  abiFunctionSignature,
  abiParameters,
}: Omit<ExecuteContractTxRequest, "encryptionKey">): Promise<string> {
  console.log("STEP 1: Calling Circle API to create contract challenge", { contractAddress, walletId });
  const response = await fetch("/api/circle/execute-contract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userToken, walletId, contractAddress, abiFunctionSignature, abiParameters }),
  });

  const payload = (await response.json()) as {
    challengeId?: string;
    error?: string;
    code?: string | number;
    details?: unknown;
  };
  if (!response.ok || !payload.challengeId) {
    const detail = payload.details === undefined ? "" : `; details: ${JSON.stringify(payload.details)}`;
    throw new Error(
      `${payload.error ?? `Circle API HTTP ${response.status}`}${payload.code ? ` (code: ${payload.code})` : ""}${detail}`,
    );
  }

  console.log("STEP 2: Got challengeId:", payload.challengeId);
  return payload.challengeId;
}

export function executeChallenge(
  challengeId: string,
  userToken: string,
  encryptionKey: string,
  onCompleted?: ChallengeCompleteHandler,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let timeoutId: number | undefined;
    try {
      console.log("STEP 3: Initializing Circle SDK...");
      const circleSdk = initCircleSdk();
      if (!circleSdk) {
        throw new Error("Circle SDK not available.");
      }

      // updateConfigs() is synchronous in @circle-fin/w3s-pw-web-sdk 1.1.x.
      // Waiting for a callback here prevents execute() from ever being called.
      circleSdk.updateConfigs({ appSettings: { appId: process.env.NEXT_PUBLIC_CIRCLE_APP_ID ?? "" } });
      circleSdk.setAuthentication({ userToken, encryptionKey });
      console.log("STEP 4: Calling sdk.execute...");

      timeoutId = window.setTimeout(() => {
        const error = new Error("Circle approval timed out or was closed.");
        onCompleted?.(error);
        reject(error);
      }, 10 * 60 * 1000);

      circleSdk.execute(challengeId, (executeError: any, result: any) => {
        console.log("STEP 5: Circle approval callback called:", result ?? executeError);
        if (timeoutId !== undefined) window.clearTimeout(timeoutId);
        if (executeError) {
          const normalizedError = new Error(formatCircleError(executeError));
          console.warn("Circle approval was not completed:", normalizedError.message);
          onCompleted?.(normalizedError, result);
          reject(normalizedError);
          return;
        }

        onCompleted?.(undefined, result);
        resolve(result);
      });
    } catch (error) {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      const normalizedError = error instanceof Error ? error : new Error("Unable to open Circle approval.");
      console.error("Circle SDK initialization/execute error:", normalizedError);
      onCompleted?.(normalizedError);
      reject(normalizedError);
    }
  });
}

export async function pollTransactionStatus(challengeId: string, userToken: string): Promise<string> {
  console.log("STEP 6: Polling transaction status...");
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));

    const res = await fetch("/api/circle/transaction-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId, userToken }),
    });

    const data = (await res.json()) as {
      state?: string;
      transactions?: Array<{ state?: string; txHash?: string; errorReason?: string }>;
      error?: string;
    };
    const transaction = data.transactions?.[0];
    const state = transaction?.state ?? "PENDING";
    const txHash = transaction?.txHash;
    console.log(`Poll ${i}:`, state, txHash ?? data.error ?? "");

    if (!res.ok) {
      const detail = data.details === undefined ? "" : `; details: ${JSON.stringify(data.details)}`;
      throw new Error(
        data.error ?? `Circle transactions HTTP ${res.status}`,
      );
    }

    if (data.state === "COMPLETE" && data.txHash) {
      console.log("STEP 7: Circle transaction complete; transaction hash:", data.txHash);
      return data.txHash;
    }
    if (["FAILED", "DENIED", "CANCELLED"].includes(state)) {
      throw new Error(`Circle transaction ${state.toLowerCase()}${transaction?.errorReason ? `: ${transaction.errorReason}` : ""}.`);
    }
  }

  throw new Error(`Transaction polling timed out after ${maxAttempts * intervalMs / 1000}s`);
}

export async function executeEmbeddedContractTransaction({
  userToken,
  encryptionKey,
  walletId,
  contractAddress,
  abiFunctionSignature,
  abiParameters,
}: ExecuteContractTxRequest): Promise<string> {
  const challengeId = await getContractChallengeId({
    userToken,
    walletId,
    contractAddress,
    abiFunctionSignature,
    abiParameters,
  });

  await executeChallenge(challengeId, userToken, encryptionKey);

  return pollTransactionStatus(walletId, userToken);
}

export { sdk };
