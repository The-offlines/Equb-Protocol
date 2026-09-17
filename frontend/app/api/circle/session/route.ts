import crypto from "crypto";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, deviceId } = (await request.json()) as { email?: string; deviceId?: string };
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const apiKey = process.env.CIRCLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Circle API key is not configured." }, { status: 500 });
    }

    console.log('API Key first 20 chars:', process.env.CIRCLE_API_KEY?.substring(0, 20));
    console.log('Request URL:', 'https://api.circle.com/v1/w3s/users/email/token');
    const requestBody = {
      email: normalizedEmail,
      deviceId: deviceId || "equb-web-device",
      idempotencyKey: crypto.randomUUID(),
    };
    console.log('Request body:', JSON.stringify(requestBody));

    const response = await fetch('https://api.circle.com/v1/w3s/users/email/token', {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${process.env.CIRCLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    const payload = (await response.json()) as Record<string, unknown> & { data?: Record<string, unknown> };
    console.log('Circle API status:', response.status);
    console.log('Circle API response:', JSON.stringify(payload));

    if (!response.ok) {
      const message = typeof payload.message === "string" ? payload.message : "Unable to create Circle email session.";
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const data = payload.data ?? payload;
    return NextResponse.json({
      ...data,
      userToken: data.userToken,
      encryptionKey: data.encryptionKey,
      deviceToken: data.deviceToken,
      deviceEncryptionKey: data.deviceEncryptionKey,
      otpToken: data.otpToken,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create Circle session." },
      { status: 500 },
    );
  }
}
