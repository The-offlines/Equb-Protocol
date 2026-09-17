import { NextResponse } from "next/server";
import { initiateUserControlledWalletsClient } from "@circle-fin/user-controlled-wallets";

export async function POST(request: Request) {
  try {
    const { userId } = (await request.json()) as { userId?: string };
    if (!userId) return NextResponse.json({ error: "User ID is required." }, { status: 400 });

    const apiKey = process.env.CIRCLE_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Circle API key is not configured." }, { status: 500 });

    const client = initiateUserControlledWalletsClient({ apiKey });
    const freshToken = await client.createUserToken({ userId });
    const tokenData = freshToken.data;
    if (!tokenData?.userToken || !tokenData.encryptionKey) {
      return NextResponse.json({ error: "Circle did not return fresh user credentials." }, { status: 502 });
    }

    const response = await (client as unknown as {
      createWalletPinChallenge: (params: { userToken: string }) => Promise<{ data?: { challengeId?: string } }>;
    }).createWalletPinChallenge({ userToken: tokenData.userToken });
    const challengeId = response.data?.challengeId;
    if (!challengeId) return NextResponse.json({ error: "Circle did not return a PIN challenge ID." }, { status: 502 });

    return NextResponse.json({ challengeId, userToken: tokenData.userToken, encryptionKey: tokenData.encryptionKey });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to initialize Circle wallet." }, { status: 500 });
  }
}