import { NextRequest, NextResponse } from "next/server";
import { initiateUserControlledWalletsClient } from "@circle-fin/user-controlled-wallets";
import crypto from "crypto";
import { FACTORY_ADDRESS as DEFAULT_CONTRACT_ADDRESS } from "@/src/lib/contract";

const CREATE_GROUP_SIGNATURE = "createGroup(string,uint256,uint32,uint8,bool,bool)";

type ExecuteContractBody = {
  userToken?: string;
  walletId?: string;
  // Flat create-group fields.
  name?: string;
  contributionAmount?: string | number;
  maxMembers?: number | string;
  interval?: number | string;
  isPrivate?: boolean;
  manualPayout?: boolean;
  // Explicit contract-call fields (used by contribute/join/invite flows).
  contractAddress?: string;
  abiFunctionSignature?: string;
  abiParameters?: string[];
  value?: string;
};

type ContractExecutionRequest = {
  contractAddress: string;
  abiFunctionSignature: string;
  abiParameters: string[];
};

export async function POST(req: NextRequest) {
  try {
    let body: ExecuteContractBody;
    try {
      body = (await req.json()) as ExecuteContractBody;
    } catch {
      return NextResponse.json(
        { error: "Request body must be valid JSON." },
        { status: 400 },
      );
    }

    console.log("execute-contract body received:", JSON.stringify(body));

    const { userToken, walletId } = body;
    if (!userToken || !walletId) {
      return NextResponse.json(
        { error: "userToken and walletId are required." },
        { status: 400 },
      );
    }

    const apiKey = process.env.CIRCLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Circle API key is not configured." },
        { status: 500 },
      );
    }

    // Resolve the contract call. Prefer an explicit contract address +
    // signature + parameters (contribute/join/invite); otherwise build the
    // `createGroup(...)` call from the flat group fields.
    let request: ContractExecutionRequest;
    if (body.contractAddress && body.abiFunctionSignature && body.abiParameters) {
      if (!body.contractAddress.trim()) {
        return NextResponse.json(
          { error: "contractAddress field may not be empty." },
          { status: 400 },
        );
      }
      request = {
        contractAddress: body.contractAddress,
        abiFunctionSignature: body.abiFunctionSignature,
        abiParameters: body.abiParameters,
      };
    } else {
      const { name, contributionAmount, maxMembers, interval, isPrivate, manualPayout } = body;

      const hasContribution =
        contributionAmount !== undefined &&
        contributionAmount !== null &&
        contributionAmount !== "";
      if (
        !name ||
        !hasContribution ||
        maxMembers === undefined ||
        maxMembers === null ||
        interval === undefined ||
        interval === null ||
        isPrivate === undefined ||
        isPrivate === null ||
        manualPayout === undefined ||
        manualPayout === null
      ) {
        return NextResponse.json(
          { error: "Group details are required." },
          { status: 400 },
        );
      }

      request = {
        contractAddress: DEFAULT_CONTRACT_ADDRESS,
        abiFunctionSignature: CREATE_GROUP_SIGNATURE,
        abiParameters: [
          name,
          String(contributionAmount),
          String(maxMembers),
          String(interval),
          isPrivate ? "true" : "false",
          manualPayout ? "true" : "false",
        ],
      };
    }

    if (!request.contractAddress || !request.abiFunctionSignature) {
      return NextResponse.json(
        { error: "contractAddress and abiFunctionSignature are required." },
        { status: 400 },
      );
    }

    const client = initiateUserControlledWalletsClient({ apiKey });

    const contractExecutionParams: any = {
      userToken,
      walletId,
      contractAddress: request.contractAddress,
      abiFunctionSignature: request.abiFunctionSignature,
      abiParameters: request.abiParameters,
      fee: { type: "level", config: { feeLevel: "HIGH" } },
      idempotencyKey: crypto.randomUUID(),
    };

    const amountInWholeUnits = body.value ? (Number(body.value) / 1e18).toString() : undefined;

    if (amountInWholeUnits && amountInWholeUnits !== "0") {
      contractExecutionParams.amount = amountInWholeUnits;
    }

    const response = await client.createUserTransactionContractExecutionChallenge(contractExecutionParams);

    const challengeId = response.data?.challengeId;
    console.log("Circle contract execution response:", JSON.stringify(response.data));

    if (!challengeId) {
      return NextResponse.json(
        { error: "Circle did not return a challenge ID." },
        { status: 502 },
      );
    }

    return NextResponse.json({ challengeId });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to create Circle contract execution challenge.";
    console.error("execute-contract error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}