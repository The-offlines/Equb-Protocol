"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useCircleContext } from "@/src/providers/CircleProvider";
import { clearCache as clearFactoryCache } from "@/src/hooks/useFactory";
import { executeChallenge, pollTransactionStatus } from "@/src/lib/circle";
import { publicClient } from "@/src/lib/arc";
import { decodeEventLog } from "viem";
import { EqubFactory, FACTORY_ADDRESS } from "@/src/lib/contract";

type GroupRequest = [string, number, number, number, boolean, boolean];

export function useCreateGroup() {
  const router = useRouter();
  const { userToken, encryptionKey, walletAddress } = useCircleContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [needsInitialization, setNeedsInitialization] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<GroupRequest | null>(null);
  const createGroupRef = useRef<((...request: GroupRequest) => Promise<void>) | null>(null);

  const createGroup = useCallback(async (
    name: string,
    contributionAmount: number,
    maxMembers: number,
    interval: number,
    isPrivate: boolean,
    manualPayout: boolean,
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
            void createGroupRef.current?.(name, contributionAmount, maxMembers, interval, isPrivate, manualPayout);
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
          name,
          contributionAmount: BigInt(Math.round(contributionAmount * 1e18)).toString(),
          maxMembers,
          interval,
          isPrivate,
          manualPayout,
        }),
      });
      const challengeData = (await challengeResponse.json()) as { challengeId?: string; error?: string };
      if (!challengeResponse.ok || !challengeData.challengeId) {
        throw new Error(challengeData.error ?? "Unable to create Circle contract challenge.");
      }

      executeChallenge(userToken, encryptionKey, challengeData.challengeId, async (challengeError, result) => {
        if (challengeError) {
          setError(challengeError.message);
          setIsLoading(false);
          return;
        }
        if (result?.status === "COMPLETE") {
          try {
            const hash = await pollTransactionStatus(walletData.walletId!, userToken);
            setTxHash(hash);
            
            const receipt = await publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}` });
            
            if (receipt.status === "reverted") {
              throw new Error("Transaction failed or could not be found on-chain.");
            }

            const groupCreatedLog = receipt.logs.find((log: any) => {
              if (log.address.toLowerCase() !== FACTORY_ADDRESS.toLowerCase()) return false;
              try {
                decodeEventLog({ abi: EqubFactory, eventName: "GroupCreated", data: log.data, topics: log.topics });
                return true;
              } catch {
                return false;
              }
            });

            if (!groupCreatedLog) {
              throw new Error("GroupCreated event not found in receipt.");
            }

            const decoded = decodeEventLog({ abi: EqubFactory, eventName: "GroupCreated", data: groupCreatedLog.data, topics: groupCreatedLog.topics });
            const createdGroupAddress = (decoded.args as any).group as string;
            
            const inviteCode = `EQB-${createdGroupAddress.slice(2, 6).toUpperCase()}`;

            const syncResponse = await fetch("/api/groups/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userToken,
                contractAddress: createdGroupAddress,
                inviteCode,
                name,
                dagnaWallet: walletAddress,
                contributionAmount,
                maxMembers,
                roundDuration: interval === 0 ? 7 : 30,
              }),
            });

            if (!syncResponse.ok) {
              const errData = await syncResponse.json().catch(() => ({}));
              console.error("[SYNC] Error response:", errData);
              throw new Error(`Group created on-chain but failed to save to database: ${errData.error || syncResponse.statusText}. Please contact support.`);
            }

            clearFactoryCache();
            setIsSuccess(true);
            setIsLoading(false);
            router.push("/my-equbs");
          } catch (pollingError) {
            setError(pollingError instanceof Error ? pollingError.message : "Failed to confirm group creation.");
            setIsLoading(false);
          }
        } else if (result?.status === "FAILED") {
          setError("Transaction failed");
          setIsLoading(false);
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
