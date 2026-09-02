import type { Address } from "viem";

export const ARC_CHAIN_ID = 5042002;
export const ARC_RPC_URL = process.env.NEXT_PUBLIC_ARC_RPC_URL ?? "https://rpc.testnet.arc.network";

export const ZERO_ADDRESS: Address = "0x0000000000000000000000000000000000000000";

export const FACTORY_ADDRESS =
  (process.env.NEXT_PUBLIC_FACTORY_ADDRESS as Address | undefined) ?? ZERO_ADDRESS;
export const REGISTRY_ADDRESS =
  (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as Address | undefined) ?? ZERO_ADDRESS;
export const GROUP_IMPLEMENTATION_ADDRESS =
  (process.env.NEXT_PUBLIC_GROUP_IMPLEMENTATION_ADDRESS as Address | undefined) ?? ZERO_ADDRESS;

export const CONTRACT_ADDRESSES = {
  FACTORY_ADDRESS,
  REGISTRY_ADDRESS,
  GROUP_IMPLEMENTATION_ADDRESS,
} as const;
