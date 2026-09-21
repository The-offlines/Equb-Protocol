"use client";

import { useCallback, useState } from "react";
import { useCircleContext } from "@/src/providers/CircleProvider";
import { executeChallenge } from "@/src/lib/circle";
import { useGroup } from "@/src/hooks/useGroup";

export function useActivateGroup(groupAddress: string) {
  const { userToken, encryptionKey } = useCircleContext();
  const { refetch } = useGroup(groupAddress);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activateGroup = useCallback(async () => {
    setIsLoading(true);
    setIsSuccess(false);
    setError(null);

    try {
      if (!userToken || !encryptionKey) {
        throw new Error("Your Circle session has expired. Please sign in again.");
      }

      const walletResponse = await fetch("/api/circle/wallet-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userToken, encryptionKey }),
      });
      const walletData = await walletResponse.json();

      if (!walletResponse.ok || !walletData.walletId) {
        throw new Error(walletData.error ?? "Unable to fetch Circle wallet.");
      }

      const challengeResponse = await fetch("/api/circle/execute-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userToken,
          walletId: walletData.walletId,
          contractAddress: groupAddress,
          abiFunctionSignature: "activateGroup()",
          abiParameters: [],
        }),
      });

      const challengeData = await challengeResponse.json();
      if (!challengeResponse.ok || !challengeData.challengeId) {
        throw new Error(challengeData.error ?? "Unable to create Circle contract challenge.");
      }

      executeChallenge(
        userToken,
        encryptionKey,
        challengeData.challengeId,
        async (challengeError, result) => {
          if (challengeError) {
            setError(challengeError.message);
            setIsLoading(false);
            return;
          }

          if (result?.status === "COMPLETE") {
            setIsSuccess(true);
            setIsLoading(false);
            void refetch();

            // Send activation email to all group members
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
                  dueDate: string | null;
                };
              };
              const group = groupData.group;

              if (group?.id) {
                const membersRes = await fetch(`/api/member/sync`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ userToken, contractAddress: groupAddress }),
                });
                const membersData = await membersRes.json() as { member?: { walletAddress: string } };

                await fetch("/api/notifications", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    walletAddress: membersData.member?.walletAddress ?? groupAddress,
                    groupId: group.id,
                    type: "PAYMENT_REMINDER",
                    txHash: null,
                    metadata: {
                      groupName: group.name,
                      contributionAmount: group.contributionAmount,
                      maxMembers: group.maxMembers,
                      dueDate: group.dueDate,
                      subject: `Your Equb Group "${group.name}" is Now Active! 🚀`,
                      message: `Round 1 has started! Your contribution amount is ${group.contributionAmount} ARC. Please make your payment before the due date.`,
                    },
                  }),
                });
              }
            } catch (e) {
              console.warn("Failed to send activation emails", e);
            }
          } else if (result?.status === "FAILED") {
            setError("Transaction failed");
            setIsLoading(false);
          }
        }
      );
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to activate group.");
      setIsLoading(false);
    }
  }, [groupAddress, userToken, encryptionKey, refetch]);

  return { activateGroup, isLoading, isSuccess, error };
}
