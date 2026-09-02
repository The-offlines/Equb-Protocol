import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const apiKey = process.env.CIRCLE_API_KEY;
    const userToken = request.headers.get("x-user-token") ?? request.headers.get("X-User-Token");
    const { id } = await params;
    if (!apiKey) return NextResponse.json({ error: "Circle API key is not configured." }, { status: 500 });
    if (!id) return NextResponse.json({ error: "Transaction ID is required." }, { status: 400 });
    if (!userToken) return NextResponse.json({ error: "User token is required." }, { status: 400 });

    const response = await fetch(`https://api.circle.com/v1/w3s/user/transactions/${encodeURIComponent(id)}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-User-Token": userToken,
      },
      cache: "no-store",
    });
    const payload = await response.json();
    if (!response.ok) return NextResponse.json({ error: payload?.error ?? payload?.message ?? "Circle status request failed." }, { status: response.status });
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to read Circle transaction status." }, { status: 502 });
  }
}
