import { NextResponse } from "next/server";
import { initiateUserControlledWalletsClient } from "@circle-fin/user-controlled-wallets";

export async function POST(request: Request) {
  try {
    const { email, userId: requestedUserId } = (await request.json()) as { email?: string; userId?: string };
    const normalizedEmail = email?.trim().toLowerCase();
    const userId = requestedUserId?.trim() || normalizedEmail || "";

    if (!userId) {
      return NextResponse.json({ error: "Email or user ID is required." }, { status: 400 });
    }

    const apiKey = process.env.CIRCLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Circle API key is not configured." }, { status: 500 });
    }

    const client = initiateUserControlledWalletsClient({ apiKey });
    if (normalizedEmail) {
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
    }

    const tokenResponse = await client.createUserToken({ userId });
    const tokenData = tokenResponse.data;

    if (!tokenData?.userToken || !tokenData.encryptionKey) {
      return NextResponse.json({ error: "Circle did not return user credentials." }, { status: 502 });
    }

    const walletsResponse = await client.listWallets({ userToken: tokenData.userToken });
    const wallet = walletsResponse.data?.wallets?.[0];

    return NextResponse.json({
      userToken: tokenData.userToken,
      encryptionKey: tokenData.encryptionKey,
      userId,
      walletId: wallet?.id ?? null,
      walletAddress: wallet?.address ?? null,
    });
  } catch (error) {
    console.error("Circle session error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create Circle session." },
      { status: 502 },
    );
  }
}
