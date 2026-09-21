"use client";

import { useState, useEffect, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Check, CheckCircle2, Copy, Link2, Loader2, PiggyBank, ShieldCheck, Users, X } from "lucide-react";

import type { GroupDetail } from "@/types";
import { useActivateGroup } from "@/src/hooks/useActivateGroup";
import { useDistributePayout } from "@/src/hooks/useDistributePayout";
import { Toast } from "@/components/shared/Toast";

type GroupHeroProps = {
  group: GroupDetail;
  groupAddress: string;
  isOwner: boolean;
  canContribute?: boolean;
  isContributing?: boolean;
  onContribute?: () => void;
  onInviteMember?: (address: string) => Promise<boolean>;
  isInviting?: boolean;
  inviteError?: string | null;
  onSuccess?: () => void;
};

const statusStyles: Record<GroupDetail["status"] | "full", string> = {
  forming: "bg-[#FFF4E5] text-[#8A5A00]",
  full: "bg-[#FFF4E5] text-[#8A5A00]",
  active: "bg-[#EAF8F1] text-[#1F8A4D]",
  completed: "bg-[#F0ECFF] text-[#5A4BDB]",
  cancelled: "bg-[#FFF0F3] text-[#B4234D]",
};

const statusLabels: Record<GroupDetail["status"] | "full", string> = {
  forming: "Forming",
  full: "Full",
  active: "Active",
  completed: "Ended",
  cancelled: "Cancelled",
};

