"use client";

import { motion } from "framer-motion";
import { Banknote, Inbox, PiggyBank } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { ActivityItem } from "@/components/shared/ActivityItem";
import { AnalyticsCard } from "@/components/shared/AnalyticsCard";
import { ContributionReminder } from "@/components/shared/ContributionReminder";
import { EqubGroupCard } from "@/components/shared/EqubGroupCard";
import { ErrorState } from "@/components/shared/ErrorState";
import { AuthModal } from "@/components/shared/AuthModal";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { useEffect, useState } from "react";
import { useFactory } from "@/src/hooks/useFactory";
import { formatUsdcAmount } from "@/src/lib/format";
import { useCircleContext } from "@/src/providers/CircleProvider";
import type { Group } from "@/types";

const sectionVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

export default function MyEqubsPage() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { groups, isLoading, error, refetch } = useFactory();
  const { walletAddress } = useCircleContext();
  const connectedGroups = walletAddress
    ? groups.filter((group) => group.dagna.toLowerCase() === walletAddress.toLowerCase())
    : [];

  useEffect(() => {
    const handleDataUpdated = () => void refetch();
    window.addEventListener("equb-data-updated", handleDataUpdated);
    return () => window.removeEventListener("equb-data-updated", handleDataUpdated);
  }, [refetch]);

  const mappedGroups: Group[] = connectedGroups.map((group, index) => {
    const normalizedContributionAmount = formatUsdcAmount(group.contributionAmount);
    const maxMembers = Number(group.maxMembers ?? 1);
    const groupAddress = String(group.groupAddress ?? index);

    return {
      id: groupAddress,
      groupAddress,
      name: group.name || `Group ${index + 1}`,
      currentRound: 1,
      totalRounds: 1,
      members: 1,
      maxMembers,
      poolValue: normalizedContributionAmount,
      nextPayoutDate: new Date(Date.UTC(2025, 0, 10 + index * 7)).toISOString(),
      status: "active",
      contributionAmount: normalizedContributionAmount,
      interval: Number(group.interval) === 1 ? "monthly" : "weekly",
      isPrivate: group.isPrivate,
    };
  });

  const firstGroup = mappedGroups[0];
  const totalSaved = connectedGroups.reduce(
    (sum, g) => sum + formatUsdcAmount(g.contributionAmount),
    0,
  );

  if (isLoading) {
    return (
      <AppShell>
        <LoadingSpinner label="Loading your Equbs..." />
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

  if (!walletAddress) {
    return (
      <AppShell>
        <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-[#1F1B3A]/15 bg-white/70 p-10 text-center shadow-sm">
          <div>
            <h2 className="text-2xl font-bold tracking-[-0.05em] text-[#1F1B3A]">Sign in to see your Equbs</h2>
            <p className="mt-2 text-sm text-[#6C6885]">Connect your wallet to view your groups.</p>
            <Button
              type="button"
              onClick={() => setIsAuthOpen(true)}
              className="mt-6 rounded-2xl bg-[#5A4BDB] px-5 py-3 text-sm font-semibold text-white hover:bg-[#4d3fd1]"
            >
              Sign In
            </Button>
          </div>
        </div>
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      </AppShell>
    );
  }

  const stats = [
    { label: "Total Saved", value: `$${totalSaved.toLocaleString()} USDC`, description: "Across all active circles", icon: "" },
    { label: "Active Equbs", value: String(mappedGroups.length), description: "Groups currently contributing", icon: "" },
    { label: "Private Groups", value: String(mappedGroups.filter((group) => group.isPrivate).length), description: "Invite-only groups", icon: "" },
    { label: "Next Contribution", value: firstGroup ? `$${firstGroup.contributionAmount.toLocaleString()}` : "$0", description: "current batch amount", icon: "" },
  ] as const;

  return (
    <AppShell>
      <div className="space-y-8 pb-10">
        <motion.section
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="rounded-2xl border border-[#1F1B3A]/5 bg-white/60 p-6 shadow-sm backdrop-blur-sm"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5A4BDB]">
            Dashboard
          </p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-[-0.06em] text-[#1F1B3A] md:text-4xl">
                My Equbs
              </h1>
              <p className="mt-2 text-sm text-[#6C6885] md:text-base">
                Track payouts, contributions, and your active circles in one place.
              </p>
            </div>
          </div>
        </motion.section>

        {mappedGroups.length === 0 ? (
          <motion.section
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#1F1B3A]/15 bg-white/70 p-10 text-center shadow-sm">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#5A4BDB]/10 text-[#5A4BDB]">
                <Inbox className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold tracking-[-0.05em] text-[#1F1B3A]">
                No Equbs yet
              </h2>
              <p className="mt-2 max-w-md text-sm text-[#6C6885]">
                Start a new contribution circle and bring your group together.
              </p>
              <Button className="mt-6 rounded-2xl bg-[#5A4BDB] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(90,75,219,0.2)] hover:bg-[#4d3fd1]">
                Create Equb
              </Button>
            </div>
          </motion.section>
        ) : (
          <>
            <motion.section
              initial="hidden"
              animate="visible"
              variants={sectionVariants}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat, index) => (
                  <AnalyticsCard
                    key={stat.label}
                    label={stat.label}
                    value={stat.value}
                    description={stat.description}
                    icon={index === 0 ? PiggyBank : Banknote}
                    delay={index * 0.06}
                  />
                ))}
              </div>
            </motion.section>

            {firstGroup ? (
              <motion.section
                initial="hidden"
                animate="visible"
                variants={sectionVariants}
                transition={{ duration: 0.32, ease: "easeOut" }}
                className="rounded-2xl"
              >
                <ContributionReminder
                  groupName={firstGroup.name}
                  amount={firstGroup.contributionAmount}
                  deadline={firstGroup.nextPayoutDate}
                />
              </motion.section>
            ) : null}

            <motion.section
              initial="hidden"
              animate="visible"
              variants={sectionVariants}
              transition={{ duration: 0.34, ease: "easeOut" }}
              className="space-y-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-[-0.05em] text-[#1F1B3A]">
                  Current Equbs
                </h2>
              </div>

              <div className="grid gap-5 xl:grid-cols-3">
                {mappedGroups.map((group, index) => (
                  <EqubGroupCard key={group.id} group={group} delay={index * 0.07} />
                ))}
              </div>
            </motion.section>

            <motion.section
              initial="hidden"
              animate="visible"
              variants={sectionVariants}
              transition={{ duration: 0.36, ease: "easeOut" }}
              className="space-y-5"
            >
              <h2 className="text-xl font-bold tracking-[-0.05em] text-[#1F1B3A]">
                Recent Activity
              </h2>

              <div className="rounded-2xl border border-[#1F1B3A]/5 bg-white/70 p-3 shadow-sm">
                <div className="space-y-3">
                  {mappedGroups.map((group, index) => (
                    <ActivityItem
                      key={`${group.id}-${index}`}
                      item={{
                        id: `${group.id}-activity-${index}`,
                        type: "joined",
                        description: `Registry entry loaded for ${group.name}`,
                        amount: null,
                        date: "Now",
                        groupName: group.name,
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.section>
          </>
        )}
      </div>
    </AppShell>
  );
}
