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
    const response = await client.listTransactions({ userToken });
    const allTxs = response.data?.transactions ?? [];
    
    console.log('All transactions:', JSON.stringify(allTxs.map(t => ({ id: t.id, state: t.state, createDate: t.createDate }))));

    const transactions = allTxs.filter(t => t.walletId === walletId);

    // Fetch and log detailed error information for any failed transactions
    for (const t of transactions) {
      if (t.state === "FAILED" && t.id) {
        try {
          const txDetails = await client.getTransaction({ userToken, id: t.id });
          console.error(`Full error details for failed tx ${t.id}:`, JSON.stringify(txDetails.data));
        } catch (e) {
          console.error(`Failed to fetch details for tx ${t.id}:`, e);
        }
      }
    }

    return NextResponse.json({ transactions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to list Circle transactions.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}