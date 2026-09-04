import { initiateUserControlledWalletsClient } from "@circle-fin/user-controlled-wallets";
import { NextResponse } from "next/server";

type CircleTransaction = {
  id?: string;
  state?: string;
  txHash?: string;
  blockHeight?: string;
  operation?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      walletId?: string;
      transactionId?: string;
      userToken?: string;
    };
    const walletId = body.walletId;
    const transactionId = body.transactionId;
    const userToken = body.userToken ?? request.headers.get("x-user-token") ?? undefined;

    if (!walletId || !userToken) {
      return NextResponse.json({ error: "walletId and userToken are required." }, { status: 400 });
    }

    const apiKey = process.env.CIRCLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Circle API key is not configured." }, { status: 500 });
    }

    const client = initiateUserControlledWalletsClient({ apiKey });
    const response = await client.listTransactions({
      userToken,
      operation: "CONTRACT_EXECUTION",
      walletIds: [walletId],
      pageSize: 5,
      order: "DESC",
    });
    const transactions = response.data?.transactions as CircleTransaction[] | undefined;
    const transaction = Array.isArray(transactions)
      ? transactions.find((candidate) => !transactionId || candidate.id === transactionId)
      : undefined;
    const state = transaction?.state ?? "PENDING";
    const txHash = transaction?.txHash;
    console.log("[EQUB TX POLL] Transaction state", {
      walletId,
      requestedTransactionId: transactionId,
      transactionId: transaction?.id,
      state,
      txHash: txHash ?? "not yet available",
    });

    if (!transaction) return NextResponse.json({ state: "PENDING", txHash: null });
    if (["FAILED", "DENIED", "CANCELLED"].includes(state)) {
      return NextResponse.json({ state, txHash: txHash ?? null, errorReason: "Circle transaction failed." });
    }
    return NextResponse.json({ state, txHash: txHash ?? null, blockHeight: transaction.blockHeight, operation: transaction.operation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to check transaction status.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
