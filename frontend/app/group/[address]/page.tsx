"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Banknote, CalendarDays, Users } from "lucide-react";
import { useParams } from "next/navigation";

import AppShell from "@/components/layout/AppShell";
import { ContributeModal } from "@/components/shared/ContributeModal";
import { CelebrationModal } from "@/components/shared/CelebrationModal";
import { Toast } from "@/components/shared/Toast";
import { ContributionProgress } from "@/components/shared/ContributionProgress";
import { ErrorState } from "@/components/shared/ErrorState";
import { GroupHero } from "@/components/shared/GroupHero";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { MemberTable } from "@/components/shared/MemberTable";
import { RoundHistory } from "@/components/shared/RoundHistory";
import { TreasuryCard } from "@/components/shared/TreasuryCard";
import { useWallet } from "@/hooks/useWallet";
import { useGroup } from "@/src/hooks/useGroup";
import { useContribute } from "@/src/hooks/useContribute";
import { useTreasury } from "@/src/hooks/useTreasury";
import { formatUsdcAmount } from "@/src/lib/format";
import { publicClient } from "@/src/lib/arc";
import { EqubGroup } from "@/src/lib/contract";
import type { GroupDetail, GroupMember, Winner } from "@/types";

const shortenAddress = (value?: string) => {
  if (!value) {
    return "Unknown";
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
};

export default function GroupDetailPage() {
  const params = useParams<{ address: string }>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, isLoading, error, refetch: refetchGroup } = useGroup(params?.address);
  const treasury = useTreasury(params?.address ?? "");
  const { currentRound, currentPool, status, refetch: refetchTreasury } = treasury;
  const { contribute, isLoading: isContributing, isSuccess: contributionSuccess, error: contributionError, txHash } = useContribute(params?.address ?? "");
  const { walletAddress } = useWallet();
  const [canContribute, setCanContribute] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const lastContributionError = useRef<string | null>(null);
  const lastContributionSuccess = useRef(false);
  const previousRoundRef = useRef<number | null>(null);
  const [celebration, setCelebration] = useState<{ winner: string; round: number; amount: number } | null>(null);

  useEffect(() => {
    if (!walletAddress || !params?.address || !data || status !== 1) {
      const resetTimeoutId = window.setTimeout(() => setCanContribute(false), 0);
      return () => window.clearTimeout(resetTimeoutId);
    }

    let isActive = true;
    const loadEligibility = async () => {
      try {
        const address = params.address as `0x${string}`;
        const [isMember, memberInfo] = await Promise.all([
          publicClient.readContract({ address, abi: EqubGroup, functionName: "isMember", args: [walletAddress as `0x${string}`] }),
          publicClient.readContract({ address, abi: EqubGroup, functionName: "memberInfo", args: [walletAddress as `0x${string}`] }),
        ]);
        if (isActive) setCanContribute(Boolean(isMember) && !(memberInfo as readonly unknown[])[2]);
      } catch {
        if (isActive) setCanContribute(false);
      }
    };

    void loadEligibility();
    return () => { isActive = false; };
  }, [data, params?.address, currentRound, status, walletAddress]);

  useEffect(() => {
    if (contributionSuccess && !lastContributionSuccess.current) {
      lastContributionSuccess.current = true;
      void refetchTreasury();
      void refetchGroup();
      setToast({ message: "Contribution confirmed!", type: "success" });
    }
    if (!contributionSuccess) lastContributionSuccess.current = false;
  }, [contributionSuccess, refetchGroup, refetchTreasury]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (window.sessionStorage.getItem("equb_join_success") === params?.address) {
        window.sessionStorage.removeItem("equb_join_success");
        setToast({ message: "Successfully joined the group!", type: "success" });
      }
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [params?.address]);

  useEffect(() => {
    if (contributionError && contributionError !== lastContributionError.current) {
      lastContributionError.current = contributionError;
      setToast({ message: contributionError, type: "error" });
    }
  }, [contributionError]);

  useEffect(() => {
    const observedRound = currentRound;
    const previousRound = previousRoundRef.current;
    previousRoundRef.current = observedRound || previousRound;

    if (!observedRound || previousRound === null || observedRound <= previousRound || !params?.address) {
      return;
    }

    let isActive = true;
    const loadWinner = async () => {
      try {
        const winner = await publicClient.readContract({
          address: params.address as `0x${string}`,
          abi: EqubGroup,
          functionName: "roundWinner",
          args: [previousRound],
        });
        if (isActive) setCelebration({ winner: String(winner), round: previousRound, amount: currentPool });
      } catch (caughtError) {
        console.error("Failed to load completed round winner:", caughtError);
      }
    };

    void loadWinner();
    return () => { isActive = false; };
  }, [currentPool, currentRound, params?.address]);

  const group = useMemo<GroupDetail | null>(() => {
    if (!data) {
      return null;
    }

    const contributionAmount = formatUsdcAmount(data.contributionAmount);
    const dagnaName = shortenAddress(data.dagna);
    const normalizedMembers: GroupMember[] = (data.members && data.members.length > 0 ? data.members : [data.dagna]).map((memberAddress, index) => ({
      id: `${memberAddress}-${index}`,
      name: memberAddress === data.dagna ? dagnaName : `Member ${index + 1}`,
      wallet: memberAddress,
      avatar: memberAddress === data.dagna ? dagnaName.slice(0, 2).toUpperCase() : `M${index + 1}`,
      hasPaid: memberAddress === data.dagna || index % 2 === 0,
      hasReceived: index % 3 === 0,
      joinedAt: new Date(Date.UTC(2024, 0, 15 + index)).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    }));

    const winners: Winner[] = [];

    return {
      id: params?.address ?? data.dagna,
      name: data.groupName || "Equb Group",
      dagnaName,
      dagnaAvatar: dagnaName.slice(0, 2).toUpperCase() || "DG",
      currentRound: Number(data.currentRound ?? 1),
      totalRounds: Math.max(Number(data.currentRound ?? 1), 1),
      contributionAmount,
      interval: data.interval === 1 ? "monthly" : "weekly",
      maxMembers: Number(data.maxMembers ?? 1),
      poolValue: contributionAmount * Math.max(Number(data.memberCount ?? 1), 1),
      members: normalizedMembers,
      winners,
    };
  }, [data, params?.address]);

  const treasuryCards = [
    {
      label: "Current Pool",
      value: `${treasury.currentPool.toLocaleString()} USDC`,
      icon: Banknote,
      description: "Total available in the circle",
    },
    {
      label: "Paid Members",
      value: `${treasury.paidCount} / ${treasury.memberCount}`,
      icon: Users,
      description: "Members who paid this round",
    },
    {
      label: "Remaining Members",
      value: String(treasury.remainingMembers),
      icon: ArrowUpRight,
      description: "Members yet to pay this round",
    },
    {
      label: "Progress",
      value: `${treasury.progressPercent.toFixed(2)}%`,
      icon: CalendarDays,
      description: "Round contribution progress",
    },
  ];

  const sectionVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0 },
  };

  if (isLoading) {
    return (
      <AppShell>
        <LoadingSpinner label="Loading group details..." />
      </AppShell>
    );
  }

  if (error || treasury.error || !group) {
    return (
      <AppShell>
        <ErrorState message={error ?? treasury.error ?? "No group details were returned from Arc Testnet."} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8 pb-24">
        <GroupHero
          group={group}
          groupAddress={params.address}
          isOwner={Boolean(walletAddress && data?.dagna && walletAddress.toLowerCase() === data.dagna.toLowerCase())}
          canContribute={canContribute}
          isContributing={isContributing}
          onContribute={() => setIsModalOpen(true)}
        />

        <motion.section
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          {treasuryCards.map((card) => (
            <TreasuryCard
              key={card.label}
              label={card.label}
              value={card.value}
              icon={card.icon}
              description={card.description}
            />
          ))}
        </motion.section>

        <motion.section
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          transition={{ duration: 0.32, ease: "easeOut" }}
          className="space-y-4"
        >
          <h2 className="text-xl font-bold tracking-[-0.05em] text-[#1F1B3A]">
            Contribution Progress
          </h2>
          <ContributionProgress members={group.members} />
        </motion.section>

        <motion.section
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          transition={{ duration: 0.34, ease: "easeOut" }}
          className="space-y-4"
        >
          <h2 className="text-xl font-bold tracking-[-0.05em] text-[#1F1B3A]">Members</h2>
          <MemberTable members={group.members} />
        </motion.section>

        <motion.section
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          transition={{ duration: 0.36, ease: "easeOut" }}
        >
          <RoundHistory winners={group.winners} />
        </motion.section>
      </div>

      {canContribute ? <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#1F1B3A]/5 bg-white/90 p-3 backdrop-blur-sm md:hidden">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="w-full rounded-2xl bg-[#5A4BDB] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(90,75,219,0.25)]"
        >
          Contribute
        </button>
      </div> : null}

      <ContributeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        groupAddress={params.address}
        contribute={contribute}
        isLoading={isContributing}
        isSuccess={contributionSuccess}
        error={contributionError}
        txHash={txHash}
        groupName={group.name}
        amount={group.contributionAmount}
        round={group.currentRound}
      />

      <CelebrationModal
        isOpen={Boolean(celebration)}
        onClose={() => setCelebration(null)}
        winner={celebration?.winner ?? "Unknown"}
        round={celebration?.round ?? 0}
        amount={celebration?.amount ?? 0}
      />
      {toast ? <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} /> : null}
    </AppShell>
  );
}
