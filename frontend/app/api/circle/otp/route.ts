import { NextResponse } from "next/server";
import { initiateUserControlledWalletsClient } from "@circle-fin/user-controlled-wallets";

export async function POST(request: Request) {
  try {
    const { email, deviceId, userId } = (await request.json()) as { 
      email?: string; 
      deviceId?: string; 
      userId?: string 
    };

    if (!email?.trim() || !deviceId) {
      return NextResponse.json({ error: "Email and device ID are required." }, { status: 400 });
    }

    const apiKey = process.env.CIRCLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Circle API key is not configured." }, { status: 500 });
    }

    const client = initiateUserControlledWalletsClient({ apiKey });
    const normalizedEmail = email.trim().toLowerCase();
    const userIdForCreation = userId || `equb-${normalizedEmail}`;

    try {
      await client.createUser({ userId: userIdForCreation });
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