"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, CheckCircle2, Copy, PiggyBank, QrCode, X } from "lucide-react";

import type { GroupDetail } from "@/types";

type GroupHeroProps = {
  group: GroupDetail;
  groupAddress: string;
  isOwner: boolean;
  canContribute?: boolean;
  isContributing?: boolean;
  onContribute?: () => void;
};

export function GroupHero({ group, groupAddress, isOwner, canContribute = false, isContributing = false, onContribute }: GroupHeroProps) {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const paidCount = group.members.filter((member) => member.hasPaid).length;
  const progressValue = Math.min((paidCount / group.maxMembers) * 100, 100);

  const ringRadius = 42;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (progressValue / 100) * ringCircumference;
  const inviteCode = `EQB-${groupAddress.slice(2, 6).toUpperCase()}`;
  const inviteLink = typeof window === "undefined" ? "" : `${window.location.origin}/join?code=${inviteCode}`;


  const copyInviteLink = async () => {
    if (!inviteLink) {
      return;
    }

    await navigator.clipboard.writeText(inviteLink);
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 1800);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-3xl border border-[#1F1B3A]/5 bg-white p-6 shadow-[0_12px_30px_rgba(31,27,58,0.04)]"
    >
      <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr] lg:items-center">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-[#3BB273]/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#1F8A4D]">
              Active
            </span>
            {isOwner ? (
              <button
                type="button"
                onClick={() => setIsInviteOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#5A4BDB] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#4d3fd1]"
              >
                <QrCode className="h-4 w-4" />
                Invite Members
              </button>
            ) : null}
          </div>

          <div>
            <h1 className="text-3xl font-black tracking-[-0.06em] text-[#1F1B3A] md:text-4xl">
              {group.name}
            </h1>
            <p className="mt-2 text-sm text-[#6C6885] md:text-base">
              {group.interval === "weekly" ? "Weekly" : "Monthly"} contribution plan
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 rounded-2xl bg-[#F6F3EC] px-3 py-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5A4BDB] text-sm font-bold text-white">
                {group.dagnaAvatar}
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.12em] text-[#6C6885]">
                  Dagna
                </p>
                <p className="text-sm font-semibold text-[#1F1B3A]">{group.dagnaName}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#1F1B3A]/5 bg-[#F6F3EC] px-3 py-2 text-sm text-[#1F1B3A]">
              <span className="font-semibold">{group.members.length}/12</span> members
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#1F1B3A]/5 bg-[#F6F3EC] p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#6C6885]">
                Contribution
              </p>
              <p className="mt-2 text-lg font-bold text-[#1F1B3A]">
                {group.contributionAmount} USDC
              </p>
            </div>

            <div className="rounded-2xl border border-[#1F1B3A]/5 bg-[#F6F3EC] p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#6C6885]">
                Current round
              </p>
              <p className="mt-2 text-lg font-bold text-[#1F1B3A]">
                Round {group.currentRound} of {group.totalRounds}
              </p>
            </div>

            <div className="rounded-2xl border border-[#1F1B3A]/5 bg-[#F6F3EC] p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#6C6885]">
                Frequency
              </p>
              <p className="mt-2 text-lg font-bold text-[#1F1B3A]">
                {group.interval}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#1F1B3A]/5 bg-[#F8F6FF] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#6C6885]">Current pool</p>
              <p className="mt-3 text-3xl font-black tracking-[-0.06em] text-[#1F1B3A]">
                {group.poolValue.toLocaleString()} USDC
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5A4BDB]/10 text-[#5A4BDB]">
              <PiggyBank className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center">
            <div className="relative flex h-28 w-28 items-center justify-center">
              <svg className="h-28 w-28 -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r={ringRadius}
                  stroke="#E7E3F0"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={ringRadius}
                  stroke="#5A4BDB"
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-xl font-black tracking-[-0.06em] text-[#1F1B3A]">
                  {paidCount}
                </p>
                <p className="text-[11px] uppercase tracking-[0.12em] text-[#6C6885]">
                  / {group.maxMembers}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[#1F1B3A]">
            <CheckCircle2 className="h-4 w-4 text-[#3BB273]" />
            <span>Paid this round</span>
          </div>

          {canContribute ? (
            <button
              type="button"
              onClick={onContribute}
              disabled={isContributing}
              className="mt-5 w-full rounded-2xl bg-[#5A4BDB] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4d3fd1] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isContributing ? "Processing..." : "Contribute"}
            </button>
          ) : null}
        </div>
      </div>

      {isInviteOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F1B3A]/45 p-4" onClick={() => setIsInviteOpen(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_24px_70px_rgba(31,27,58,0.2)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5A4BDB]">Invite Members</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-[#1F1B3A]">Bring your circle together</h2>
              </div>
              <button type="button" aria-label="Close invite modal" onClick={() => setIsInviteOpen(false)} className="rounded-2xl p-2 text-[#6C6885] hover:bg-[#F6F3EC] hover:text-[#1F1B3A]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl bg-[#F8F6FF] p-5">
              <div className="flex h-36 w-36 items-center justify-center rounded-2xl border-2 border-dashed border-[#5A4BDB]/35 bg-white text-[#5A4BDB]">
                <QrCode className="h-20 w-20" strokeWidth={1.25} />
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-[0.14em] text-[#6C6885]">Invite code</p>
                <p className="mt-1 text-2xl font-black tracking-[0.08em] text-[#1F1B3A]">{inviteCode}</p>
              </div>
          {canContribute ? (
            <button
              type="button"
              onClick={onContribute}
              disabled={isContributing}
              className="mt-5 w-full rounded-2xl bg-[#5A4BDB] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4d3fd1] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isContributing ? "Processing..." : "Contribute"}
            </button>
          ) : null}
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-[#1F1B3A]/10 bg-[#F6F3EC] p-2">
              <input readOnly value={inviteLink} aria-label="Invite link" className="min-w-0 flex-1 bg-transparent px-2 text-xs text-[#6C6885] outline-none" />
              <button type="button" onClick={() => void copyInviteLink()} className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-[#5A4BDB] px-3 py-2 text-xs font-semibold text-white hover:bg-[#4d3fd1]">
                {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {isCopied ? "Copied!" : "Copy Invite Link"}
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </motion.section>
  );
}
