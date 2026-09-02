import type { Abi, Address } from "viem";
import { getContract } from "viem";

import { publicClient } from "@/src/lib/arc";
import factoryArtifact from "@/src/lib/contracts/EqubFactory.json";
import groupArtifact from "@/src/lib/contracts/EqubGroup.json";
import registryArtifact from "@/src/lib/contracts/EqubRegistry.json";

export const ZERO_ADDRESS: Address = "0x0000000000000000000000000000000000000000";
export const FACTORY_ADDRESS: Address = "0xe8eb461A424a4702473aCC35ad9ADA2bbb8BFAdA";
export const REGISTRY_ADDRESS: Address = "0xB699C7ED2d72Cef7330A4265f2018AbC959D4598";
export const GROUP_IMPL_ADDRESS: Address = "0x7C40e9b11377b7B2a9a20f72A5d501D1AB601309";

export const CONTRACT_ADDRESSES = {
  FACTORY_ADDRESS,
  REGISTRY_ADDRESS,
  GROUP_IMPLEMENTATION_ADDRESS: GROUP_IMPL_ADDRESS,
} as const;

export type FactoryGroupInfo = {
  groupAddress: Address;
  dagna: Address;
  name: string;
  contributionAmount: bigint;
  maxMembers: number;
  interval: number;
  isPrivate: boolean;
  createdAt: bigint;
};

export type RegistryGroup = {
  group: Address;
  dagna: Address;
  name: string;
  contributionAmount: bigint;
  maxMembers: number;
  currentMembers: number;
  interval: number;
  isPrivate: boolean;
  active: boolean;
  createdAt: bigint;
};

export type GroupContractData = {
  groupName: string;
  dagna: Address;
  contributionAmount: bigint;
  maxMembers: number;
  memberCount: number;
  currentRound: number;
  status: number;
  interval: number;
  isPrivate: boolean;
  emergencyMode: boolean;
  members: Address[];
};

const factoryAbi = factoryArtifact.abi as Abi;
const registryAbi = registryArtifact.abi as Abi;
const groupAbi = groupArtifact.abi as Abi;

export const EqubFactory = factoryAbi;
export const EqubRegistry = registryAbi;
export const EqubGroup = groupAbi;

const hasAddress = (address: Address | string | undefined) => Boolean(address && address !== ZERO_ADDRESS);

export function getFactoryContract(address: Address = FACTORY_ADDRESS) {
  return getContract({
    address,
    abi: factoryAbi,
    client: publicClient,
  });
}

export function getRegistryContract(address: Address = REGISTRY_ADDRESS) {
  return getContract({
    address,
    abi: registryAbi,
    client: publicClient,
  });
}

export function getGroupContract(address: Address) {
  if (!hasAddress(address)) {
    return null;
  }

  return getContract({
    address,
    abi: groupAbi,
    client: publicClient,
  });
}
