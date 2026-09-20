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
        (challengeError, result) => {
          if (challengeError) {
            setError(challengeError.message);
            setIsLoading(false);
            return;
          }

          if (result?.status === "COMPLETE") {
            setIsSuccess(true);
            setIsLoading(false);
            void refetch();
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
