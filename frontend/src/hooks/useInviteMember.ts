"use client";

import { useCallback, useState } from "react";
import { getAddress, type Address } from "viem";

import { useCircleContext } from "@/src/providers/CircleProvider";
import { publicClient } from "@/src/lib/arc";
import { executeEmbeddedContractTransaction, getCircleWalletId } from "@/src/lib/circle";

export function useInviteMember(groupAddress: string) {
  const { walletAddress, userToken, encryptionKey } = useCircleContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inviteMember = useCallback(async (invitee: string): Promise<boolean> => {
    setIsLoading(true);
    setIsSuccess(false);
    setError(null);

    if (!walletAddress || !userToken || !encryptionKey) {
      setError("Sign in with your Circle wallet before sending an invite.");
      setIsLoading(false);
      return false;
    }

    try {
      const inviteeAddress = getAddress(invitee.trim()) as Address;
      const ownerWalletId = await getCircleWalletId(userToken, walletAddress);
      const hash = await executeEmbeddedContractTransaction({
        userToken,
        encryptionKey,
        walletId: ownerWalletId,
        contractAddress: getAddress(groupAddress),
        abiFunctionSignature: "inviteMember(address)",
        abiParameters: [inviteeAddress],
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}` });
      if (receipt.status !== "success") {
        throw new Error("The invite transaction was not confirmed.");
      }

      setIsSuccess(true);
      window.dispatchEvent(new Event("equb-data-updated"));
      return true;
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unable to invite this wallet.";
      const normalized = message.toLowerCase();
      if (normalized.includes("invalid address")) {
        setError("Enter a valid wallet address starting with 0x.");
      } else if (normalized.includes("already") && normalized.includes("member")) {
        setError("That wallet is already a member of this group.");
      } else if (normalized.includes("groupfull")) {
        setError("This group has reached its member limit.");
      } else if (normalized.includes("notforming")) {
        setError("Invites are closed once the first round has started.");
      } else {
        setError(message);
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [encryptionKey, groupAddress, userToken, walletAddress]);

  return { inviteMember, isLoading, isSuccess, error };
}
