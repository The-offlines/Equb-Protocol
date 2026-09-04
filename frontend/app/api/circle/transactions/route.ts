import { initiateUserControlledWalletsClient } from "@circle-fin/user-controlled-wallets";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const userToken = searchParams.get("userToken");
  const walletId = searchParams.get("walletId");

  if (!userToken || !walletId) {
    return NextResponse.json({ error: "userToken and walletId are required." }, { status: 400 });
  }

  const apiKey = process.env.CIRCLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Circle API key is not configured." }, { status: 500 });
  }

  try {
    const client = initiateUserControlledWalletsClient({ apiKey });
    const response = await client.listTransactions({
      userToken,
      walletIds: [walletId],
      operation: "CONTRACT_EXECUTION",
      pageSize: 5,
      order: "DESC",
    });
    return NextResponse.json({ transactions: response.data?.transactions ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to list Circle transactions.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}