import { NextResponse } from "next/server";
import { initiateUserControlledWalletsClient } from "@circle-fin/user-controlled-wallets";

type CircleWallet = {
  blockchain?: string;
  address?: string;
  state?: string;
};

type CircleClient = ReturnType<typeof initiateUserControlledWalletsClient>;

async function findArcWallet(client: CircleClient, userToken: string) {
  const walletsResponse = await client.listWallets({ userToken });
  const wallets: CircleWallet[] = walletsResponse.data?.wallets ?? [];
  const arcWallet = wallets.find(
    (wallet) => wallet.address && wallet.blockchain?.toUpperCase().replace("_", "-") === "ARC-TESTNET",
  );

  return { walletAddress: arcWallet?.address ?? null, wallets };
}

export async function POST(request: Request) {
  try {
    const { email, deviceId, userId: requestedUserId, userToken, encryptionKey, challengeId } = (await request.json()) as {
      email?: string;
      deviceId?: string;
      userId?: string;
      userToken?: string;
      encryptionKey?: string;
      challengeId?: string;
    };

    const isVerificationRequest = Boolean(userToken || encryptionKey || challengeId);

    const apiKey = process.env.CIRCLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Circle API key is not configured." }, { status: 500 });
    }

    const client = initiateUserControlledWalletsClient({ apiKey });

    if (isVerificationRequest) {
      if (!requestedUserId || !userToken || !encryptionKey) {
        return NextResponse.json({ error: "Verification details are required." }, { status: 400 });
      }

      const verifiedUserToken = userToken;
      // Circle can take a few seconds to index the wallet after the PIN iframe
      // closes, so do not turn that normal delay into a permanent 502.
      const walletSearch = await findArcWallet(client, verifiedUserToken);
      console.log("Circle wallets:", JSON.stringify(walletSearch.wallets, null, 2));

      if (walletSearch.walletAddress) {
        return NextResponse.json({ walletAddress: walletSearch.walletAddress });
      }

      if (challengeId) {
        return NextResponse.json({ walletAddress: null, pending: true }, { status: 202 });
      }

      const walletChallenge = walletSearch.wallets.length > 0
        ? await client.createWallet({
            userToken: verifiedUserToken,
            blockchains: ["ARC-TESTNET"],
            idempotencyKey: crypto.randomUUID(),
          })
        : await client.createUserPinWithWallets({
            userToken: verifiedUserToken,
            blockchains: ["ARC-TESTNET"],
            idempotencyKey: crypto.randomUUID(),
          });
      const newChallengeId = walletChallenge.data?.challengeId;
      if (!newChallengeId) {
        return NextResponse.json({ error: "Circle did not return a setup challenge." }, { status: 502 });
      }
      return NextResponse.json({ walletAddress: null, challengeId: newChallengeId });
    }

    if (!email?.trim() || !deviceId) {
      return NextResponse.json({ error: "Email and device ID are required." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userId = normalizedEmail;

    // Email login is tied to a Circle user. Creating the deterministic user
    // before issuing the device token also gives the client a userId to use
    // when it completes wallet setup. Circle returns an error when the user
    // already exists, which is the normal sign-in path, so ignore only that
    // idempotent conflict.
    try {
      await client.createUser({ userId });
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      const code = typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code)
        : "";
      if (!message.includes("already") && !message.includes("exist") && code !== "155101") {
        throw error;
      }
    }

    const response = await client.createDeviceTokenForEmailLogin({
      idempotencyKey: crypto.randomUUID(),
      email: email.trim(),
      deviceId,
    });

    const data = response.data;

    console.log("Circle OTP response:", JSON.stringify(data, null, 2));

    if (!data?.deviceToken || !data.deviceEncryptionKey || !data.otpToken) {
      return NextResponse.json({ error: "Circle did not return OTP session credentials." }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      deviceToken: data.deviceToken,
      deviceEncryptionKey: data.deviceEncryptionKey,
      otpToken: data.otpToken,
      userId,
    });

  } catch (error) {
    console.error("Circle OTP full error:", JSON.stringify(error, null, 2));
    console.error("Circle OTP message:", error instanceof Error ? error.message : String(error));
    console.error("Circle OTP code:", typeof error === "object" && error !== null && "code" in error ? (error as { code?: unknown }).code : "no code");

    const message = error instanceof Error ? error.message : "Unable to send OTP.";
    const code = typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code)
      : undefined;

    return NextResponse.json(
      { error: code ? `${message} (Circle error ${code})` : message, code },
      { status: 502 },
    );
  }
}
