import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const address = new URL(request.url).searchParams.get("address");
  if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  try {
    const rpcResponse = await fetch("https://rpc.testnet.arc.network", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getBalance", params: [address, "latest"] }),
      signal: AbortSignal.timeout(30_000),
    });
    const rpcData = (await rpcResponse.json()) as { result?: string; error?: unknown };
    if (rpcData.error || typeof rpcData.result !== "string") {
      return NextResponse.json({ error: "RPC error" }, { status: 502 });
    }
    return NextResponse.json({ balance: rpcData.result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to read Arc balance." }, { status: 502 });
  }
}