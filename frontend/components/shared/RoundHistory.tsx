"use client";

import { motion } from "framer-motion";

import type { Winner } from "@/types";
import { WinnerCard } from "@/components/shared/WinnerCard";

type RoundHistoryProps = {
  winners: Winner[];
};

export function RoundHistory({ winners }: RoundHistoryProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="rounded-2xl border border-[#1F1B3A]/5 bg-white p-5 shadow-[0_12px_30px_rgba(31,27,58,0.04)]"
    >
      <h2 className="text-xl font-bold tracking-[-0.05em] text-[#1F1B3A]">
        Previous Winners
      </h2>

      <div className="mt-5 space-y-4">
        {winners.map((winner, index) => (
          <div key={`${winner.round}-${winner.name}`} className={index < winners.length - 1 ? "pb-4" : ""}>
            <WinnerCard winner={winner} />
          </div>
        ))}
      </div>
    </motion.section>
  );
}
