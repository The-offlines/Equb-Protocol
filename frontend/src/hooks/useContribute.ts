"use client";

import { useCallback, useState } from "react";
import { getAddress, type Abi, type Address } from "viem";

import { useCircleContext } from "@/src/providers/CircleProvider";
import { publicClient } from "@/src/lib/arc";
import { executeEmbeddedContractTransaction, getCircleWalletId } from "@/src/lib/circle";
import { EqubGroup } from "@/src/lib/contract";

export function useContribute(groupAddress: string) {
  const { walletAddress, walletType, userToken, encryptionKey } = useCircleContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const contribute = useCallback(async () => {
    setIsLoading(true);
    setIsSuccess(false);
    setError(null);
    setTxHash(null);

    if (!walletAddress || !userToken || !encryptionKey) {
      setError("Please sign in first");
      setIsLoading(false);
      return;
    }

    try {
      const address = getAddress(groupAddress) as Address;
      const abi = EqubGroup as Abi;
      const contributionAmount = await publicClient.readContract({ address, abi, functionName: "contributionAmount" }) as bigint;
      const memberCount = await publicClient.readContract({ address, abi, functionName: "memberCount" }) as number;
      const paidCount = await publicClient.readContract({ address, abi, functionName: "paidCount" }) as number;
      const isLastPayment = Number(paidCount) + 1 === Number(memberCount);
      
      const memberInfo = await publicClient.readContract({ address, abi, functionName: "memberInfo", args: [walletAddress as Address] }) as readonly [boolean, boolean, boolean, bigint, bigint];
      const isPaid = memberInfo[2];
      if (isPaid) {
        setError("You have already paid this round");
        return;
      }

      const isMember = await publicClient.readContract({ address, abi, functionName: "isMember", args: [walletAddress as Address] }) as boolean;
      if (!isMember) {
        setError("You are not a member of this group");
        return;
      }

      const status = await publicClient.readContract({ address, abi, functionName: "status" }) as bigint;
      if (Number(status) !== 1) {
        setError("This group is not active yet");
        return;
      }

      const balance = await publicClient.getBalance({ address: walletAddress as Address });
      if (balance < contributionAmount) {
        setError("Your Circle wallet is underfunded on Arc Testnet. Request Arc testnet funds, then try again.");
        return;
      }

      let hash: string;
      if (walletType === "external") {
        const { getWalletClient } = await import("@/src/lib/arc");
        const walletClient = await getWalletClient(walletAddress as Address);
        if (!walletClient) throw new Error("Wallet not connected");
        hash = await walletClient.writeContract({
          address,
          abi,
          functionName: "contribute",
          value: contributionAmount,
        });
      } else {
        const walletId = await getCircleWalletId(userToken, walletAddress);
        hash = await executeEmbeddedContractTransaction({
          userToken,
          encryptionKey,
          walletId,
          contractAddress: address,
          abiFunctionSignature: "contribute()",
          abiParameters: [],
          value: contributionAmount.toString(),
        });
      }

      const receipt = await publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}` });
      if (receipt.status === "reverted") throw new Error("Transaction reverted");

      try {
        await fetch("/api/member/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userToken, contractAddress: groupAddress }),
        });
      } catch (e) {
        console.warn("Failed to sync member metadata", e);
      }

      setTxHash(hash);
      setIsSuccess(true);
      window.dispatchEvent(new Event("equb-data-updated"));


    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Contribution failed";
      const normalizedMessage = message.toLowerCase();
      if (message.includes("AlreadyPaid")) setError("You have already paid this round");
      else if (message.includes("NotMember")) setError("You are not a member");
      else if (message.includes("WrongAmount")) setError("Incorrect contribution amount");
      else if (normalizedMessage.includes("user rejected")) setError("Transaction was rejected");
      else setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [encryptionKey, groupAddress, userToken, walletAddress]);

  return { contribute, isLoading, isSuccess, error, txHash };
}
