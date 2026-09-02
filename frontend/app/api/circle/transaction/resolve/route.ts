import { NextResponse } from "next/server";
import { initiateUserControlledWalletsClient } from "@circle-fin/user-controlled-wallets";

type WalletClient = {
  listWallets: (input: { userToken: string; address: string; blockchain: "ARC-TESTNET" }) => Promise<{
    data?: { wallets?: Array<{ id?: string; address?: string }> };
  }>;
  listTransactions: (input: {
    userToken: string;
    walletIds: string[];
    blockchain: "ARC-TESTNET";
    destinationAddress: string;
    order: "DESC";
  }) => Promise<{
    data?: { transactions?: Array<{ txHash?: string }> };
  }>;
};

export async function POST(request: Request) {
  try {
    const { userToken, walletAddress, contractAddress } = (await request.json()) as {
      userToken?: string;
      walletAddress?: string;
      contractAddress?: string;
    };

    if (!userToken || !walletAddress || !contractAddress) {
      return NextResponse.json({ error: "Transaction details are required." }, { status: 400 });
    }

    const apiKey = process.env.CIRCLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Circle API key is not configured." }, { status: 500 });
    }

    const client = initiateUserControlledWalletsClient({ apiKey }) as unknown as WalletClient;
    const walletResponse = await client.listWallets({
      userToken,
      address: walletAddress,
      blockchain: "ARC-TESTNET",
    });
    const wallet = walletResponse.data?.wallets?.find(
      (candidate) => candidate.address?.toLowerCase() === walletAddress.toLowerCase(),
    );

    if (!wallet?.id) {
      return NextResponse.json({ error: "Circle could not resolve the Arc wallet." }, { status: 409 });
    }

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const transactions = await client.listTransactions({
        userToken,
        walletIds: [wallet.id],
        blockchain: "ARC-TESTNET",
        destinationAddress: contractAddress,
        order: "DESC",
      });
      const txHash = transactions.data?.transactions?.find((transaction) => transaction.txHash)?.txHash;
      if (txHash) return NextResponse.json({ txHash });
      if (attempt < 5) await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return NextResponse.json({ error: "Circle completed the approval, but the transaction hash is not available yet." }, { status: 502 });
  } catch (error) {
    console.error("Circle transaction resolution error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to resolve Circle transaction." },
      { status: 502 },
    );
  }
}
