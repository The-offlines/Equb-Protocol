import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { transactionId, challengeId, userToken } = (await request.json()) as {
      transactionId?: string;
      challengeId?: string;
      userToken?: string;
    };

    if ((!transactionId && !challengeId) || !userToken) {
      return NextResponse.json({ error: "Transaction ID or challenge ID and user token are required." }, { status: 400 });
    }

    const apiKey = process.env.CIRCLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Circle API key is not configured." }, { status: 500 });
    }

    let url = "";
    if (transactionId) {
      url = `https://api.circle.com/v1/w3s/user/transactions/${encodeURIComponent(transactionId)}`;
    } else {
      url = `https://api.circle.com/v1/w3s/user/transactions?challengeIds=${encodeURIComponent(challengeId)}`;
    }

    console.log("Polling with:", { url, userToken: userToken?.substring(0, 20) + "..." });

    const circleResponse = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "X-User-Token": userToken,
      },
    });

    const circleData = (await circleResponse.json()) as {
      data?: { 
        transaction?: { state?: string; txHash?: string };
        transactions?: Array<{ state?: string; txHash?: string }>;
      };
      error?: { message?: string };
    };

    console.log("Circle transaction-status response:", JSON.stringify(circleData, null, 2));

    if (!circleResponse.ok) {
      return NextResponse.json(
        { error: circleData.error?.message ?? "Circle API error" },
        { status: circleResponse.status },
      );
    }

    const tx = circleData.data?.transaction ?? circleData.data?.transactions?.[0];
    const state = tx?.state;
    const txHash = tx?.txHash;

    return NextResponse.json({ state, txHash });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to check transaction status." },
      { status: 500 },
    );
  }
}
