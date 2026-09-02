"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { parseUnits } from "viem";

import { useCircleContext } from "@/src/providers/CircleProvider";
import { clearCache as clearFactoryCache } from "@/src/hooks/useFactory";
import { clearCache as clearRegistryCache } from "@/src/hooks/useRegistry";
import { publicClient } from "@/src/lib/arc";
import {
  executeChallenge,
  getContractChallengeId,
  pollTransactionStatus,
} from "@/src/lib/circle";
import { FACTORY_ADDRESS } from "@/src/lib/contract";

export function useCreateGroup() {
  const router = useRouter();
  const { walletAddress, userToken, encryptionKey, refreshUserToken } = useCircleContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const createGroup = useCallback(async (
    name: string,
    contributionAmount: number,
    maxMembers: number,
    interval: number,
    isPrivate: boolean,
  ) => {
    setIsLoading(true);
    setIsSuccess(false);
    setError(null);
    setTxHash(null);

    // Guard: Verify wallet is connected and Circle session is valid
    if (!walletAddress) {
      setError("Please sign in with your email first to connect your Circle wallet");
      setIsLoading(false);
      return;
    }

    if (!userToken || !encryptionKey) {
      setError("Your Circle session has expired. Please sign in with your email again");
      setIsLoading(false);
      return;
    }

    // Guard: Verify user is on Arc Testnet and has ARC balance
    if (typeof window !== "undefined") {
      try {
        const balance = await publicClient.getBalance({ address: walletAddress as `0x${string}` });
        if (balance === BigInt(0)) {
          setError("Your Circle wallet has no ARC on Arc Testnet. Request Arc testnet funds first");
          setIsLoading(false);
          return;
        }
      } catch {
        setError("Unable to verify your wallet is on Arc Testnet. Please refresh and try again");
        setIsLoading(false);
        return;
      }
    }

    try {
      // Fetch Circle walletId (the UUID, not the wallet address)
      const walletIdResponse = await fetch(
        `/api/circle/wallet-id?userToken=${encodeURIComponent(userToken)}`,
        { method: "GET" },
      );

      const walletIdData = (await walletIdResponse.json()) as { walletId?: string; error?: string };

      if (!walletIdResponse.ok || !walletIdData.walletId) {
        throw new Error(walletIdData.error ?? "Unable to fetch wallet ID. Please try again.");
      }

      const walletId = walletIdData.walletId;

      // Prepare function parameters
      const amountInUnits = parseUnits(String(contributionAmount), 6);
      const abiParameters = [
        name,
        amountInUnits.toString(),
        maxMembers.toString(),
        interval.toString(),
        isPrivate.toString(),
      ];

      const challengeId = await getContractChallengeId({
        userToken,
        walletId,
        contractAddress: FACTORY_ADDRESS,
        abiFunctionSignature: "createGroup(string,uint256,uint256,uint256,bool)",
        abiParameters,
      });

      // Wait for the approval modal to finish before polling for the transaction result.
      await executeChallenge(challengeId, userToken, encryptionKey, (error) => {
        if (error) {
          console.error("Circle approval challenge failed:", error);
        }
      });

      const hash = await pollTransactionStatus(challengeId, userToken);

      setTxHash(hash);

      // Wait for transaction to be confirmed on-chain
      const receipt = await publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}` });
      if (receipt.status === "reverted") {
        throw new Error("Transaction was rejected by the contract. Check your parameters");
      }

      clearFactoryCache();
      clearRegistryCache();
      setIsSuccess(true);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      router.push("/my-equbs");
    } catch (caughtError) {
      const errorMessage = caughtError instanceof Error ? caughtError.message : "Failed to create group";

      // Map Circle error codes to user-friendly messages
      if (
        errorMessage.includes("155113") ||
        errorMessage.includes("walletId") ||
        errorMessage.includes("Wallet not found")
      ) {
        setError("Wallet not found. Please sign out and sign in again");
      } else if (errorMessage.includes("155236") || errorMessage.includes("fee")) {
        setError("Transaction fee error. Try again in a moment");
      } else if (errorMessage.includes("401") || errorMessage.includes("expired")) {
        // Token expired, try to refresh and retry
        setError("Your session expired. Refreshing...");
        const refreshed = await refreshUserToken();
        if (refreshed) {
          setError("Session refreshed. Please try again");
        } else {
          setError("Your Circle session expired. Please sign in with your email again");
        }
      } else if (errorMessage.includes("reverted")) {
        setError("Transaction was rejected by the contract. Check your parameters");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [encryptionKey, refreshUserToken, router, userToken, walletAddress]);

  return { createGroup, isLoading, isSuccess, error, txHash };
}
