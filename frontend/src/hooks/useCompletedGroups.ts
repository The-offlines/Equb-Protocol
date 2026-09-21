"use client";

import { useCallback, useEffect, useState } from "react";
import type { Abi, Address } from "viem";

import { useFactory } from "@/src/hooks/useFactory";
import { EqubGroup, type FactoryGroupInfo } from "@/src/lib/contract";
import { publicClient } from "@/src/lib/arc";
import { formatUsdcAmount } from "@/src/lib/format";

export type CompletedGroupInfo = FactoryGroupInfo & {
  memberCount: number;
  currentRound: number;
  status: number;
  currentPool: number;
};

export function useCompletedGroups() {
  const { groups, isLoading: factoryLoading, error: factoryError, refetch: refetchFactory } = useFactory();
  const [completedGroups, setCompletedGroups] = useState<CompletedGroupInfo[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);

  const refetch = useCallback(async () => {
    setIsLoadingGroups(true);
    await refetchFactory(true);
    setReloadVersion((version) => version + 1);
  }, [refetchFactory]);

  useEffect(() => {
    if (factoryLoading) {
      return;
    }

    let isActive = true;

    const loadGroups = async () => {
      const results = await Promise.all(
        groups.map(async (group) => {
          try {
            const address = group.groupAddress as Address;
            const [memberCount, currentRound, status, currentPool] = await Promise.all([
              publicClient.readContract({ address, abi: EqubGroup as Abi, functionName: "memberCount" }),
              publicClient.readContract({ address, abi: EqubGroup as Abi, functionName: "currentRound" }),
              publicClient.readContract({ address, abi: EqubGroup as Abi, functionName: "status" }),
              publicClient.readContract({ address, abi: EqubGroup as Abi, functionName: "getCurrentPool" }),
            ]);

            // Status 2 is Completed
            if (Number(status) !== 2) {
              return null;
            }

            return {
              ...group,
              maxMembers: Number(group.maxMembers),
              interval: Number(group.interval),
              memberCount: Number(memberCount),
              currentRound: Number(currentRound),
              status: Number(status),
              currentPool: formatUsdcAmount(currentPool as bigint),
            };
          } catch {
            return null;
          }
        }),
      );

      if (isActive) {
        setCompletedGroups(results.filter((group): group is CompletedGroupInfo => group !== null));
        setIsLoadingGroups(false);
        setFetchError(null);
      }
    };

    const timeoutId = window.setTimeout(() => {
      setIsLoadingGroups(true);
      void loadGroups().catch(() => {
        if (isActive) {
          setCompletedGroups([]);
          setFetchError("We could not load the completed groups. Try refreshing the page.");
          setIsLoadingGroups(false);
        }
      });
    }, 0);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [factoryLoading, groups, reloadVersion]);

  return {
    groups: completedGroups,
    isLoading: factoryLoading || isLoadingGroups,
    error: factoryError ?? fetchError,
    refetch,
  };
}
