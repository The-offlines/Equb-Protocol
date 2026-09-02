"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useCircleContext } from "@/src/providers/CircleProvider";
import { useGroup } from "@/src/hooks/useGroup";
import { useTreasury } from "@/src/hooks/useTreasury";
import { publicClient } from "@/src/lib/arc";
import { EqubGroup } from "@/src/lib/contract";
import { formatUsdcAmount } from "@/src/lib/format";

type ContributeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  groupAddress: string;
  contribute: () => Promise<void>;
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
  txHash: string | null;
  groupName: string;
  amount: number;
  round: number;
};

export function ContributeModal({
  isOpen,
  onClose,
  groupAddress,
  contribute,
  isLoading,
  isSuccess,
  error,
  txHash,
  groupName,
  amount,
  round,
}: ContributeModalProps) {
  const { walletAddress } = useCircleContext();
  const { refetch: refetchTreasury } = useTreasury(groupAddress);
  const { refetch: refetchGroup } = useGroup(groupAddress);
  const [liveAmount, setLiveAmount] = useState(amount);

  useEffect(() => {
    if (!isOpen) return;
    let isActive = true;
    const loadContributionAmount = async () => {
      try {
        const value = await publicClient.readContract({ address: groupAddress as `0x${string}`, abi: EqubGroup, functionName: "contributionAmount" });
        if (isActive) setLiveAmount(formatUsdcAmount(value as bigint));
      } catch {
        if (isActive) setLiveAmount(amount);
      }
    };
    void loadContributionAmount();
    return () => { isActive = false; };
  }, [amount, groupAddress, isOpen]);

  useEffect(() => {
    if (!isSuccess) return;
    void refetchTreasury();
    void refetchGroup();
    const timeoutId = window.setTimeout(onClose, 2000);
    return () => window.clearTimeout(timeoutId);
  }, [isSuccess, onClose, refetchGroup, refetchTreasury]);

  const shortTxHash = txHash ? `${txHash.slice(0, 6)}...${txHash.slice(-4)}` : "";
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F1B3A]/40 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-[#1F1B3A]/5 bg-white p-6 shadow-[0_30px_80px_rgba(31,27,58,0.22)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5A4BDB]">
                  Contribute
                </p>
                <h3 className="mt-2 text-2xl font-black tracking-[-0.05em] text-[#1F1B3A]">
                  {groupName}
                </h3>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F6F3EC] text-[#1F1B3A]"
                aria-label="Close contribution modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-4 text-sm text-[#1F1B3A]">
              <div className="rounded-2xl border border-[#1F1B3A]/5 bg-[#F6F3EC] p-4">
                <p className="text-[#6C6885]">Contribution Amount</p>
                <p className="mt-2 text-2xl font-black tracking-[-0.05em] text-[#1F1B3A]">
                  {liveAmount} USDC
                </p>
              </div>

              <div className="rounded-2xl border border-[#1F1B3A]/5 bg-[#F6F3EC] p-4">
                <p className="text-[#6C6885]">Current Round</p>
                <p className="mt-2 text-lg font-bold text-[#1F1B3A]">Round {round}</p>
              </div>

              <div className="rounded-2xl border border-[#1F1B3A]/5 bg-[#F6F3EC] p-4">
                <p className="text-[#6C6885]">Wallet</p>
                <p className="mt-2 break-all text-sm text-[#1F1B3A]">{walletAddress ?? "Not connected"}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void contribute()}
              disabled={isLoading || isSuccess}
              className="mt-6 w-full rounded-2xl bg-[#5A4BDB] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(90,75,219,0.25)] transition-colors hover:bg-[#4d3fd1]"
            >
              {isLoading ? <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" /> : null}
              {isLoading ? "Processing..." : "Confirm Contribution"}
            </button>
            {isSuccess ? <p className="mt-3 text-center text-sm font-semibold text-[#1F8A4D]">Contribution confirmed! {shortTxHash}</p> : null}
            {error ? (
              <div className="mt-3 space-y-3 text-center">
                <p className="text-sm font-semibold text-[#D9345F]">{error}</p>
                <a
                  href="https://faucet.circle.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-2xl border border-[#5A4BDB]/20 bg-[#5A4BDB]/5 px-4 py-2.5 text-sm font-semibold text-[#5A4BDB] transition-colors hover:bg-[#5A4BDB]/10"
                >
                  Get testnet USDC
                </a>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
