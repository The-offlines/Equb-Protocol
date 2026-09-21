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
      const inviteeAddress = getAddress(invitee.trim());

      const ownerWalletId = await getCircleWalletId(userToken, walletAddress);
      const hash = await executeEmbeddedContractTransaction({
        userToken,
        encryptionKey,
        walletId: ownerWalletId,
        contractAddress: getAddress(groupAddress),
        abiFunctionSignature: "inviteMember(address)",
        abiParameters: [String(inviteeAddress)],
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}` });
      if (receipt.status !== "success") {
        throw new Error("The invite transaction was not confirmed.");
      }

      setIsSuccess(true);
      window.dispatchEvent(new Event("equb-data-updated"));

      // Send invite emails
      try {
        // Look up invitee email from profile
        const inviteeProfileRes = await fetch('/api/member/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress: inviteeAddress }),
        });
        const inviteeProfile = await inviteeProfileRes.json() as { email?: string };

        // Get group details
        const groupRes = await fetch('/api/groups/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contractAddress: groupAddress }),
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

        // Email to the invitee using their real email
        if (inviteeProfile.email) {
          await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              walletAddress: inviteeAddress,
              groupId: group?.id ?? null,
              type: 'MEMBER_JOINED',
              txHash: null,
              metadata: {
                groupName: group?.name ?? groupAddress,
                contributionAmount: group?.contributionAmount ?? null,
                maxMembers: group?.maxMembers ?? null,
                invitedBy: walletAddress,
              },
            }),
          });
        }

        // Email to the creator
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: walletAddress,
            groupId: group?.id ?? null,
            type: 'MEMBER_JOINED',
            txHash: null,
            metadata: {
              groupName: group?.name ?? groupAddress,
              inviteeAddress: inviteeProfile.email ?? inviteeAddress,
            },
          }),
        });
      } catch (e) {
        console.warn('Failed to send invite emails', e);
      }

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
