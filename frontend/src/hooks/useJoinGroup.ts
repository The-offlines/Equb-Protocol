"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { getAddress, type Address } from "viem";

import { useCircleContext } from "@/src/providers/CircleProvider";
import { publicClient } from "@/src/lib/arc";
import { executeEmbeddedContractTransaction } from "@/src/lib/circle";
import { EqubGroup } from "@/src/lib/contract";

export function useJoinGroup() {
  const router = useRouter();
  const { walletAddress, userToken, encryptionKey } = useCircleContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinGroup = useCallback(async (groupAddress: string): Promise<boolean> => {
    setIsLoading(true);
    setIsSuccess(false);
    setError(null);

    if (!walletAddress || !userToken || !encryptionKey) {
      setError("Please sign in first.");
      setIsLoading(false);
      return false;
    }

    try {
      const address = getAddress(groupAddress) as Address;

      const hash = await executeEmbeddedContractTransaction({
        userToken,
        encryptionKey,
        walletId: walletAddress,
        contractAddress: address,
        abiFunctionSignature: "joinGroup()",
        abiParameters: [],
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}` });
      if (receipt.status === "reverted") throw new Error("Transaction reverted.");

      setIsSuccess(true);
      window.dispatchEvent(new Event("equb-data-updated"));
      window.sessionStorage.setItem("equb_join_success", address);
      window.setTimeout(() => router.push(`/group/${address}`), 2000);
      return true;
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to join group.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [encryptionKey, router, userToken, walletAddress]);

  return { joinGroup, isLoading, isSuccess, error };
}
