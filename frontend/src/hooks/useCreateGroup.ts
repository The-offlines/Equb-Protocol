"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { decodeEventLog, parseUnits } from "viem";

import { useCircleContext } from "@/src/providers/CircleProvider";
import { clearCache as clearFactoryCache } from "@/src/hooks/useFactory";
import { clearCache as clearRegistryCache } from "@/src/hooks/useRegistry";
import { publicClient } from "@/src/lib/arc";
import {
  executeChallenge,
  getContractChallengeId,
  pollTransactionStatus,
  formatCircleError,
} from "@/src/lib/circle";
import { EqubFactory, FACTORY_ADDRESS } from "@/src/lib/contract";

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
    console.log("STEP 1: Create Equb button clicked", { name, contributionAmount, maxMembers, interval, isPrivate });
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
      console.log("STEP 2: Circle wallet ready", { walletId, walletAddress });

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
      console.log("STEP 3: Contract execution challenge created", { challengeId, contractAddress: FACTORY_ADDRESS });

      // Wait for the approval modal to finish before polling for the transaction result.
      await executeChallenge(challengeId, userToken, encryptionKey, (error, result) => {
        if (error) {
          console.error("Circle approval challenge failed:", error);
          return;
        }
        console.log("Circle approval completed:", result);
      });

      const hash = await pollTransactionStatus(challengeId, userToken);

      if (!hash || !/^0x[0-9a-fA-F]{64}$/.test(hash)) {
        throw new Error(`Circle returned an invalid transaction hash: ${hash || "empty"}`);
      }
      console.log("STEP 4: Transaction hash:", hash);

      setTxHash(hash);

      // Wait for transaction to be confirmed on-chain
      console.log("STEP 5: Waiting for transaction receipt...");
      const receipt = await publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}` });
      console.log("STEP 6: Receipt status:", receipt.status, { transactionHash: receipt.transactionHash, blockNumber: receipt.blockNumber });
      if (receipt.status !== "success") {
        throw new Error(`Transaction reverted; receipt status: ${receipt.status}; transaction hash: ${hash}`);
      }

      const groupCreatedLog = receipt.logs.find((log) => {
        if (log.address.toLowerCase() !== FACTORY_ADDRESS.toLowerCase()) return false;
        try {
          decodeEventLog({ abi: EqubFactory, eventName: "GroupCreated", data: log.data, topics: log.topics });
          return true;
        } catch {
          return false;
        }
      });
      if (!groupCreatedLog) throw new Error(`No factory event found; receipt status: ${receipt.status}; transaction hash: ${hash}`);
      let decodedGroup: string | undefined;
      try {
        const decoded = decodeEventLog({ abi: EqubFactory, eventName: "GroupCreated", data: groupCreatedLog.data, topics: groupCreatedLog.topics });
        decodedGroup = (decoded.args as { group?: string }).group;
        console.log("STEP 7: Logs decoded", decoded);
      } catch (decodeError) {
        throw new Error(`Unable to decode GroupCreated event; receipt status: ${receipt.status}; transaction hash: ${hash}; cause: ${formatCircleError(decodeError)}`);
      }
      if (!decodedGroup || !/^0x[0-9a-fA-F]{40}$/.test(decodedGroup)) {
        throw new Error(`GroupCreated event did not contain a valid group address; transaction hash: ${hash}`);
      }
      console.log("STEP 8: Group address extracted:", decodedGroup);

      clearFactoryCache();
      clearRegistryCache();
      setIsSuccess(true);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      router.push(`/group/${decodedGroup}`);
    } catch (caughtError) {
      const errorMessage = formatCircleError(caughtError);
      console.error("Create Equb pipeline failed (original):", caughtError);

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
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [encryptionKey, refreshUserToken, router, userToken, walletAddress]);

  return { createGroup, isLoading, isSuccess, error, txHash };
}
