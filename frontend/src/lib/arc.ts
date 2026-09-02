import { createPublicClient, createWalletClient, custom, defineChain, http } from "viem";

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
      http: ["https://rpc.testnet.arc.network"],
    },
    public: {
      http: ["https://rpc.testnet.arc.network"],
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
  transport: http(arcTestnet.rpcUrls.default.http[0]),
  batch: {
    multicall: true,
  },
});

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
