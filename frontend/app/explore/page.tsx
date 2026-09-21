"use client";

import { motion } from "framer-motion";
import { Compass, RefreshCw, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { EqubGroupCard } from "@/components/shared/EqubGroupCard";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { AnalyticsCard } from "@/components/shared/AnalyticsCard";
import { Button } from "@/components/ui/Button";
import { useCompletedGroups } from "@/src/hooks/useCompletedGroups";
import { formatUsdcAmount, formatUsdcDisplay } from "@/src/lib/format";
import type { Group } from "@/types";

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export default function ExplorePage() {
  const { groups, isLoading, error, refetch } = useCompletedGroups();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const mappedGroups: Group[] = groups.map((group, index) => ({
    id: group.groupAddress || `group-${index}`,
    groupAddress: group.groupAddress,
    name: group.name || `Group ${index + 1}`,
    currentRound: Math.max(group.currentRound, 1),
    totalRounds: Math.max(group.maxMembers, 1),
    members: group.memberCount,
    maxMembers: group.maxMembers,
    poolValue: group.currentPool,
    nextPayoutDate: null,
    status: "completed",
    contributionAmount: formatUsdcAmount(group.contributionAmount),
    interval: group.interval === 1 ? "monthly" : "weekly",
    isPrivate: group.isPrivate,
  }));

  const totalPoolDistributed = mappedGroups.reduce((sum, group) => sum + (group.contributionAmount * group.maxMembers * group.maxMembers), 0);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <LoadingSpinner label="Loading Hall of Fame..." />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <ErrorState message={error} onRetry={() => void refetch()} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[1320px] space-y-8 pb-10">
        <motion.section
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="flex flex-col gap-5 rounded-3xl border border-[#1F1B3A]/8 bg-white p-6 shadow-[0_14px_35px_rgba(31,27,58,0.05)] sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5A4BDB]">Proof of Concept</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.07em] text-[#1F1B3A] md:text-4xl">Hall of Fame</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#6C6885] md:text-base">Explore successfully ended Equbs. Once an Equb successfully distributes all its payouts, it becomes public here to build trust and prove the protocol works.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => void handleRefresh()} disabled={isRefreshing} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden="true" />
              {isRefreshing ? "Refreshing" : "Refresh"}
            </Button>
            <Link href="/create" className="inline-flex items-center gap-2 rounded-2xl bg-[#5A4BDB] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#493bc5]">Create Equb</Link>
          </div>
        </motion.section>

        {mappedGroups.length === 0 ? (
          <motion.section initial="hidden" animate="visible" variants={sectionVariants} transition={{ duration: 0.28, ease: "easeOut" }}>
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-[#1F1B3A]/15 bg-white/70 p-8 text-center shadow-sm sm:p-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F0ECFF] text-[#5A4BDB]"><Compass className="h-8 w-8" aria-hidden="true" /></div>
              <h2 className="mt-6 text-2xl font-black tracking-[-0.06em] text-[#1F1B3A]">No completed circles yet</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#6C6885]">There are no ended Equbs to display right now. Groups will appear here once they complete all their rounds and distribute all payouts.</p>
            </div>
          </motion.section>
        ) : (
          <>
            <motion.section initial="hidden" animate="visible" variants={sectionVariants} transition={{ duration: 0.3, ease: "easeOut" }}>
              <div className="grid gap-4 sm:grid-cols-3">
                <AnalyticsCard label="Total Payouts Distributed" value={formatUsdcDisplay(totalPoolDistributed)} description="Volume saved across all completed Equbs" icon={Trophy} />
                <AnalyticsCard label="Completed Groups" value={String(mappedGroups.length)} description="Equb circles successfully ended" icon={Compass} delay={0.05} />
                <AnalyticsCard label="Successful Savers" value={String(mappedGroups.reduce((acc, g) => acc + g.maxMembers, 0))} description="Users who completed a savings cycle" icon={Users} delay={0.1} />
              </div>
            </motion.section>

            <motion.section initial="hidden" animate="visible" variants={sectionVariants} transition={{ duration: 0.32, ease: "easeOut" }} className="space-y-5">
              <div className="flex items-end justify-between gap-4">
                <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6C6885]">Archived</p><h2 className="mt-1 text-2xl font-black tracking-[-0.06em] text-[#1F1B3A]">Ended Equbs</h2></div>
                <p className="text-xs text-[#6C6885]">Public Records</p>
              </div>
              <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
                {mappedGroups.map((group, index) => <EqubGroupCard key={group.id} group={group} delay={index * 0.06} />)}
              </div>
            </motion.section>
          </>
        )}
      </div>
    </AppShell>
  );
}
