import { createPublicClient, createWalletClient, custom, defineChain, fallback, http } from "viem";

const DEFAULT_RPC_URL = "https://rpc.testnet.arc.network";
const configuredRpcUrl = process.env.NEXT_PUBLIC_ARC_RPC_URL?.trim() || DEFAULT_RPC_URL;
const configuredRpcUrls = process.env.NEXT_PUBLIC_ARC_RPC_URLS
  ?.split(",")
  .map((url) => url.trim())
  .filter(Boolean) ?? [];
const rpcUrls = [...new Set([...configuredRpcUrls, configuredRpcUrl, DEFAULT_RPC_URL])];
const MULTICALL3_ADDRESS = "0xca11bde05977b3631167028862be2a173976ca11" as const;

export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USD Coin",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: rpcUrls,
    },
    public: {
      http: rpcUrls,
    },
  },
  contracts: {
    multicall3: {
      address: MULTICALL3_ADDRESS,
    },
  },
  blockExplorers: {
    default: {
      name: "Arc Scan",
      url: "https://scan.arc.network",
    },
  },
});

export const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: fallback(
    rpcUrls.map((url) => http(url, { timeout: 30_000, retryCount: 2, retryDelay: 500 })),
    { rank: false },
  ),
  batch: {
    multicall: true,
  },
});

export const ARC_CHAIN_ID = arcTestnet.id;

/** Batch view calls so a slow Arc RPC request cannot stall every field independently. */
export async function readContractBatch<T = unknown>(contracts: readonly unknown[], attempts = 3): Promise<T[]> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const result = await publicClient.multicall({
        contracts: contracts as never,
        allowFailure: false,
      });
      return result as T[];
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
      }
    }
  }

  // A few Arc gateways have briefly rejected the Multicall3 request while
  // ordinary eth_call was still available. Keep the detail page usable by
  // falling back to serialized reads instead of issuing another burst.
  try {
    const results: unknown[] = [];
    for (const contract of contracts) {
      results.push(await publicClient.readContract(contract as never));
    }
    return results as T[];
  } catch (fallbackError) {
    lastError = fallbackError;
  }

  throw lastError instanceof Error ? lastError : new Error("Arc contract reads failed.");
}

export async function getWalletClient(address: `0x${string}`) {
  if (typeof window === "undefined") {
    return null;
  }

  const provider = (window as Window & { ethereum?: { request?: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;

  if (!provider) {
    return null;
  }

  return createWalletClient({
    account: address,
    chain: arcTestnet,
    transport: custom(provider as never),
  });
}
