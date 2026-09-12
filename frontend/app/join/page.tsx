"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Clipboard, Info, Loader2, LockKeyhole, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import AppShell from "@/components/layout/AppShell";
import { AuthModal } from "@/components/shared/AuthModal";
import { Button } from "@/components/ui/Button";
import { useFactory } from "@/src/hooks/useFactory";
import { useJoinGroup } from "@/src/hooks/useJoinGroup";
import { useCircleContext } from "@/src/providers/CircleProvider";
import { formatUsdcAmount } from "@/src/lib/format";
import { INVITE_CODE_PATTERN, normalizeInviteCode } from "@/src/lib/invite";

export default function JoinPage() {
  const { groups, isLoading: groupsLoading } = useFactory();
  const { walletAddress } = useCircleContext();
  const { joinGroup, isLoading, isSuccess, error } = useJoinGroup();
  const [inviteValue, setInviteValue] = useState("");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [pasteMessage, setPasteMessage] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const queryCode = new URLSearchParams(window.location.search).get("code");
      if (queryCode) setInviteValue(queryCode);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const normalizedCode = normalizeInviteCode(inviteValue);
  const isValidFormat = INVITE_CODE_PATTERN.test(normalizedCode);
  const matchedGroup = useMemo(
    () => isValidFormat ? groups.find((group) => group.groupAddress.slice(2, 6).toUpperCase() === normalizedCode.slice(4)) : undefined,
    [groups, isValidFormat, normalizedCode],
  );
  const canJoin = Boolean(matchedGroup && !matchedGroup.isPrivate && matchedGroup.groupAddress && matchedGroup.interval !== undefined);

  const pasteInviteLink = async () => {
    setPasteMessage(null);
    try {
      const value = await navigator.clipboard.readText();
      if (!value) {
        setPasteMessage("Your clipboard is empty.");
        return;
      }
      setInviteValue(value);
    } catch {
      setPasteMessage("Clipboard access was blocked. Paste the link directly into the field.");
    }
  };

  const handleJoin = async () => {
    if (!matchedGroup || !canJoin) return;
    if (!walletAddress) {
      setIsAuthOpen(true);
      return;
    }
    await joinGroup(matchedGroup.groupAddress);
  };

  return (
    <AppShell>
      <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="w-full max-w-2xl rounded-[2rem] border border-[#1F1B3A]/8 bg-white p-5 shadow-[0_20px_45px_rgba(31,27,58,0.06)] sm:p-8">
          <div className="mx-auto max-w-lg text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0ECFF] text-[#5A4BDB]"><Users className="h-7 w-7" aria-hidden="true" /></div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#5A4BDB]">Member invite</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.07em] text-[#1F1B3A] sm:text-4xl">Join an Equb</h1>
            <p className="mt-3 text-sm leading-6 text-[#6C6885] sm:text-base">Enter the code from your Dagna. You&apos;ll review the circle details before approving the join transaction.</p>
          </div>

          <div className="mx-auto mt-8 max-w-lg space-y-5">
            <div className="space-y-2"><label htmlFor="invite-code" className="text-sm font-bold text-[#1F1B3A]">Invite code or link</label><div className="flex gap-2"><input id="invite-code" type="text" value={inviteValue} onChange={(event) => setInviteValue(event.target.value)} placeholder="EQB-4A9F or paste an invite link" autoComplete="off" className="min-w-0 flex-1 rounded-2xl border border-[#1F1B3A]/10 bg-[#F8F7F5] px-4 py-3.5 text-sm font-semibold tracking-[0.04em] text-[#1F1B3A] outline-none placeholder:font-normal placeholder:tracking-normal placeholder:text-[#9A96AA] focus:border-[#5A4BDB] focus:bg-white" /><button type="button" onClick={() => void pasteInviteLink()} className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-[#1F1B3A]/10 px-3 py-2 text-xs font-bold text-[#5A4BDB] hover:bg-[#F0ECFF]" aria-label="Paste invite link"><Clipboard className="h-4 w-4" aria-hidden="true" />Paste</button></div><p className="text-xs text-[#6C6885]">Codes look like EQB- followed by four characters from the group address.</p></div>

            {pasteMessage ? <p className="rounded-xl bg-[#FFF4E5] px-3 py-2 text-xs font-semibold text-[#8A5A00]" role="status">{pasteMessage}</p> : null}
            {inviteValue && !isValidFormat ? <p className="rounded-xl bg-[#FFF0F3] px-3 py-2 text-xs font-semibold text-[#B4234D]" role="alert">That does not look like a valid Equb invite code or link.</p> : null}
            {isValidFormat && !groupsLoading && !matchedGroup ? <p className="rounded-xl bg-[#FFF0F3] px-3 py-2 text-xs font-semibold text-[#B4234D]" role="alert">We couldn&apos;t find a group for this invite. Ask the Dagna for a fresh link.</p> : null}

            {matchedGroup ? (
              <div className="rounded-3xl border border-[#1F1B3A]/8 bg-[#F8F7F5] p-5">
                <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6C6885]">You&apos;re invited to</p><h2 className="mt-1 text-xl font-black tracking-[-0.05em] text-[#1F1B3A]">{matchedGroup.name}</h2></div><span className="rounded-full bg-[#F0ECFF] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#5A4BDB]">{matchedGroup.isPrivate ? "Private" : "Open"}</span></div>
                <dl className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-white p-3"><dt className="text-xs text-[#6C6885]">Contribution</dt><dd className="mt-1 text-sm font-bold text-[#1F1B3A]">{formatUsdcAmount(matchedGroup.contributionAmount).toLocaleString()} USDC</dd></div><div className="rounded-2xl bg-white p-3"><dt className="text-xs text-[#6C6885]">Member limit</dt><dd className="mt-1 text-sm font-bold text-[#1F1B3A]">{matchedGroup.maxMembers} members</dd></div></dl>
                {matchedGroup.isPrivate ? <div className="mt-4 flex items-start gap-2 rounded-2xl bg-[#FFF4E5] p-3 text-xs leading-5 text-[#8A5A00]"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span>This is an invite-only group. The Dagna must add your wallet directly before you can join on-chain.</span></div> : null}
              </div>
            ) : null}

            <Button type="button" onClick={() => void handleJoin()} disabled={!canJoin || isLoading || isSuccess} className="w-full gap-2 py-3.5">{isLoading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Joining group...</> : isSuccess ? <><CheckCircle2 className="h-4 w-4" aria-hidden="true" />Joined successfully</> : walletAddress ? <>Join this Equb <ArrowRight className="h-4 w-4" aria-hidden="true" /></> : <>Sign in to join <ArrowRight className="h-4 w-4" aria-hidden="true" /></>}</Button>
            {error ? <div className="rounded-2xl bg-[#FFF0F3] px-4 py-3 text-center text-sm font-medium text-[#B4234D]" role="alert">{error}</div> : null}
            {isSuccess ? <div className="rounded-2xl bg-[#EAF8F1] px-4 py-3 text-center text-sm font-semibold text-[#1F8A4D]" role="status">You joined the circle. Opening the group now...</div> : null}
          </div>

          <div className="mx-auto mt-8 flex max-w-lg items-start gap-3 rounded-2xl border border-[#5A4BDB]/12 bg-[#F0ECFF] p-4 text-xs leading-5 text-[#493bc5]"><Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span>Never approve a join transaction for a group you do not recognize. Equb will show the group name and contribution amount before you confirm.</span></div>
        </motion.div>
      </div>
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </AppShell>
  );
}
