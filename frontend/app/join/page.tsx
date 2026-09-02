"use client";

import { motion } from "framer-motion";
import { Loader2, QrCode } from "lucide-react";
import { useState } from "react";

import AppShell from "@/components/layout/AppShell";
import { useFactory } from "@/src/hooks/useFactory";
import { useJoinGroup } from "@/src/hooks/useJoinGroup";
import { formatUsdcAmount } from "@/src/lib/format";

export default function JoinPage() {
  const [inviteCode, setInviteCode] = useState("");
  const { groups } = useFactory();
  const { joinGroup, isLoading, isSuccess, error } = useJoinGroup();
  const normalizedCode = inviteCode.trim().toUpperCase();
  const matchedGroup = /^EQB-[A-F0-9]{4}$/.test(normalizedCode)
    ? groups.find((group) => group.groupAddress.slice(2, 6).toUpperCase() === normalizedCode.slice(4))
    : undefined;

  const handleJoinGroup = async () => {
    if (!matchedGroup) return;
    const joined = await joinGroup(matchedGroup.groupAddress);
    if (joined) setInviteCode("");
  };

  return (
    <AppShell>
      <div className="flex min-h-[70vh] items-center justify-center pb-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full max-w-xl space-y-8 rounded-[2rem] border border-[#1F1B3A]/5 bg-white/80 p-6 shadow-[0_20px_45px_rgba(31,27,58,0.04)] md:p-8"
        >
          <div className="text-center">
            <h1 className="text-3xl font-black tracking-[-0.06em] text-[#1F1B3A] md:text-4xl">
              Join an Equb
            </h1>
            <p className="mt-2 text-base text-[#6C6885] md:text-lg">
              All groups are private. You need an invite to join.
            </p>
          </div>

          <div className="space-y-3">
            <div className="text-center">
              <label className="text-sm font-semibold uppercase tracking-[0.12em] text-[#1F1B3A]">
                Join by Code
              </label>
            </div>

            <div className="flex justify-center">
              <input
                type="text"
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value)}
                placeholder="Enter invite code e.g. EQB-4A9K"
                className="w-full max-w-md rounded-2xl border border-gray-200 px-4 py-3 text-sm text-[#1F1B3A] placeholder:text-[#6C6885] focus:border-[#5A4BDB] focus:outline-none focus:ring-2 focus:ring-[#5A4BDB]/10"
              />
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => void handleJoinGroup()}
                disabled={!matchedGroup || isLoading}
                className="rounded-2xl bg-[#5A4BDB] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(90,75,219,0.2)] transition-colors hover:bg-[#4d3fd1] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Joining...
                  </span>
                ) : "Join This Equb"}
              </button>
            </div>

            <p className="text-center text-sm text-[#6C6885]">Ask your Dagna for the invite code.</p>
            {normalizedCode && !matchedGroup ? <p className="text-center text-sm text-[#D9345F]">Invalid invite code</p> : null}
            {matchedGroup ? (
              <div className="rounded-2xl border border-[#1F1B3A]/5 bg-[#F6F3EC] p-4 text-left">
                <p className="text-lg font-bold text-[#1F1B3A]">{matchedGroup.name}</p>
                <div className="mt-2 flex justify-between gap-3 text-sm text-[#6C6885]">
                  <span>{formatUsdcAmount(matchedGroup.contributionAmount).toLocaleString()} USDC contribution</span>
                  <span>{matchedGroup.maxMembers} members</span>
                </div>
              </div>
            ) : null}
            {isSuccess ? (
              <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#1F8A4D] px-4 py-3 text-sm font-semibold text-white shadow-lg" role="status">
                Successfully joined the group!
              </div>
            ) : null}
            {error ? (
              <div className="space-y-3 text-center">
                <p className="text-sm text-[#D9345F]">{error}</p>
                <a
                  href="https://faucet.circle.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-2xl border border-[#5A4BDB]/20 bg-[#5A4BDB]/5 px-4 py-2.5 text-sm font-semibold text-[#5A4BDB] transition-colors hover:bg-[#5A4BDB]/10"
                >
                  Get testnet USDC
                </a>
              </div>
            ) : null}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#1F1B3A]/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#6C6885]">
                or
              </span>
            </div>
          </div>

          <div className="space-y-4 text-center">
            <div>
              <p className="text-base font-semibold text-[#1F1B3A]">Have an invite link?</p>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                className="rounded-2xl border border-[#1F1B3A]/10 bg-[#F6F3EC] px-5 py-3 text-sm font-semibold text-[#1F1B3A] transition-colors hover:border-[#5A4BDB]/20 hover:text-[#5A4BDB]"
              >
                Paste Invite Link
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#1F1B3A]/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#6C6885]">
                or
              </span>
            </div>
          </div>

          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="flex h-48 w-48 items-center justify-center rounded-2xl bg-gray-100 text-[#1F1B3A]">
                <QrCode className="h-14 w-14" />
              </div>
            </div>
            <p className="text-base font-semibold text-[#1F1B3A]">Scan QR Code</p>
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}
