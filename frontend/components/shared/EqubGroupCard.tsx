"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { formatUsdcAmount } from "@/src/lib/format";
import type { Group } from "@/types";

const statusStyles = {
  forming: "bg-[#F0B54A]/15 text-[#A06C00]",
  active: "bg-[#3BB273]/15 text-[#1F8A4D]",
  completed: "bg-[#1F1B3A]/10 text-[#5D5A72]",
};

type EqubGroupCardProps = {
  group: Group;
  delay?: number;
  actionLabel?: string;
  actionButtonClassName?: string;
};

export function EqubGroupCard({
  group,
  delay = 0,
  actionLabel = "View Group",
  actionButtonClassName,
}: EqubGroupCardProps) {
  const router = useRouter();
  const normalizedPoolValue =
    formatUsdcAmount(typeof group.poolValue === "bigint" ? group.poolValue : Number(group.poolValue ?? 0));
  const groupAddress = group.groupAddress ?? group.id;
  const progress = (group.currentRound / group.totalRounds) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut", delay }}
      whileHover={{ y: -2 }}
      className="rounded-2xl border border-[#1F1B3A]/5 bg-white p-5 shadow-[0_12px_30px_rgba(31,27,58,0.04)]"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold tracking-[-0.05em] text-[#1F1B3A]">
            {group.name}
          </h3>
          <p className="mt-1 text-sm text-[#6C6885]">
            Round {group.currentRound} of {group.totalRounds}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${statusStyles[group.status]}`}
          >
            {group.status}
          </span>
          {group.isPrivate ? (
            <span className="inline-flex items-center rounded-full bg-[#1F1B3A]/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1F1B3A]">
              Private
            </span>
          ) : null}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-[#6C6885]">
          <span>
            {group.members}/{group.maxMembers} members
          </span>
          <span>{Math.round(progress)}%</span>
        </div>

        <div className="h-2.5 overflow-hidden rounded-full bg-[#1F1B3A]/5">
          <div
            className="h-full rounded-full bg-[#5A4BDB]"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-[#6C6885]">Pool</p>
            <p className="mt-1 text-lg font-bold text-[#1F1B3A]">
              ${normalizedPoolValue.toLocaleString()} USDC
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-[#6C6885]">Next payout</p>
            <p className="mt-1 text-lg font-bold text-[#1F1B3A]">
              {new Date(group.nextPayoutDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => router.push(`/group/${groupAddress}`)}
          className={[
            "w-full rounded-2xl text-sm font-semibold text-white shadow-[0_10px_20px_rgba(90,75,219,0.2)]",
            actionButtonClassName ?? "bg-[#5A4BDB] hover:bg-[#4d3fd1]",
          ].join(" ")}
        >
          {actionLabel}
        </Button>
      </div>
    </motion.div>
  );
}
