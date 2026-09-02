"use client";

import { useCallback, useEffect, useState } from "react";
import type { Address } from "viem";

import { getGroupContract, type GroupContractData } from "@/src/lib/contract";

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

      const contract = getGroupContract(address as Address);

      if (!contract) {
        setData(null);
        setError("Group contract is not configured for Arc Testnet.");
        setIsLoading(false);
        return;
      }

      const [groupName, dagna, contributionAmount, maxMembers, memberCount, currentRound, status, interval, isPrivate, emergencyMode, members] =
        await Promise.all([
          contract.read.groupName(),
          contract.read.dagna(),
          contract.read.contributionAmount(),
          contract.read.maxMembers(),
          contract.read.memberCount(),
          contract.read.currentRound(),
          contract.read.status(),
          contract.read.interval(),
          contract.read.isPrivate(),
          contract.read.emergencyMode(),
          contract.read.getMembers(),
        ]);

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
        members: (members as Address[]) ?? [],
      });
    } catch (caughtError) {
      console.error("useGroup error:", caughtError);
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
