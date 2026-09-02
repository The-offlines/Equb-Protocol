import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userToken = searchParams.get("userToken");

    if (!userToken) {
      return NextResponse.json({ error: "User token is required." }, { status: 400 });
    }

    const apiKey = process.env.CIRCLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Circle API key is not configured." }, { status: 500 });
    }

    const circleResponse = await fetch("https://api.circle.com/v1/w3s/wallets", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "X-User-Token": userToken,
      },
    });

    const circleData = (await circleResponse.json()) as {
      data?: { wallets?: Array<{ id?: string }> };
      error?: { message?: string };
    };

    if (!circleResponse.ok) {
      return NextResponse.json(
        { error: circleData.error?.message ?? "Circle API error" },
        { status: circleResponse.status },
      );
    }

    const wallets = circleData.data?.wallets ?? [];
    if (wallets.length === 0) {
      return NextResponse.json({ error: "No wallets found for user." }, { status: 404 });
    }

    const arcWallet = wallets.find((w: any) => w.blockchain === "ARC-TESTNET");
    const walletId = arcWallet?.id ?? wallets[0]?.id;
    if (!walletId) {
      return NextResponse.json({ error: "Wallet ID not found." }, { status: 502 });
    }

    return NextResponse.json({ walletId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch wallet ID." },
      { status: 500 },
    );
  }
}
