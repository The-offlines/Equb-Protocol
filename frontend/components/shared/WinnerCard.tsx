"use client";

import { motion } from "framer-motion";

import type { Winner } from "@/types";

type WinnerCardProps = {
  winner: Winner;
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export function WinnerCard({ winner }: WinnerCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="relative pl-10"
    >
      <div className="absolute left-[17px] top-0 h-full w-px bg-[#E7E3F0]" />

      <div className="absolute left-0 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#5A4BDB] text-[11px] font-bold text-white shadow-sm">
        {winner.round}
      </div>

      <div className="rounded-2xl border border-[#1F1B3A]/5 bg-white p-4 shadow-[0_12px_30px_rgba(31,27,58,0.04)]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F7F5FF] text-sm font-bold text-[#5A4BDB]">
              {getInitials(winner.name)}
            </div>
            <div>
              <p className="text-base font-bold text-[#1F1B3A]">{winner.name}</p>
              <p className="text-xs text-[#6C6885]">{`${winner.wallet.slice(0, 6)}...${winner.wallet.slice(-4)}`}</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm font-semibold text-[#1F1B3A]">{winner.amount.toLocaleString()} USDC</p>
            <p className="text-[11px] text-[#6C6885]">
              {new Date(winner.paidAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
