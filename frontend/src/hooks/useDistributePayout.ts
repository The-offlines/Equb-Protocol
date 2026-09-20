"use client";

import { useCallback, useRef, useState } from "react";
import { useCircleContext } from "@/src/providers/CircleProvider";
import { executeChallenge } from "@/src/lib/circle";

export function useDistributePayout(groupAddress: string) {
  const { userToken, encryptionKey } = useCircleContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash] = useState<string | null>(null);
  const distributePayoutRef = useRef<(() => Promise<void>) | null>(null);

  const distributePayout = useCallback(async () => {
    setIsLoading(true);
    setIsSuccess(false);
    setError(null);

    try {
      if (!userToken || !encryptionKey) throw new Error("Your Circle session has expired. Please sign in again.");

      const walletResponse = await fetch("/api/circle/wallet-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userToken, encryptionKey }),
      });
      const walletData = (await walletResponse.json()) as {
        walletId?: string;
        needsWalletInit?: boolean;
        challengeId?: string;
        error?: string;
      };

      if (walletData.needsWalletInit && walletData.challengeId) {
        executeChallenge(userToken, encryptionKey, walletData.challengeId, (challengeError, result) => {
          if (challengeError) {
            setError(challengeError.message);
            setIsLoading(false);
          } else if (result?.status === "COMPLETE") {
            void distributePayoutRef.current?.();
          } else {
            setError("Wallet initialization failed.");
            setIsLoading(false);
          }
        });
        return;
      }

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
          abiFunctionSignature: "distributePayout()",
          abiParameters: [],
        }),
      });

      const challengeData = (await challengeResponse.json()) as { challengeId?: string; error?: string };
      if (!challengeResponse.ok || !challengeData.challengeId) {
        throw new Error(challengeData.error ?? "Unable to create Circle contract challenge.");
      }

      executeChallenge(userToken, encryptionKey, challengeData.challengeId, (challengeError, result) => {
        if (challengeError) {
          setError(challengeError.message);
          setIsLoading(false);
        } else if (result?.status === "COMPLETE") {
          setIsSuccess(true);
          setIsLoading(false);
        } else {
          setError("Contract execution failed or was rejected.");
          setIsLoading(false);
        }
      });
    } catch (caughtError) {
      console.error("distributePayout error:", caughtError);
      setError(caughtError instanceof Error ? caughtError.message : "An unexpected error occurred.");
      setIsLoading(false);
    }
  }, [userToken, encryptionKey, groupAddress]);

  distributePayoutRef.current = distributePayout;

  return {
    distributePayout,
    isLoading,
    isSuccess,
    error,
    txHash,
  };
}
