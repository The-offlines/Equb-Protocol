"use client";

import { useCallback, useEffect, useState } from "react";

import { FACTORY_ADDRESS, getFactoryContract, type FactoryGroupInfo } from "@/src/lib/contract";

let cachedData: { groups: FactoryGroupInfo[]; totalGroups: bigint } | null = null;
let cacheTime = 0;

export function clearCache() {
  cachedData = null;
  cacheTime = 0;
}

export function useFactory() {
  const [groups, setGroups] = useState<FactoryGroupInfo[]>([]);
  const [totalGroups, setTotalGroups] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (cachedData && Date.now() - cacheTime < 30000) {
        setGroups(cachedData.groups);
        setTotalGroups(cachedData.totalGroups);
        setIsLoading(false);
        return;
      }

      const contract = getFactoryContract(FACTORY_ADDRESS);

      const factoryData = await Promise.all([
        contract.read.getAllGroups(),
        contract.read.totalGroups(),
      ]);

      const [allGroups, groupCount] = factoryData as [FactoryGroupInfo[], bigint];

      cachedData = {
        groups: allGroups as FactoryGroupInfo[],
        totalGroups: groupCount as bigint,
      };
      cacheTime = Date.now();

      setGroups(cachedData.groups);
      setTotalGroups(cachedData.totalGroups);
    } catch (caughtError) {
      console.error("useFactory error:", caughtError);
      if (cachedData) {
        setGroups(cachedData.groups);
        setTotalGroups(cachedData.totalGroups);
        setError(null);
        return;
      }

      setError(caughtError instanceof Error ? caughtError.message : "Failed to load factory data.");
      setGroups([]);
      setTotalGroups(BigInt(0));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refetch();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [refetch]);

  return {
    groups,
    totalGroups,
    isLoading,
    error,
    refetch,
  };
}
