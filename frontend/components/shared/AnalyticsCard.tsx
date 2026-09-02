"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type AnalyticsCardProps = {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
  delay?: number;
  className?: string;
};

export function AnalyticsCard({
  label,
  value,
  description,
  icon: Icon,
  delay = 0,
  className,
}: AnalyticsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut", delay }}
      whileHover={{ y: -2 }}
      className={cn(
        "rounded-2xl border border-[#1F1B3A]/5 bg-white p-5 shadow-[0_12px_30px_rgba(31,27,58,0.04)]",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5A4BDB]/10 text-[#5A4BDB]">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-[#6C6885]">{label}</p>
        <p className="text-2xl font-black tracking-[-0.06em] text-[#1F1B3A]">
          {value}
        </p>
        <p className="text-xs text-[#6C6885]">{description}</p>
      </div>
    </motion.div>
  );
}
