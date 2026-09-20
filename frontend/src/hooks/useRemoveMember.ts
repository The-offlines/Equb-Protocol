"use client";

import { useCallback, useState } from "react";
import { getAddress } from "viem";

import { useCircleContext } from "@/src/providers/CircleProvider";
import { publicClient } from "@/src/lib/arc";
import { executeEmbeddedContractTransaction, getCircleWalletId } from "@/src/lib/circle";

export function useRemoveMember(groupAddress: string) {
  const { walletAddress, userToken, encryptionKey } = useCircleContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const removeMember = useCallback(async (memberAddress: string): Promise<boolean> => {
    setIsLoading(true);
    setIsSuccess(false);
    setError(null);

    if (!walletAddress || !userToken || !encryptionKey) {
      setError("Sign in with your Circle wallet before removing a member.");
      setIsLoading(false);
      return false;
    }

    try {
      const parsedAddress = getAddress(memberAddress.trim());

      const ownerWalletId = await getCircleWalletId(userToken, walletAddress);
      const hash = await executeEmbeddedContractTransaction({
        userToken,
        encryptionKey,
        walletId: ownerWalletId,
        contractAddress: getAddress(groupAddress),
        abiFunctionSignature: "removeMember(address)",
        abiParameters: [String(parsedAddress)],
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}` });
      if (receipt.status !== "success") {
        throw new Error("The transaction was not confirmed.");
      }

      setIsSuccess(true);
      window.dispatchEvent(new Event("equb-data-updated"));
      return true;
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unable to remove this wallet.";
      const normalized = message.toLowerCase();
      if (normalized.includes("cannotremovepaidmember") || normalized.includes("0xeb7a06c8")) {
        setError("This member has already paid for the current round and cannot be removed.");
      } else if (normalized.includes("cannotremovewinner") || normalized.includes("0xa16885df")) {
        setError("This member has already received a payout and cannot be removed.");
      } else {
        setError(message);
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [encryptionKey, groupAddress, userToken, walletAddress]);

  return { removeMember, isLoading, isSuccess, error };
}
