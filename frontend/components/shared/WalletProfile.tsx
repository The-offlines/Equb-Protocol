"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { useCircleContext } from "@/src/providers/CircleProvider";

type WalletProfileProps = {
  onClose?: () => void;
};

export function WalletProfile({ onClose }: WalletProfileProps) {
  const { walletAddress, balance, signOut } = useCircleContext();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!walletAddress) {
      return;
    }

    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  const handleSignOut = () => {
    signOut();
    onClose?.();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="w-72 rounded-2xl border border-[#1F1B3A]/5 bg-white p-4 shadow-[0_20px_50px_rgba(31,27,58,0.14)]"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#3BB273]/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1F8A4D]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#3BB273]" />
              Connected
            </span>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-[#1F1B3A]/5 bg-[#F6F3EC] p-3">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#6C6885]">Wallet</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="break-all text-sm font-semibold text-[#1F1B3A]">{walletAddress ?? "Not connected"}</p>
            <button
              type="button"
              onClick={handleCopy}
              className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#1F1B3A] shadow-sm"
              aria-label="Copy wallet address"
            >
              {copied ? <Check className="h-4 w-4 text-[#3BB273]" /> : <Copy className="h-4 w-4" />}
              {copied ? (
                <span className="absolute -top-9 left-1/2 -translate-x-1/2 rounded-full bg-[#1F1B3A] px-2 py-1 text-[10px] font-medium text-white">
                  Copied!
                </span>
              ) : null}
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl border border-[#1F1B3A]/5 bg-[#F6F3EC] px-3 py-2 text-sm">
          <span className="text-[#6C6885]">Balance</span>
          <span className="font-bold text-[#1F1B3A]">{balance} USDC</span>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl border border-[#1F1B3A]/5 bg-[#F6F3EC] px-3 py-2 text-sm">
          <span className="text-[#6C6885]">Network</span>
          <span className="font-semibold text-[#1F1B3A]">Arc Testnet</span>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="mt-4 w-full rounded-2xl bg-[#FFEEF0] px-3 py-2 text-sm font-semibold text-[#D9345F] transition-colors hover:bg-[#FED9E1]"
        >
          Sign Out
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