export function GroupHero({
  group,
  groupAddress,
  isOwner,
  canContribute = false,
  isContributing = false,
  onContribute,
  onInviteMember,
  isInviting = false,
  inviteError = null,
  onSuccess,
}: GroupHeroProps) {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [invitee, setInvitee] = useState("");
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const { activateGroup, isLoading: isActivating, isSuccess: activateSuccess, error: activateError } = useActivateGroup(groupAddress);
  const { distributePayout, isLoading: isDistributing, isSuccess: distributeSuccess, error: distributeError } = useDistributePayout(groupAddress);
  const paidCount = group.paidCount;
  const progressValue = group.memberCount > 0 ? Math.min((paidCount / group.memberCount) * 100, 100) : 0;
  const inviteCode = `EQB-${groupAddress.slice(2, 6).toUpperCase()}`;
  const invitePath = `/join?code=${inviteCode}`;

  const copyInviteLink = async () => {
    try {
      const link = typeof window === "undefined" ? invitePath : `${window.location.origin}${invitePath}`;
      await navigator.clipboard.writeText(link);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 1800);
    } catch {
      setInviteMessage("Copying is unavailable. Share the invite code instead.");
    }
  };

  useEffect(() => {
    if (activateSuccess) {
      setToast({ message: "Group activated successfully!", type: "success" });
      onSuccess?.();
    }
    if (activateError) {
      setToast({ message: activateError, type: "error" });
    }
    if (distributeSuccess) {
      setToast({ message: "Payout distributed successfully!", type: "success" });
      onSuccess?.();
    }
    if (distributeError) {
      setToast({ message: distributeError, type: "error" });
    }
  }, [activateSuccess, activateError, distributeSuccess, distributeError, onSuccess]);

  const handleInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInviteMessage(null);
    if (!invitee.trim()) {
      setInviteMessage("Enter the wallet address you want to invite.");
      return;
    }

    const invited = await onInviteMember?.(invitee) ?? false;
    if (invited) {
      setInvitee("");
      setInviteMessage("Wallet added to the group.");
    } else if (!inviteError) {
      setInviteMessage("We could not send the invite. Check the address and try again.");
    }
  };

  const effectiveStatus = group.status === "forming" && group.memberCount >= group.maxMembers 
    ? "full" 
    : group.status;

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      onAnimationStart={() => {
        console.log("GroupHero render - isOwner:", isOwner, "group.status:", group.status);
      }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-3xl border border-[#1F1B3A]/8 bg-white p-5 shadow-[0_14px_35px_rgba(31,27,58,0.06)] sm:p-6"
    >
      <div className="grid gap-7 lg:grid-cols-[minmax(0,1.45fr)_minmax(17rem,0.75fr)] lg:items-center">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${statusStyles[effectiveStatus]}`}>
              {statusLabels[effectiveStatus]}
            </span>
            {group.isPrivate ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1F1B3A]/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#6C6885]">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Invite-only
              </span>
            ) : null}
            {(isOwner && (group.status === "forming" || group.status === "active")) ? (
              <div className="ml-auto flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInviteOpen(true)}
                    className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-[#5A4BDB] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#493bc5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A4BDB]/50"
                  >
                    <Users className="h-4 w-4" aria-hidden="true" /> Invite member
                  </button>
                  {group.status === "forming" && group.memberCount >= 3 ? (
                    <button
                      type="button"
                      onClick={activateGroup}
                      disabled={isActivating}
                      className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-green-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isActivating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                      {isActivating ? "Activating..." : "Activate Group"}
                    </button>
                  ) : null}
                </div>
                {group.status === "forming" && group.memberCount < 3 ? (
                  <p className="text-[10px] text-[#6C6885]">Requires minimum 3 members to activate</p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div>
            <h1 className="text-3xl font-black tracking-[-0.07em] text-[#1F1B3A] md:text-4xl">{group.name}</h1>
            <p className="mt-2 text-sm text-[#6C6885] md:text-base">
              {group.interval === "weekly" ? "Weekly" : "Monthly"} contributions · Round {Math.min(group.currentRound, group.totalRounds)} of {group.totalRounds}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 rounded-2xl bg-[#F6F3EC] px-3 py-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5A4BDB] text-sm font-bold text-white">{group.dagnaAvatar}</div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6C6885]">Dagna</p>
                <p className="text-sm font-semibold text-[#1F1B3A]">{group.dagnaName}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-[#1F1B3A]/8 bg-[#F6F3EC] px-3 py-3 text-sm text-[#1F1B3A]">
              <span className="font-bold">{group.memberCount}/{group.maxMembers}</span> members
            </div>
          </div>

          <dl className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#1F1B3A]/8 bg-[#F6F3EC] p-3">
              <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6C6885]">Contribution</dt>
              <dd className="mt-2 text-lg font-bold text-[#1F1B3A]">${group.contributionAmount.toLocaleString()} USDC</dd>
            </div>
            <div className="rounded-2xl border border-[#1F1B3A]/8 bg-[#F6F3EC] p-3">
              <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6C6885]">Members paid</dt>
              <dd className="mt-2 text-lg font-bold text-[#1F1B3A]">{paidCount} of {group.memberCount}</dd>
            </div>
            <div className="rounded-2xl border border-[#1F1B3A]/8 bg-[#F6F3EC] p-3">
              <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6C6885]">Frequency</dt>
              <dd className="mt-2 text-lg font-bold text-[#1F1B3A]">{group.interval === "weekly" ? "Weekly" : "Monthly"}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-3xl border border-[#5A4BDB]/10 bg-[#F8F6FF] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#6C6885]">Current pool</p>
              <p className="mt-2 text-3xl font-black tracking-[-0.07em] text-[#1F1B3A]">${group.poolValue.toLocaleString()} <span className="text-base font-semibold tracking-normal text-[#6C6885]">USDC</span></p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5A4BDB]/10 text-[#5A4BDB]"><PiggyBank className="h-5 w-5" aria-hidden="true" /></div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-[#6C6885]"><span>Round progress</span><span>{Math.round(progressValue)}%</span></div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#E7E3F0]" role="progressbar" aria-valuenow={Math.round(progressValue)} aria-valuemin={0} aria-valuemax={100} aria-label="Contribution progress">
              <div className="h-full rounded-full bg-[#5A4BDB] transition-[width] duration-500" style={{ width: `${progressValue}%` }} />
            </div>
            <p className="flex items-center gap-2 text-sm font-semibold text-[#1F1B3A]"><CheckCircle2 className="h-4 w-4 text-[#3BB273]" aria-hidden="true" /> {paidCount} members paid this round</p>
          </div>

          {canContribute ? (
            <button type="button" onClick={onContribute} disabled={isContributing} className="mt-5 w-full rounded-2xl bg-[#5A4BDB] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#493bc5] disabled:cursor-not-allowed disabled:opacity-70">
              {isContributing ? "Processing contribution..." : "Contribute now"}
            </button>
          ) : null}

          {isOwner && group.status === "active" && group.manualPayout && paidCount === group.memberCount && group.memberCount > 0 ? (
            <button type="button" onClick={() => void distributePayout()} disabled={isDistributing} className="mt-5 w-full rounded-2xl border border-[#5A4BDB] bg-white px-4 py-3 text-sm font-bold text-[#5A4BDB] transition hover:bg-[#F0ECFF] disabled:cursor-not-allowed disabled:opacity-70">
              {isDistributing ? "Distributing payout..." : "Distribute Payout"}
            </button>
          ) : null}
        </div>
      </div>

      {isInviteOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#1F1B3A]/45 p-4 backdrop-blur-sm" onClick={() => setIsInviteOpen(false)}>
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-dialog-title"
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            onClick={(event) => event.stopPropagation()}
            className="my-4 w-full max-w-md rounded-3xl border border-[#1F1B3A]/8 bg-white p-5 shadow-[0_24px_70px_rgba(31,27,58,0.2)] sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5A4BDB]">Group invitations</p>
                <h2 id="invite-dialog-title" className="mt-2 text-2xl font-black tracking-[-0.06em] text-[#1F1B3A]">Bring in a member</h2>
              </div>
              <button type="button" aria-label="Close invite dialog" onClick={() => setIsInviteOpen(false)} className="rounded-xl p-2 text-[#6C6885] hover:bg-[#F6F3EC] hover:text-[#1F1B3A]"><X className="h-5 w-5" aria-hidden="true" /></button>
            </div>

            {group.isPrivate ? (
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#F0B54A]/25 bg-[#FFF4E5] p-4 text-xs leading-5 text-[#8A5A00]">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>This is an invite-only group. Add the member&apos;s wallet directly below; sharing a code will not bypass the private-group rule.</span>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-[#5A4BDB]/10 bg-[#F8F6FF] p-4">
                <p className="text-sm font-bold text-[#1F1B3A]">Share the invite code</p>
                <p className="mt-1 text-xs leading-5 text-[#6C6885]">Members can use this code to review the group and request to join.</p>
                <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-3">
                  <span className="text-lg font-black tracking-[0.12em] text-[#5A4BDB]">{inviteCode}</span>
                  <button type="button" onClick={() => void copyInviteLink()} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-[#5A4BDB] hover:bg-[#F0ECFF]" aria-label="Copy invite link">
                    {isCopied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}{isCopied ? "Copied" : "Copy link"}
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleInvite} className="mt-5 space-y-3">
              <div>
                <label htmlFor="invite-wallet" className="text-sm font-bold text-[#1F1B3A]">Add wallet directly</label>
                <p className="mt-1 text-xs text-[#6C6885]">Use the full 0x wallet address. Invites are available while the group is forming.</p>
              </div>
              <input id="invite-wallet" type="text" value={invitee} onChange={(event) => setInvitee(event.target.value)} placeholder="0x..." autoComplete="off" className="w-full rounded-2xl border border-[#1F1B3A]/10 bg-[#F8F7F5] px-4 py-3 text-sm text-[#1F1B3A] outline-none placeholder:text-[#9A96AA] focus:border-[#5A4BDB]" />
              <button type="submit" disabled={isInviting} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#5A4BDB] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#493bc5] disabled:cursor-not-allowed disabled:opacity-70">
                {isInviting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
                {isInviting ? "Sending invite..." : "Add wallet to group"}
              </button>
            </form>
            {inviteMessage || inviteError ? <p className={`mt-3 rounded-xl px-3 py-2 text-xs font-semibold ${inviteError ? "bg-[#FFF0F3] text-[#B4234D]" : "bg-[#EAF8F1] text-[#1F8A4D]"}`} role="status">{inviteError ?? inviteMessage}</p> : null}
          </motion.div>
        </div>
      ) : null}

      {toast ? <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} /> : null}
    </motion.section>
  );
}
