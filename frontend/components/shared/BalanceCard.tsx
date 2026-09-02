"use client";

import { motion } from "framer-motion";

import { useCircleContext } from "@/src/providers/CircleProvider";

export function BalanceCard() {
  const { walletAddress, balance } = useCircleContext();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="rounded-2xl border border-[#1F1B3A]/5 bg-white p-5 shadow-[0_12px_30px_rgba(31,27,58,0.04)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#6C6885]">Wallet Balance</p>
          <p className="mt-3 text-3xl font-black tracking-[-0.06em] text-[#1F1B3A]">
            {balance} USDC
          </p>
        </div>

        <span className="inline-flex items-center gap-2 rounded-full bg-[#3BB273]/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1F8A4D]">
          <span className="h-2 w-2 rounded-full bg-[#3BB273]" />
          Arc Testnet
        </span>
      </div>

      <div className="mt-5 rounded-2xl border border-[#1F1B3A]/5 bg-[#F6F3EC] p-3">
        <p className="text-[11px] uppercase tracking-[0.12em] text-[#6C6885]">Wallet</p>
        <p className="mt-2 text-sm font-semibold text-[#1F1B3A]">
          {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Not connected"}
        </p>
      </div>
    </motion.div>
  );
}
