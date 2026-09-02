import { NextResponse } from "next/server";
import { initiateUserControlledWalletsClient } from "@circle-fin/user-controlled-wallets";

export async function POST(request: Request) {
  try {
    const {
      userToken,
      walletId,
      contractAddress,
      abiFunctionSignature,
      abiParameters,
    } = (await request.json()) as {
      userToken?: string;
      walletId?: string;
      contractAddress?: string;
      abiFunctionSignature?: string;
      abiParameters?: unknown[];
    };

    if (!userToken || !walletId || !contractAddress || !abiFunctionSignature) {
      return NextResponse.json({ error: "Contract execution details are required." }, { status: 400 });
    }

    const apiKey = process.env.CIRCLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Circle API key is not configured." }, { status: 500 });
    }

    const circleResponse = await fetch(
      "https://api.circle.com/v1/w3s/user/transactions/contractExecution",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "X-User-Token": userToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idempotencyKey: crypto.randomUUID(),
          walletId,
          contractAddress,
          abiFunctionSignature,
          abiParameters,
          feeLevel: "HIGH",
        }),
      },
    );

    const circleData = (await circleResponse.json()) as {
      data?: { challengeId?: string };
      error?: { message?: string; code?: number };
    };

    console.log("Circle contractExecution response:", JSON.stringify(circleData, null, 2));

    if (!circleResponse.ok) {
      return NextResponse.json(
        { error: circleData.error?.message ?? "Circle API error", code: circleData.error?.code },
        { status: circleResponse.status },
      );
    }

    const challengeId = circleData.data?.challengeId;
    if (!challengeId) {
      return NextResponse.json({ error: "Circle did not return a challenge ID." }, { status: 502 });
    }

    return NextResponse.json({ challengeId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create Circle contract execution challenge.";
    const code = typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code)
      : undefined;
    console.error("Circle execute-contract error:", { message, code, error });
    return NextResponse.json(
      { error: code ? `${message} (Circle error ${code})` : message, code },
      { status: 502 },
    );
  }
}
