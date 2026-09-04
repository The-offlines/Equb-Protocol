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

    if (!userToken || !walletId || !contractAddress || !abiFunctionSignature || !Array.isArray(abiParameters)) {
      return NextResponse.json({ error: "Contract execution details are required." }, { status: 400 });
    }

    const apiKey = process.env.CIRCLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Circle API key is not configured." }, { status: 500 });
    }

    const client = initiateUserControlledWalletsClient({ apiKey });
    const circleResponse = await client.createUserTransactionContractExecutionChallenge({
      userToken,
      walletId,
      contractAddress,
      abiFunctionSignature,
      abiParameters: abiParameters as never[],
      fee: { type: "level", config: { feeLevel: "MEDIUM" } },
      idempotencyKey: crypto.randomUUID(),
    });

    const circleData = circleResponse as {
      data?: { challengeId?: string };
    };

    const challengeId = circleData.data?.challengeId;
    if (!challengeId) {
      return NextResponse.json({ error: "Circle did not return a challenge ID." }, { status: 502 });
    }
    console.log("[EQUB CREATE] Challenge created", { challengeId });

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
