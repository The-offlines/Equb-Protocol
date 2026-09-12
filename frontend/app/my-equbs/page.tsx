"use client";

import { motion } from "framer-motion";
import { Banknote, Inbox, LockKeyhole, Plus, RefreshCw, WalletCards } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { AuthModal } from "@/components/shared/AuthModal";
import { EqubGroupCard } from "@/components/shared/EqubGroupCard";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { AnalyticsCard } from "@/components/shared/AnalyticsCard";
import { Button } from "@/components/ui/Button";
import { useCircleContext } from "@/src/providers/CircleProvider";
import { useMemberGroups } from "@/src/hooks/useMemberGroups";
import { formatUsdcAmount, formatUsdcDisplay } from "@/src/lib/format";
import type { Group } from "@/types";

const statusByCode: Record<number, Group["status"]> = {
  0: "forming",
  1: "active",
  2: "completed",
  3: "completed",
};

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export default function MyEqubsPage() {
  const { walletAddress } = useCircleContext();
  const { groups, isLoading, error, refetch } = useMemberGroups();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const handleDataUpdated = () => void refetch();
    window.addEventListener("equb-data-updated", handleDataUpdated);
    return () => window.removeEventListener("equb-data-updated", handleDataUpdated);
  }, [refetch]);

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
    status: statusByCode[group.status] ?? "forming",
    contributionAmount: formatUsdcAmount(group.contributionAmount),
    interval: group.interval === 1 ? "monthly" : "weekly",
    isPrivate: group.isPrivate,
  }));

  const currentPool = mappedGroups.reduce((sum, group) => sum + group.poolValue, 0);
  const unpaidGroups = groups.filter((group) => !group.hasPaid && group.status === 1);
  const nextContribution = unpaidGroups[0]
    ? formatUsdcAmount(unpaidGroups[0].contributionAmount)
    : null;

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
        <LoadingSpinner label="Checking your group memberships..." />
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

  if (!walletAddress) {
    return (
      <AppShell>
        <div className="flex min-h-[460px] items-center justify-center rounded-3xl border border-dashed border-[#1F1B3A]/15 bg-white/70 p-8 text-center shadow-sm sm:p-12">
          <div className="max-w-md">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F0ECFF] text-[#5A4BDB]">
              <WalletCards className="h-8 w-8" aria-hidden="true" />
            </div>
            <h1 className="mt-6 text-2xl font-black tracking-[-0.06em] text-[#1F1B3A]">Your circles, in one place</h1>
            <p className="mt-2 text-sm leading-6 text-[#6C6885]">Sign in to see the groups you belong to, your current-round status, and the pools you are building together.</p>
            <Button type="button" onClick={() => setIsAuthOpen(true)} className="mt-6">Sign in to continue</Button>
          </div>
        </div>
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
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
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5A4BDB]">Your workspace</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.07em] text-[#1F1B3A] md:text-4xl">My Equbs</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#6C6885] md:text-base">See who is contributing, what is due next, and how each circle is moving forward.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => void handleRefresh()} disabled={isRefreshing} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden="true" />
              {isRefreshing ? "Refreshing" : "Refresh"}
            </Button>
            <Link href="/create" className="inline-flex items-center gap-2 rounded-2xl bg-[#5A4BDB] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#493bc5]"><Plus className="h-4 w-4" aria-hidden="true" />Create Equb</Link>
          </div>
        </motion.section>

        {mappedGroups.length === 0 ? (
          <motion.section initial="hidden" animate="visible" variants={sectionVariants} transition={{ duration: 0.28, ease: "easeOut" }}>
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-[#1F1B3A]/15 bg-white/70 p-8 text-center shadow-sm sm:p-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F0ECFF] text-[#5A4BDB]"><Inbox className="h-8 w-8" aria-hidden="true" /></div>
              <h2 className="mt-6 text-2xl font-black tracking-[-0.06em] text-[#1F1B3A]">No circles yet</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#6C6885]">Create your first circle or ask a Dagna for an invite. Groups appear here only after your wallet is a member.</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/create" className="inline-flex items-center justify-center rounded-2xl bg-[#5A4BDB] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#493bc5]">Create an Equb</Link>
                <Link href="/join" className="inline-flex items-center justify-center rounded-2xl border border-[#5A4BDB] px-5 py-3 text-sm font-semibold text-[#5A4BDB] transition hover:bg-[#F0ECFF]">I have an invite</Link>
              </div>
            </div>
          </motion.section>
        ) : (
          <>
            <motion.section initial="hidden" animate="visible" variants={sectionVariants} transition={{ duration: 0.3, ease: "easeOut" }}>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <AnalyticsCard label="Current pool" value={formatUsdcDisplay(currentPool)} description="Across your member circles" icon={Banknote} />
                <AnalyticsCard label="Your Equbs" value={String(mappedGroups.length)} description="Groups your wallet belongs to" icon={WalletCards} delay={0.05} />
                <AnalyticsCard label="Private circles" value={String(mappedGroups.filter((group) => group.isPrivate).length)} description="Invite-only groups" icon={LockKeyhole} delay={0.1} />
                <AnalyticsCard label="Next contribution" value={nextContribution === null ? "All paid" : formatUsdcDisplay(nextContribution)} description={nextContribution === null ? "Nothing due in the current view" : "Pending in an active circle"} icon={Plus} delay={0.15} />
              </div>
            </motion.section>

            <motion.section initial="hidden" animate="visible" variants={sectionVariants} transition={{ duration: 0.32, ease: "easeOut" }} className="space-y-5">
              <div className="flex items-end justify-between gap-4">
                <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6C6885]">Live on Arc</p><h2 className="mt-1 text-2xl font-black tracking-[-0.06em] text-[#1F1B3A]">Your circles</h2></div>
                <p className="text-xs text-[#6C6885]">Updated from the chain</p>
              </div>
              <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
                {mappedGroups.map((group, index) => <EqubGroupCard key={group.id} group={group} delay={index * 0.06} />)}
              </div>
            </motion.section>

            <motion.section initial="hidden" animate="visible" variants={sectionVariants} transition={{ duration: 0.34, ease: "easeOut" }} className="rounded-3xl border border-[#5A4BDB]/12 bg-[#F0ECFF] p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#5A4BDB] shadow-sm"><Banknote className="h-5 w-5" aria-hidden="true" /></div>
                <div><h2 className="text-base font-bold text-[#1F1B3A]">What these numbers mean</h2><p className="mt-1 text-sm leading-6 text-[#5D5875]">Current pool is the amount contributed in the active round. Historical payouts and reminders will appear as the activity indexer is connected.</p></div>
              </div>
            </motion.section>
          </>
        )}
      </div>
    </AppShell>
  );
}
