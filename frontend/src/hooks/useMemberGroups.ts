"use client";

import { useCallback, useEffect, useState } from "react";
import type { Abi, Address } from "viem";

import { useCircleContext } from "@/src/providers/CircleProvider";
import { useFactory } from "@/src/hooks/useFactory";
import { EqubGroup, type FactoryGroupInfo } from "@/src/lib/contract";
import { publicClient } from "@/src/lib/arc";
import { formatUsdcAmount } from "@/src/lib/format";

export type MemberGroupInfo = FactoryGroupInfo & {
  memberCount: number;
  currentRound: number;
  status: number;
  currentPool: number;
  hasPaid: boolean;
};

export function useMemberGroups() {
  const { groups, isLoading: factoryLoading, error: factoryError, refetch: refetchFactory } = useFactory();
  const { walletAddress } = useCircleContext();
  const [memberGroups, setMemberGroups] = useState<MemberGroupInfo[]>([]);
  const [loadedWallet, setLoadedWallet] = useState<string | null>(null);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);

  const refetch = useCallback(async () => {
    setIsLoadingMembers(true);
    await refetchFactory(true);
    setReloadVersion((version) => version + 1);
  }, [refetchFactory]);

  useEffect(() => {
    if (factoryLoading || !walletAddress) {
      return;
    }

    let isActive = true;

    const loadMemberGroups = async () => {
      const results = await Promise.all(
        groups.map(async (group) => {
          try {
            const address = group.groupAddress as Address;
            const [isMember, memberCount, currentRound, status, currentPool, memberInfo] = await Promise.all([
              publicClient.readContract({ address, abi: EqubGroup as Abi, functionName: "isMember", args: [walletAddress as Address] }),
              publicClient.readContract({ address, abi: EqubGroup as Abi, functionName: "memberCount" }),
              publicClient.readContract({ address, abi: EqubGroup as Abi, functionName: "currentRound" }),
              publicClient.readContract({ address, abi: EqubGroup as Abi, functionName: "status" }),
              publicClient.readContract({ address, abi: EqubGroup as Abi, functionName: "getCurrentPool" }),
              publicClient.readContract({ address, abi: EqubGroup as Abi, functionName: "memberInfo", args: [walletAddress as Address] }),
            ]);

            if (!isMember) {
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
              hasPaid: Boolean((memberInfo as readonly unknown[])[2]),
            };
          } catch {
            return null;
          }
        }),
      );

      if (isActive) {
        setMemberGroups(results.filter((group): group is MemberGroupInfo => group !== null));
        setLoadedWallet(walletAddress);
        setIsLoadingMembers(false);
        setMemberError(null);
      }
    };

    const timeoutId = window.setTimeout(() => {
      setIsLoadingMembers(true);
      void loadMemberGroups().catch(() => {
      if (isActive) {
        setMemberGroups([]);
        setLoadedWallet(walletAddress);
        setMemberError("We could not verify your group memberships. Try refreshing the page.");
        setIsLoadingMembers(false);
      }
      });
    }, 0);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [factoryLoading, groups, reloadVersion, walletAddress]);

  return {
    groups: walletAddress && loadedWallet === walletAddress ? memberGroups : [],
    isLoading: factoryLoading || isLoadingMembers || Boolean(walletAddress && loadedWallet !== walletAddress),
    error: factoryError ?? memberError,
    refetch,
  };
}
