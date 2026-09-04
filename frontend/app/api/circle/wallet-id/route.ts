import { NextResponse } from "next/server";
import { initiateUserControlledWalletsClient } from "@circle-fin/user-controlled-wallets";

type Wallet = { id?: string; address?: string };

export async function POST(request: Request) {
  try {
    const { userId } = (await request.json()) as { userId?: string };

    if (!userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    const apiKey = process.env.CIRCLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Circle API key is not configured." }, { status: 500 });
    }

    const client = initiateUserControlledWalletsClient({ apiKey });
    const tokenResponse = await client.createUserToken({ userId });
    const userToken = tokenResponse.data?.userToken;
    if (!userToken) {
      return NextResponse.json({ error: "Circle did not return a user token." }, { status: 502 });
    }

    const walletsResponse = await client.listWallets({ userToken });
    const wallets = walletsResponse.data?.wallets ?? [];
    let wallet = wallets[0] as Wallet | undefined;

    if (!wallet) {
      const createResponse = await client.createWallet({
        userToken,
        blockchains: ["ARC-TESTNET"],
        idempotencyKey: crypto.randomUUID(),
      });
      const createdWallet = (createResponse as unknown as { data?: { wallets?: Wallet[] } }).data?.wallets?.[0];
      if (createdWallet) wallet = createdWallet;

      if (!wallet) {
        return NextResponse.json({ error: "Circle wallet creation requires user approval." }, { status: 202 });
      }
    }

    const walletId = wallet.id;
    if (!walletId) {
      return NextResponse.json({ error: "Wallet ID not found." }, { status: 502 });
    }

    return NextResponse.json({ walletId, walletAddress: wallet.address });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch wallet ID." },
      { status: 500 },
    );
  }
}
