"use client";

import { useCallback, useEffect, useState } from "react";
import { getAddress, isAddress, type Address } from "viem";

import { EqubGroup, getGroupContract, type GroupContractData } from "@/src/lib/contract";
import { readContractBatch } from "@/src/lib/arc";

export function useGroup(address?: Address | string) {
  const [data, setData] = useState<GroupContractData | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(address));
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!address) {
      setData(null);
      setIsLoading(false);
      setError("No group address was supplied.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (!isAddress(address)) {
        setData(null);
        setError("The group address is not valid.");
        return;
      }

      const groupAddress = getAddress(address) as Address;
      const contract = getGroupContract(groupAddress);

      if (!contract) {
        setData(null);
        setError("Group contract is not configured for Arc Testnet.");
        setIsLoading(false);
        return;
      }

      const [groupName, dagna, contributionAmount, maxMembers, memberCount, currentRound, status, interval, isPrivate, emergencyMode, members, currentPool] =
        await readContractBatch([
          { address: groupAddress, abi: EqubGroup, functionName: "groupName" },
          { address: groupAddress, abi: EqubGroup, functionName: "dagna" },
          { address: groupAddress, abi: EqubGroup, functionName: "contributionAmount" },
          { address: groupAddress, abi: EqubGroup, functionName: "maxMembers" },
          { address: groupAddress, abi: EqubGroup, functionName: "memberCount" },
          { address: groupAddress, abi: EqubGroup, functionName: "currentRound" },
          { address: groupAddress, abi: EqubGroup, functionName: "status" },
          { address: groupAddress, abi: EqubGroup, functionName: "interval" },
          { address: groupAddress, abi: EqubGroup, functionName: "isPrivate" },
          { address: groupAddress, abi: EqubGroup, functionName: "emergencyMode" },
          { address: groupAddress, abi: EqubGroup, functionName: "getMembers" },
          { address: groupAddress, abi: EqubGroup, functionName: "getCurrentPool" },
        ]);

      const memberAddresses = (members as Address[]) ?? [];
      const memberInfos = memberAddresses.length === 0
        ? []
        : await readContractBatch(
            memberAddresses.map((memberAddress) => ({
              address: groupAddress,
              abi: EqubGroup,
              functionName: "memberInfo",
              args: [memberAddress],
            })),
          );
      const memberDetails = memberAddresses.map((memberAddress, index) => {
        const info = memberInfos[index] as readonly [boolean, boolean, boolean, number, bigint];
        return {
          address: memberAddress,
          joined: info[0],
          receivedPayout: info[1],
          paidCurrentRound: info[2],
          joinedRound: Number(info[3]),
          joinedAt: info[4],
        };
      });

      setData({
        groupName: String(groupName),
        dagna: dagna as Address,
        contributionAmount: contributionAmount as bigint,
        maxMembers: Number(maxMembers),
        memberCount: Number(memberCount),
        currentRound: Number(currentRound),
        status: Number(status),
        interval: Number(interval),
        isPrivate: Boolean(isPrivate),
        emergencyMode: Boolean(emergencyMode),
        members: memberAddresses,
        memberDetails,
        currentPool: currentPool as bigint,
      });
    } catch (caughtError) {
      console.warn("useGroup read failed; Arc RPC will be retried on the next refresh.");
      setData(null);
      setError(caughtError instanceof Error ? caughtError.message : "Failed to load group details.");
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refetch();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [refetch]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}
