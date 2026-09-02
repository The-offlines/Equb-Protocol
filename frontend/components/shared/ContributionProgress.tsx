"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Crown } from "lucide-react";
import { useState } from "react";

import type { GroupMember } from "@/types";

type ContributionProgressProps = {
  members: GroupMember[];
};

const shortenWallet = (wallet: string) => `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;

export function ContributionProgress({ members }: ContributionProgressProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-[#1F1B3A]/5 bg-white p-5 shadow-[0_12px_30px_rgba(31,27,58,0.04)]">
      <div className="flex flex-wrap gap-3">
        {members.map((member) => {
          const isPaid = member.hasPaid;
          const isWinner = member.isCurrentWinner;
          const isSelected = selectedId === member.id;

          return (
            <div key={member.id} className="relative">
              <button
                type="button"
                onClick={() => setSelectedId(isSelected ? null : member.id)}
                className={[
                  "relative flex h-12 w-12 items-center justify-center rounded-full border-2 text-sm font-bold transition-transform",
                  isPaid ? "border-[#3BB273] bg-[#EAF8F1] text-[#1F8A4D]" : "border-gray-300 bg-[#F6F3EC] text-[#1F1B3A]",
                  isWinner ? "ring-2 ring-[#F0B54A]/50" : "",
                ].join(" ")}
                aria-label={member.name}
              >
                {member.avatar}

                {isPaid ? (
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#3BB273] text-white">
                    <Check className="h-3 w-3" />
                  </span>
                ) : null}

                {isWinner ? (
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#F0B54A] text-[#1F1B3A]">
                    <Crown className="h-3 w-3" />
                  </span>
                ) : null}
              </button>

              <AnimatePresence>
                {isSelected ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute left-1/2 top-full z-20 mt-3 w-52 -translate-x-1/2 rounded-2xl border border-[#1F1B3A]/5 bg-white p-3 text-left shadow-[0_16px_32px_rgba(31,27,58,0.08)]"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F7F5FF] text-[11px] font-bold text-[#5A4BDB]">
                        {member.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1F1B3A]">{member.name}</p>
                        <p className="text-[11px] text-[#6C6885]">{shortenWallet(member.wallet)}</p>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2 text-xs text-[#6C6885]">
                      <div className="flex items-center justify-between">
                        <span>Paid</span>
                        <span className={member.hasPaid ? "font-semibold text-[#1F8A4D]" : "font-semibold text-[#6C6885]"}>
                          {member.hasPaid ? "Paid" : "Pending"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Payout</span>
                        <span className={member.hasReceived ? "font-semibold text-[#1F8A4D]" : "font-semibold text-[#6C6885]"}>
                          {member.hasReceived ? "Received" : "Waiting"}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
