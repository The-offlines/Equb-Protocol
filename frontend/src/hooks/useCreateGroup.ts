"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useCircleContext } from "@/src/providers/CircleProvider";
import { clearCache as clearFactoryCache } from "@/src/hooks/useFactory";
<<<<<<< Updated upstream
import { clearCache as clearRegistryCache } from "@/src/hooks/useRegistry";
import { publicClient } from "@/src/lib/arc";
import {
  executeChallenge,
  getContractChallengeId,
  getCircleWalletId,
  pollTransactionStatus,
  formatCircleError,
} from "@/src/lib/circle";
import { EqubFactory, FACTORY_ADDRESS } from "@/src/lib/contract";
=======
import { executeChallenge } from "@/src/lib/circle";

type GroupRequest = [string, number, number, number, boolean];
>>>>>>> Stashed changes

export function useCreateGroup() {
  const router = useRouter();
  const { userToken, encryptionKey } = useCircleContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash] = useState<string | null>(null);
  const [needsInitialization, setNeedsInitialization] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<GroupRequest | null>(null);
  const createGroupRef = useRef<((...request: GroupRequest) => Promise<void>) | null>(null);

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
    setNeedsInitialization(false);

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
        userToken?: string;
        encryptionKey?: string;
        error?: string;
      };
      if (walletData.needsWalletInit && walletData.challengeId) {
        executeChallenge(userToken, encryptionKey, walletData.challengeId, (challengeError, result) => {
          if (challengeError) {
            setError(challengeError.message);
            setIsLoading(false);
          } else if (result?.status === "COMPLETE") {
            void createGroupRef.current?.(name, contributionAmount, maxMembers, interval, isPrivate);
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

      const contributionAmountWei = BigInt(contributionAmount) * BigInt(10 ** 18);
      const challengeResponse = await fetch("/api/circle/execute-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userToken,
          walletId: walletData.walletId,
          name,
          contributionAmount: contributionAmountWei.toString(),
          maxMembers,
          interval,
          isPrivate,
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
          return;
        }
<<<<<<< Updated upstream
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
        contributionAmountInWei.toString(),
        maxMembers.toString(),
        interval.toString(),
        isPrivate.toString(),
      ];

      const challengeId = await getContractChallengeId({
        userToken: activeUserToken,
        walletId,
        contractAddress: FACTORY_ADDRESS,
        abiFunctionSignature: "createGroup(string,uint256,uint32,uint8,bool)",
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

      // Wait for transaction to be confirmed on-chain through the server-side Arc proxy.
      console.log("STEP 5: Waiting for transaction receipt...");
      let receipt: Awaited<ReturnType<typeof publicClient.waitForTransactionReceipt>> | null = null;
      for (let attempt = 0; attempt < 30; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const receiptResponse = await fetch("/api/arc/receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ txHash: hash }),
        });
        const receiptData = (await receiptResponse.json()) as { receipt?: unknown; error?: string };
        if (receiptData.receipt && typeof receiptData.receipt === "object") {
          receipt = receiptData.receipt as Awaited<ReturnType<typeof publicClient.waitForTransactionReceipt>>;
          break;
        }
      }
      if (!receipt) throw new Error(`Arc transaction receipt not found after 60s. txHash: ${hash}`);
      console.log("STEP 7: Receipt success:", receipt.status, { transactionHash: receipt.transactionHash, blockNumber: receipt.blockNumber });
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
=======
        if (result?.status === "COMPLETE") {
          clearFactoryCache();
          setIsSuccess(true);
          setIsLoading(false);
          router.push("/my-equbs");
        } else if (result?.status === "FAILED") {
          setError("Transaction failed");
          setIsLoading(false);
>>>>>>> Stashed changes
        }
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to create group.");
      setIsLoading(false);
    }
  }, [encryptionKey, router, userToken]);

  useEffect(() => {
    createGroupRef.current = createGroup;
  }, [createGroup]);

  const retryCreateGroup = useCallback(() => {
    if (!pendingRequest) return;
    setPendingRequest(null);
    setNeedsInitialization(false);
    void createGroup(...pendingRequest);
  }, [createGroup, pendingRequest]);

  return { createGroup, retryCreateGroup, needsInitialization, isLoading, isSuccess, error, txHash };
}
