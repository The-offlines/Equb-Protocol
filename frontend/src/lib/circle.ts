import { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";

// Extend W3SSdk type to include methods that exist in the SDK but aren't in type definitions
declare module "@circle-fin/w3s-pw-web-sdk" {
  interface W3SSdk {
    setOnSuccess(callback: (result: any) => void): void;
    setOnError(callback: (error: any) => void): void;
  }
}

let sdk: W3SSdk | null = null;

export function initCircleSdk() {
  if (typeof window === "undefined") {
    return null;
  }

  if (!sdk) {
    sdk = new W3SSdk({
      appSettings: {
        appId: process.env.NEXT_PUBLIC_CIRCLE_APP_ID!,
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

export async function getContractChallengeId({
  userToken,
  walletId,
  contractAddress,
  abiFunctionSignature,
  abiParameters,
}: Omit<ExecuteContractTxRequest, "encryptionKey">): Promise<string> {
  const response = await fetch("/api/circle/execute-contract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userToken, walletId, contractAddress, abiFunctionSignature, abiParameters }),
  });

  const payload = (await response.json()) as { challengeId?: string; error?: string };
  if (!response.ok || !payload.challengeId) {
    throw new Error(payload.error ?? "Unable to start your Circle wallet transaction.");
  }

  return payload.challengeId;
}

export function executeChallenge(
  challengeId: string,
  userToken: string,
  encryptionKey: string,
  onCompleted?: (error: any, result?: any) => void,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const circleSdk = initCircleSdk();
    if (!circleSdk) {
      const error = new Error("Circle SDK not available.");
      onCompleted?.(error);
      reject(error);
      return;
    }

    circleSdk.updateConfigs(
      { appSettings: { appId: process.env.NEXT_PUBLIC_CIRCLE_APP_ID! } },
      (error: any) => {
        if (error) {
          console.error("Circle updateConfigs error:", error);
          onCompleted?.(error);
          reject(error);
          return;
        }

        circleSdk.setAuthentication({ userToken, encryptionKey });
        circleSdk.execute(challengeId, (executeError: any, result: any) => {
          if (executeError) {
            console.error("Circle execute challenge error:", executeError);
            onCompleted?.(executeError, result);
            reject(executeError);
            return;
          }

          onCompleted?.(null, result);
          resolve(result);
        });
      }
    );
  });
}

export async function pollTransactionStatus(challengeId: string, userToken: string): Promise<string> {
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 3000));

    const res = await fetch("/api/circle/transaction-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId, userToken }),
    });

    const data = (await res.json()) as { state?: string; txHash?: string; error?: string };
    console.log(`Poll ${i}:`, data.state, data.txHash ?? data.error ?? "");

    if (data.state === "COMPLETE" && data.txHash) return data.txHash;
    if (data.state === "FAILED" || data.state === "DENIED") {
      throw new Error("Circle transaction was denied or failed.");
    }
  }

  throw new Error("Transaction timed out. Check Arc Scan for status.");
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

  executeChallenge(challengeId, userToken, encryptionKey);

  return pollTransactionStatus(challengeId, userToken);
}

export { sdk };
