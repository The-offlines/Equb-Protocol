import type { Abi, Address } from "viem";
import { getContract } from "viem";

import { publicClient } from "@/src/lib/arc";
import factoryArtifact from "@/src/lib/contracts/EqubFactory.json";
import groupArtifact from "@/src/lib/contracts/EqubGroup.json";
import registryArtifact from "@/src/lib/contracts/EqubRegistry.json";

export const ZERO_ADDRESS: Address = "0x0000000000000000000000000000000000000000";
export const FACTORY_ADDRESS: Address = "0x01897C1196d3ec3dE3B2DA77D1033957c6FA113F";
export const REGISTRY_ADDRESS: Address = "0x586623DBe3eA140cBD26FAD6e42E0190bd02ae22";
export const GROUP_IMPL_ADDRESS: Address = "0xC1F900599c4F2B55A89064ad8404c5d72E18f0e1";

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
  memberDetails: GroupContractMember[];
  currentPool: bigint;
  pastWinners: { round: number; winner: Address }[];
  manualPayout: boolean;
};

export type GroupContractMember = {
  address: Address;
  joined: boolean;
  receivedPayout: boolean;
  paidCurrentRound: boolean;
  joinedRound: number;
  joinedAt: bigint;
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
