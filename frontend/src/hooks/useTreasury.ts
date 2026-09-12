"use client";

import { useCallback, useEffect, useState } from "react";
import type { Abi, Address } from "viem";

import { readContractBatch } from "@/src/lib/arc";
import { EqubGroup } from "@/src/lib/contract";
import { formatUsdcAmount } from "@/src/lib/format";

type TreasuryData = {
  contributionAmount: number;
  memberCount: number;
  paidCount: number;
  currentRound: number;
  status: number;
  currentPool: number;
  remainingMembers: number;
  progressPercent: number;
};

const initialData: TreasuryData = {
  contributionAmount: 0,
  memberCount: 0,
  paidCount: 0,
  currentRound: 0,
  status: 0,
  currentPool: 0,
  remainingMembers: 0,
  progressPercent: 0,
};

export function useTreasury(groupAddress: string) {
  const [data, setData] = useState<TreasuryData>(initialData);
  const [isLoading, setIsLoading] = useState(Boolean(groupAddress));
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!groupAddress) {
      setData(initialData);
      setIsLoading(false);
      setError("No group address was supplied.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const address = groupAddress as Address;
      const [contributionAmount, memberCount, paidCount, currentRound, status, currentPool] = await readContractBatch([
        { address, abi: EqubGroup as Abi, functionName: "contributionAmount" },
        { address, abi: EqubGroup as Abi, functionName: "memberCount" },
        { address, abi: EqubGroup as Abi, functionName: "paidCount" },
        { address, abi: EqubGroup as Abi, functionName: "currentRound" },
        { address, abi: EqubGroup as Abi, functionName: "status" },
        { address, abi: EqubGroup as Abi, functionName: "getCurrentPool" },
      ]);

      const totalMembers = Number(memberCount);
      const paidMembers = Number(paidCount);
      setData({
        contributionAmount: formatUsdcAmount(contributionAmount as bigint),
        memberCount: totalMembers,
        paidCount: paidMembers,
        currentRound: Number(currentRound),
        status: Number(status),
        currentPool: formatUsdcAmount(currentPool as bigint),
        remainingMembers: totalMembers - paidMembers,
        progressPercent: totalMembers > 0 ? (paidMembers / totalMembers) * 100 : 0,
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to load treasury data.");
    } finally {
      setIsLoading(false);
    }
  }, [groupAddress]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refetch();
    }, 0);
    const intervalId = window.setInterval(() => {
      void refetch();
    }, 30000);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [refetch]);

  return { ...data, isLoading, error, refetch };
}
