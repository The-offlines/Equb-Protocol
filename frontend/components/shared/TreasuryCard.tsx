"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

type TreasuryCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  description: string;
};

export function TreasuryCard({
  label,
  value,
  icon: Icon,
  description,
}: TreasuryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className="rounded-2xl border border-[#1F1B3A]/5 bg-white p-5 shadow-[0_12px_30px_rgba(31,27,58,0.04)]"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5A4BDB]/10 text-[#5A4BDB]">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <p className="text-sm font-medium text-[#6C6885]">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-[-0.06em] text-[#1F1B3A]">{value}</p>
      <p className="mt-2 text-xs text-[#6C6885]">{description}</p>
    </motion.div>
  );
}
