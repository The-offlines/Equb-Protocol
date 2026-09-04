import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { txHash?: string };
    const txHash = body.txHash;

    if (!txHash || typeof txHash !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
      return NextResponse.json({ error: "Invalid txHash", receipt: null }, { status: 400 });
    }

    const rpcResponse = await fetch("https://rpc.testnet.arc.network", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getTransactionReceipt",
        params: [txHash],
      }),
      signal: AbortSignal.timeout(30_000),
    });
    const rpcData = (await rpcResponse.json()) as { result?: unknown; error?: unknown };

    if (rpcData.error) {
      console.error("[arc-receipt] RPC error");
      return NextResponse.json({ error: "RPC error", receipt: null }, { status: 502 });
    }

    return NextResponse.json({ receipt: rpcData.result ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[arc-receipt] Error:", message);
    return NextResponse.json({ error: message, receipt: null }, { status: 500 });
  }
}