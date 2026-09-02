"use client";

import { motion } from "framer-motion";
import { Activity, Plus, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";

import AppShell from "@/components/layout/AppShell";
import { AnalyticsCard } from "@/components/shared/AnalyticsCard";
import { BalanceCard } from "@/components/shared/BalanceCard";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useFactory } from "@/src/hooks/useFactory";
import { formatUsdcAmount } from "@/src/lib/format";

// TODO: replace with real profile name from wallet
const userName = "Coner";

const quickActions = [
  {
    title: "Create Equb",
    description: "Launch a new savings circle with your group.",
    icon: Plus,
    route: "/create",
  },
  {
    title: "Join Equb",
    description: "Browse active circles and request to join.",
    icon: UserPlus,
    route: "/join",
  },
  {
    title: "View Activity",
    description: "Check recent payouts, contributions, and updates.",
    icon: Activity,
    route: "/my-equbs",
  },
];

export default function DashboardPage() {
  const { groups, totalGroups, isLoading, error } = useFactory();
  const router = useRouter();
  const totalSaved = groups.reduce(
    (sum, g) => sum + formatUsdcAmount(g.contributionAmount),
    0,
  );

  const stats = [
    {
      label: "Total Groups",
      value: String(Number(totalGroups)),
      description: "Groups currently on Arc Testnet",
      icon: Activity,
    },
    {
      label: "Active Equbs",
      value: String(groups.length),
      description: "Groups returned by the factory",
      icon: Plus,
    },
    {
      label: "Total Saved",
      value: `$${totalSaved.toLocaleString()} USDC`,
      description: "Combined contribution amounts",
      icon: Activity,
    },
    {
      label: "Private Circles",
      value: String(groups.filter((group) => group.isPrivate).length),
      description: "Invite-only rounds",
      icon: UserPlus,
    },
    {
      label: "Next Contribution",
      value: groups[0]
        ? `${Number(groups[0].contributionAmount / BigInt(10 ** 18)).toLocaleString()} USDC`
        : "N/A",
      description: "Latest factory entry",
      icon: Plus,
    },
  ];

  if (isLoading) {
    return (
      <AppShell>
        <LoadingSpinner label="Loading Arc dashboard..." />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <ErrorState message={error} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8 pb-10">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="rounded-3xl bg-gradient-to-r from-[#5A4BDB] to-[#7C6EF4] p-6 text-white shadow-[0_20px_45px_rgba(90,75,219,0.22)]"
        >
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                Overview
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.06em] md:text-4xl">
                Good morning, {userName} 👋
              </h1>
              <p className="mt-2 text-sm text-white/80 md:text-base">
                Here&apos;s what&apos;s happening with your Equbs today.
              </p>
            </div>

            <div className="hidden h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-2xl font-black shadow-inner sm:flex">
              E
            </div>
          </div>
        </motion.section>

        <BalanceCard />

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: "easeOut", delay: 0.05 }}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat, index) => (
              <AnalyticsCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                description={stat.description}
                icon={stat.icon}
                delay={index * 0.06}
              />
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, ease: "easeOut", delay: 0.1 }}
          className="space-y-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-[-0.05em] text-[#1F1B3A]">
              Quick Actions
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {quickActions.map(({ title, description, icon: Icon, route }, index) => (
              <motion.button
                key={title}
                type="button"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut", delay: 0.12 + index * 0.06 }}
                whileHover={{ y: -2 }}
                onClick={() => router.push(route)}
                className="cursor-pointer rounded-2xl border border-[#1F1B3A]/5 bg-white p-5 text-left shadow-[0_12px_30px_rgba(31,27,58,0.04)] transition-colors hover:border-[#5A4BDB]/20 hover:bg-[#F7F5FF]"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5A4BDB]/10 text-[#5A4BDB]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold tracking-[-0.04em] text-[#1F1B3A]">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#6C6885]">{description}</p>
              </motion.button>
            ))}
          </div>
        </motion.section>
      </div>
    </AppShell>
  );
}
