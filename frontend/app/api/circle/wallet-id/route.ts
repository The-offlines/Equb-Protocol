import { NextResponse } from "next/server";
import { initiateUserControlledWalletsClient } from "@circle-fin/user-controlled-wallets";

/*
type Wallet = { id?: string; address?: string };

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userToken = searchParams.get("userToken");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    const apiKey = process.env.CIRCLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Circle API key is not configured." }, { status: 500 });
    }

    const circleResponse = await fetch("https://api.circle.com/v1/w3s/wallets", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "X-User-Token": userToken,
      },
    });

    const circleData = (await circleResponse.json()) as {
      data?: { wallets?: Array<{ id?: string }> };
      error?: { message?: string };
    };

    if (!circleResponse.ok) {
      return NextResponse.json(
        { error: circleData.error?.message ?? "Circle API error" },
        { status: circleResponse.status },
      );
    }

    const wallets = circleData.data?.wallets ?? [];
    if (wallets.length === 0) {
      return NextResponse.json({ error: "No wallets found for user." }, { status: 404 });
    }

    const arcWallet = wallets.find((w: any) => w.blockchain === "ARC-TESTNET");
    const walletId = arcWallet?.id ?? wallets[0]?.id;
    if (!walletId) {
      return NextResponse.json({ error: "Wallet ID not found." }, { status: 502 });
*/
export async function POST(request: Request) {
  try {
    const { userToken, encryptionKey } = (await request.json()) as { userToken?: string; encryptionKey?: string };

    if (!userToken) {
      return NextResponse.json({ error: "User token is required" }, { status: 400 });
    }

    console.log('userToken JWT payload:', JSON.parse(Buffer.from(userToken.split('.')[1], 'base64').toString()));

    const client = initiateUserControlledWalletsClient({
      apiKey: process.env.CIRCLE_API_KEY!,
    });

    console.log("Listing wallets for the provided user token...");
    const walletsResponse = await client.listWallets({ userToken, blockchain: "ARC-TESTNET" });
    const wallets = walletsResponse.data?.wallets ?? [];
    console.log("Wallets found:", JSON.stringify(wallets));

    if (wallets.length === 0) {
      console.log('No wallets found, creating ARC-TESTNET wallet...');
      try {
        const createWalletResponse = await (client.createWallet as unknown as (params: Record<string, unknown>) => Promise<{ data?: { challengeId?: string } }>)({
          userToken,
          blockchains: ['ARC-TESTNET'],
          count: 1,
        });
        console.log('Create wallet response:', JSON.stringify(createWalletResponse.data));
        return NextResponse.json({
          needsWalletInit: true,
          challengeId: createWalletResponse.data?.challengeId,
          userToken,
          encryptionKey,
        }, { status: 200 });
      } catch (createError: unknown) {
        const message = createError instanceof Error ? createError.message : String(createError);
        console.log('Create wallet error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }

    const wallet = wallets.find((wallet) => wallet.blockchain === "ARC-TESTNET");
    if (!wallet) {
      return NextResponse.json({ error: "No ARC-TESTNET wallet found" }, { status: 404 });
    }

    return NextResponse.json({ walletId: wallet.id, walletAddress: wallet.address });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch wallet ID" },
      { status: 500 },
    );
  }
}
