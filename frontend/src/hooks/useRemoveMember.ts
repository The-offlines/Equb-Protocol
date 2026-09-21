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

      // Send removed email to the removed member and notify all group members
      try {
        const groupRes = await fetch("/api/groups/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userToken, contractAddress: groupAddress }),
        });
        const groupData = await groupRes.json() as {
          group?: {
            id: string;
            name: string;
            contributionAmount: number;
            maxMembers: number;
          };
        };
        const group = groupData.group;

        // Email to the removed member
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress: parsedAddress,
            groupId: group?.id ?? null,
            type: "PAYMENT_REMINDER",
            txHash: hash,
            metadata: {
              groupName: group?.name ?? groupAddress,
              removedBy: walletAddress,
              subject: `You Have Been Removed from "${group?.name ?? groupAddress}" ⚠️`,
              message: `You have been removed from the Equb group "${group?.name ?? groupAddress}" by the group creator (${walletAddress}). If you believe this was a mistake, please contact the group creator directly.`,
            },
          }),
        });

        // Email to all remaining group members
        if (group?.id) {
          await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              walletAddress: `group:${group.id}`,
              groupId: group.id,
              type: "MEMBER_JOINED",
              txHash: hash,
              metadata: {
                groupName: group.name,
                removedMember: parsedAddress,
                removedBy: walletAddress,
                subject: `Member Removed from "${group.name}" 🔔`,
                message: `Member ${parsedAddress} has been removed from your Equb group "${group.name}" by the creator.`,
              },
            }),
          });
        }
      } catch (e) {
        console.warn("Failed to send member removed emails", e);
      }

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
