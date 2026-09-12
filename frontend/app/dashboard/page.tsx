"use client";

import { motion } from "framer-motion";
import { ArrowRight, CirclePlus, Compass, LockKeyhole, RefreshCw, Users, WalletCards } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import AppShell from "@/components/layout/AppShell";
import { AnalyticsCard } from "@/components/shared/AnalyticsCard";
import { BalanceCard } from "@/components/shared/BalanceCard";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { useFactory } from "@/src/hooks/useFactory";
import { formatUsdcAmount, formatUsdcDisplay } from "@/src/lib/format";

export default function DashboardPage() {
  const { groups, totalGroups, isLoading, error, refetch } = useFactory();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const totalPool = groups.reduce((sum, group) => sum + formatUsdcAmount(group.contributionAmount), 0);
  const privateGroups = groups.filter((group) => group.isPrivate).length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return <AppShell><LoadingSpinner label="Loading the Arc workspace..." /></AppShell>;
  }

  if (error) {
    return <AppShell><ErrorState message={error} onRetry={() => void refetch()} /></AppShell>;
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[1320px] space-y-8 pb-10">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#5A4BDB] via-[#6556E8] to-[#8579F5] p-6 text-white shadow-[0_20px_45px_rgba(90,75,219,0.22)] sm:p-8"
        >
          <div className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full border-[30px] border-white/10" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">Arc workspace</p>
              <h1 className="mt-3 text-3xl font-black tracking-[-0.07em] sm:text-4xl">Build a rhythm that lasts.</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/80 sm:text-base">Create a circle, invite your people, and keep every contribution easy to follow.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => void handleRefresh()} disabled={isRefreshing} className="gap-2 border-white/25 bg-white/10 text-white hover:bg-white/20">
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden="true" />{isRefreshing ? "Refreshing" : "Refresh"}
              </Button>
              <Link href="/create" className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#5A4BDB] transition hover:bg-[#F0ECFF]"><CirclePlus className="h-4 w-4" aria-hidden="true" />Create Equb</Link>
            </div>
          </div>
        </motion.section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
          <BalanceCard />
          <section className="rounded-3xl border border-[#1F1B3A]/8 bg-white p-5 shadow-[0_14px_35px_rgba(31,27,58,0.05)] sm:p-6" aria-labelledby="start-heading">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5A4BDB]">Start here</p>
            <h2 id="start-heading" className="mt-2 text-xl font-black tracking-[-0.05em] text-[#1F1B3A]">What would you like to do?</h2>
            <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              <Link href="/create" className="group flex items-center gap-3 rounded-2xl border border-[#1F1B3A]/8 p-3 transition hover:border-[#5A4BDB]/30 hover:bg-[#F8F6FF]"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0ECFF] text-[#5A4BDB]"><CirclePlus className="h-4 w-4" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold">Create a circle</span><span className="block text-xs text-[#6C6885]">Set your group rules</span></span><ArrowRight className="h-4 w-4 text-[#9A96AA] transition group-hover:translate-x-0.5 group-hover:text-[#5A4BDB]" aria-hidden="true" /></Link>
              <Link href="/join" className="group flex items-center gap-3 rounded-2xl border border-[#1F1B3A]/8 p-3 transition hover:border-[#5A4BDB]/30 hover:bg-[#F8F6FF]"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF8F1] text-[#1F8A4D]"><Users className="h-4 w-4" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold">Join a circle</span><span className="block text-xs text-[#6C6885]">Use an invite code</span></span><ArrowRight className="h-4 w-4 text-[#9A96AA] transition group-hover:translate-x-0.5 group-hover:text-[#5A4BDB]" aria-hidden="true" /></Link>
            </div>
          </section>
        </div>

        <section aria-labelledby="metrics-heading">
          <div className="mb-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6C6885]">At a glance</p><h2 id="metrics-heading" className="mt-1 text-2xl font-black tracking-[-0.06em] text-[#1F1B3A]">Protocol activity</h2></div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AnalyticsCard label="Total groups" value={String(Number(totalGroups))} description="Groups registered on Arc Testnet" icon={Compass} />
            <AnalyticsCard label="Contribution volume" value={formatUsdcDisplay(totalPool)} description="Configured contribution amounts" icon={WalletCards} delay={0.05} />
            <AnalyticsCard label="Private circles" value={String(privateGroups)} description="Invite-only group settings" icon={LockKeyhole} delay={0.1} />
            <AnalyticsCard label="Network" value="Arc Testnet" description="Native USDC settlement" icon={Users} delay={0.15} />
          </div>
        </section>

        <section aria-labelledby="groups-heading" className="space-y-5">
          <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6C6885]">Discover</p><h2 id="groups-heading" className="mt-1 text-2xl font-black tracking-[-0.06em] text-[#1F1B3A]">Registered circles</h2></div><Link href="/my-equbs" className="text-sm font-bold text-[#5A4BDB] hover:underline">View yours <span aria-hidden="true">→</span></Link></div>
          {groups.length > 0 ? (
            <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
              {groups.slice(0, 3).map((group) => (
                <Link
                  key={group.groupAddress}
                  href={`/group/${group.groupAddress}`}
                  className="group rounded-3xl border border-[#1F1B3A]/8 bg-white p-5 shadow-[0_12px_30px_rgba(31,27,58,0.04)] transition hover:-translate-y-0.5 hover:border-[#5A4BDB]/25 hover:shadow-[0_18px_36px_rgba(31,27,58,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A4BDB]/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><p className="truncate text-lg font-bold tracking-[-0.04em] text-[#1F1B3A]">{group.name}</p><p className="mt-1 text-xs text-[#6C6885]">Created circle · {Number(group.interval) === 1 ? "Monthly" : "Weekly"}</p></div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${group.isPrivate ? "bg-[#F0ECFF] text-[#5A4BDB]" : "bg-[#EAF8F1] text-[#1F8A4D]"}`}>{group.isPrivate ? "Private" : "Open"}</span>
                  </div>
                  <div className="mt-6 flex items-end justify-between gap-4 border-t border-[#1F1B3A]/8 pt-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6C6885]">Contribution</p><p className="mt-1 text-xl font-black tracking-[-0.05em] text-[#1F1B3A]">{formatUsdcDisplay(formatUsdcAmount(group.contributionAmount))}</p></div><span className="inline-flex items-center gap-1 text-xs font-bold text-[#5A4BDB]">Open <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden="true" /></span></div>
                </Link>
              ))}
            </div>
          ) : <div className="rounded-3xl border border-dashed border-[#1F1B3A]/15 bg-white/60 p-10 text-center"><Compass className="mx-auto h-8 w-8 text-[#5A4BDB]" aria-hidden="true" /><p className="mt-4 text-lg font-bold">No groups have been registered yet.</p><p className="mt-1 text-sm text-[#6C6885]">Create the first circle and invite your community.</p></div>}
        </section>
      </div>
    </AppShell>
  );
}
