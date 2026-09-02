import { NextResponse } from "next/server";
import { initiateUserControlledWalletsClient } from "@circle-fin/user-controlled-wallets";

type WalletLookupClient = {
  listWallets: (input: { userToken: string; address: string; blockchain: "ARC-TESTNET" }) => Promise<{
    data?: { wallets?: Array<{ id?: string; address?: string; blockchain?: string }> };
  }>;
};

export async function POST(request: Request) {
  try {
    const {
      userToken,
      walletAddress,
      contractAddress,
      callData,
      amount,
    } = (await request.json()) as {
      userToken?: string;
      walletAddress?: string;
      contractAddress?: string;
      callData?: `0x${string}`;
      amount?: string;
    };

    if (!userToken || !walletAddress || !contractAddress || !callData) {
      return NextResponse.json({ error: "Transaction details are required." }, { status: 400 });
    }

    const apiKey = process.env.CIRCLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Circle API key is not configured." }, { status: 500 });
    }

    const client = initiateUserControlledWalletsClient({ apiKey });
    const walletClient = client as unknown as WalletLookupClient;
    const walletResponse = await walletClient.listWallets({
      userToken,
      address: walletAddress,
      blockchain: "ARC-TESTNET",
    });
    const wallet = walletResponse.data?.wallets?.find(
      (candidate) => candidate.address?.toLowerCase() === walletAddress.toLowerCase(),
    );

    if (!wallet?.id) {
      return NextResponse.json({
        error: "Your Circle wallet is not registered on Arc Testnet. Please sign out and sign in again to create the correct wallet.",
      }, { status: 409 });
    }

    const response = await client.createUserTransactionContractExecutionChallenge({
      idempotencyKey: crypto.randomUUID(),
      userToken,
      walletAddress,
      contractAddress,
      callData,
      blockchain: "ARC-TESTNET",
      amount: amount ?? undefined,
      fee: {
        type: "level",
        config: {
          feeLevel: "HIGH",
        },
      },
    });

    const challengeId = response.data?.challengeId;
    if (!challengeId) {
      return NextResponse.json({ error: "Circle did not return a transaction challenge." }, { status: 502 });
    }

    const transactionData = response.data as unknown as { id?: string; txHash?: string } | undefined;
    return NextResponse.json({
      challengeId,
      id: transactionData?.id ?? null,
      txHash: transactionData?.txHash ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create Circle transaction.";
    const code = typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code)
      : undefined;
    console.error("Circle transaction error:", { message, code });
    return NextResponse.json({
      error: code ? `${message} (Circle error ${code})` : message,
    }, { status: 502 });
  }
}
