import { NextResponse } from "next/server";
import { initiateUserControlledWalletsClient } from "@circle-fin/user-controlled-wallets";

export async function POST(request: Request) {
  try {
    const { userToken, walletId, name, contributionAmount, maxMembers, interval, isPrivate, contractAddress, abiFunctionSignature, abiParameters } = (await request.json()) as {
      userToken?: string;
      walletId?: string;
      name?: string;
      contributionAmount?: string;
      maxMembers?: number;
      interval?: number;
      isPrivate?: boolean;
      contractAddress?: string;
      abiFunctionSignature?: string;
      abiParameters?: string[];
    };

    if (!userToken || !walletId || (!name && !abiFunctionSignature) || (!abiParameters && (!contributionAmount || maxMembers === undefined || interval === undefined || isPrivate === undefined))) {
      return NextResponse.json({ error: "Group details are required." }, { status: 400 });
    }

    const apiKey = process.env.CIRCLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Circle API key is not configured." }, { status: 500 });
    }

<<<<<<< Updated upstream
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
      error?: { message?: string; code?: number | string; details?: unknown };
    };

    console.log("Circle contractExecution response:", JSON.stringify(circleData, null, 2));

    if (!circleResponse.ok) {
      return NextResponse.json(
        {
          error: circleData.error?.message ?? `Circle API HTTP ${circleResponse.status}`,
          code: circleData.error?.code,
          details: circleData.error?.details,
        },
        { status: circleResponse.status },
      );
    }

    const challengeId = circleData.data?.challengeId;
=======
    const client = initiateUserControlledWalletsClient({ apiKey });
    const executionClient = client as unknown as Record<string, (params: Record<string, unknown>) => Promise<{ data?: { challengeId?: string } }>>;
    const contributionAmountInWei = name ? BigInt(contributionAmount!).toString() : undefined;
    const response = await executionClient[name ? "createContractExecutionTransaction" : "createUserTransactionContractExecutionChallenge"]({
      userToken,
      walletId,
      contractAddress: name ? "0xe8eb461A424a4702473aCC35ad9ADA2bbb8BFAdA" : contractAddress!,
      abiFunctionSignature: name ? "createGroup(string,uint256,uint32,uint8,bool)" : abiFunctionSignature,
      abiParameters: name ? [name, contributionAmountInWei!, maxMembers!.toString(), interval!.toString(), isPrivate ? "true" : "false"] : abiParameters,
      fee: { type: "level", config: { feeLevel: "MEDIUM" } },
      idempotencyKey: crypto.randomUUID(),
    });

    const challengeId = response.data?.challengeId;
>>>>>>> Stashed changes
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
