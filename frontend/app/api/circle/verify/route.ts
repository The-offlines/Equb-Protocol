import { NextResponse } from "next/server";
import { initiateUserControlledWalletsClient } from "@circle-fin/user-controlled-wallets";

export async function POST(request: Request) {
  try {
    const { userId, userToken, encryptionKey, otp, challengeId } = (await request.json()) as {
      userId?: string;
      userToken?: string;
      encryptionKey?: string;
      otp?: string;
      challengeId?: string;
    };

    if (!userId || !userToken || !encryptionKey || (!otp && !challengeId)) {
      return NextResponse.json({ error: "Verification details are required." }, { status: 400 });
    }

    const apiKey = process.env.CIRCLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Circle API key is not configured." }, { status: 500 });
    }

    const client = initiateUserControlledWalletsClient({ apiKey });

    // Fetch ALL wallets for this user regardless of blockchain
    const walletsResponse = await client.listWallets({ userToken });
    const wallets = (walletsResponse.data?.wallets ?? []) as any[];

    console.log("All user wallets:", JSON.stringify(wallets.map(w => ({ blockchain: w.blockchain, address: w.address, state: w.state })), null, 2));

    // First priority: ARC-TESTNET wallet
    const arcWallet = wallets.find((w) => w.blockchain === "ARC-TESTNET" && w.address);
    if (arcWallet?.address) {
      return NextResponse.json({ walletAddress: arcWallet.address });
    }

    // No ARC-TESTNET wallet — create one for existing user
    if (wallets.length > 0 && !challengeId) {
      const createResponse = await fetch("https://api.circle.com/v1/w3s/user/wallets", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "X-User-Token": userToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idempotencyKey: crypto.randomUUID(),
          blockchains: ["ARC-TESTNET"],
        }),
      });
      const createData = (await createResponse.json()) as { data?: { challengeId?: string }; error?: { message?: string } };
      console.log("Create ARC wallet response:", JSON.stringify(createData, null, 2));
      
      const newChallengeId = createData.data?.challengeId;
      if (newChallengeId) {
        return NextResponse.json({ walletAddress: null, challengeId: newChallengeId });
      }
      // If wallet creation fails, fall through to use existing wallet
      const anyWallet = wallets.find((w: any) => w.address);
      if (anyWallet?.address) {
        return NextResponse.json({ walletAddress: anyWallet.address });
      }
    }

    // User is initialized but no wallet address yet — return error
    if (wallets.length > 0) {
      return NextResponse.json({ 
        error: "Your wallet is still being set up. Please wait a moment and try again." 
      }, { status: 502 });
    }

    // User not initialized — create wallet
    if (!challengeId) {
      try {
        const pinChallenge = await client.createUserPinWithWallets({
          userToken,
          blockchains: ["ARC-TESTNET"],
          idempotencyKey: crypto.randomUUID(),
        } as any);
        const newChallengeId = pinChallenge.data?.challengeId;
        if (!newChallengeId) {
          return NextResponse.json({ error: "Circle did not return a setup challenge." }, { status: 502 });
        }
        return NextResponse.json({ walletAddress: null, challengeId: newChallengeId });
      } catch (createError: any) {
        console.error("createUserPinWithWallets error:", createError);
        throw createError;
      }
    }

    return NextResponse.json({ error: "Wallet setup incomplete. Please try again." }, { status: 502 });

  } catch (error) {
    console.error("Circle verification error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to verify OTP." },
      { status: 502 },
    );
  }
}
