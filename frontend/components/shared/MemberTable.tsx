"use client";

import type { GroupMember } from "@/types";

type MemberTableProps = {
  members: GroupMember[];
};

const shortenWallet = (wallet: string) => `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;

export function MemberTable({ members }: MemberTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#1F1B3A]/5 bg-white shadow-[0_12px_30px_rgba(31,27,58,0.04)]">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-[#F6F3EC] text-left text-xs uppercase tracking-[0.12em] text-[#6C6885]">
            <tr>
              <th className="px-4 py-3 font-semibold">Avatar</th>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Wallet</th>
              <th className="px-4 py-3 font-semibold">Paid Status</th>
              <th className="px-4 py-3 font-semibold">Received Payout</th>
              <th className="px-4 py-3 font-semibold">Joined Date</th>
            </tr>
          </thead>

          <tbody>
            {members.map((member, index) => (
              <tr
                key={member.id}
                className={[
                  "transition-colors hover:bg-[#F6F3EC]/70",
                  index % 2 === 0 ? "bg-white" : "bg-[#F6F3EC]/50",
                ].join(" ")}
              >
                <td className="px-4 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F7F5FF] text-sm font-bold text-[#5A4BDB]">
                    {member.avatar}
                  </div>
                </td>

                <td className="px-4 py-3 text-sm font-semibold text-[#1F1B3A]">{member.name}</td>
                <td className="px-4 py-3 text-sm text-[#6C6885]">{shortenWallet(member.wallet)}</td>

                <td className="px-4 py-3">
                  <span
                    className={[
                      "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      member.hasPaid
                        ? "bg-[#3BB273]/15 text-[#1F8A4D]"
                        : "bg-[#1F1B3A]/5 text-[#6C6885]",
                    ].join(" ")}
                  >
                    {member.hasPaid ? "Paid" : "Pending"}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <span
                    className={[
                      "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      member.hasReceived
                        ? "bg-[#3BB273]/15 text-[#1F8A4D]"
                        : "bg-[#1F1B3A]/5 text-[#6C6885]",
                    ].join(" ")}
                  >
                    {member.hasReceived ? "Received" : "Waiting"}
                  </span>
                </td>

                <td className="px-4 py-3 text-sm text-[#6C6885]">{member.joinedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
