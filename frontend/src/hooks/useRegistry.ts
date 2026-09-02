"use client";

import { useCallback, useEffect, useState } from "react";

import { FACTORY_ADDRESS, getFactoryContract, type FactoryGroupInfo } from "@/src/lib/contract";

let cachedData: FactoryGroupInfo[] | null = null;
let cacheTime = 0;

export function clearCache() {
  cachedData = null;
  cacheTime = 0;
}

export function useRegistry() {
  const [groups, setGroups] = useState<FactoryGroupInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (cachedData && Date.now() - cacheTime < 30000) {
        setGroups(cachedData);
        setIsLoading(false);
        return;
      }

      const contract = getFactoryContract(FACTORY_ADDRESS);

      const factoryGroups = (await contract.read.getAllGroups()) as FactoryGroupInfo[];

      cachedData = factoryGroups;
      cacheTime = Date.now();
      setGroups(factoryGroups);
    } catch (caughtError) {
      console.error("useRegistry error:", caughtError);
      if (cachedData) {
        setGroups(cachedData);
        setError(null);
        return;
      }

      setError(caughtError instanceof Error ? caughtError.message : "Failed to load groups.");
      setGroups([]);
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
    isLoading,
    error,
    refetch,
  };
}
