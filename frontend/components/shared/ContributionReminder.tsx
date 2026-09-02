"use client";

import { motion } from "framer-motion";

import { Button } from "@/components/ui/Button";

const formatDaysRemaining = (dateString: string) => {
  const now = new Date();
  const target = new Date(dateString);
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 0);
};

type ContributionReminderProps = {
  groupName: string;
  amount: number;
  deadline: string;
};

export function ContributionReminder({
  groupName,
  amount,
  deadline,
}: ContributionReminderProps) {
  const daysRemaining = formatDaysRemaining(deadline);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      whileHover={{ y: -1 }}
      className="relative overflow-hidden rounded-2xl bg-[#5A4BDB] p-6 text-white shadow-[0_18px_34px_rgba(90,75,219,0.28)]"
    >
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.15, 0.28, 0.15] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10"
      />

      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-white/80">Contribution reminder</p>
          <h3 className="mt-1 text-2xl font-black tracking-[-0.06em]">{groupName}</h3>
          <p className="mt-2 text-sm text-white/80">
            Due in <span className="font-semibold text-white">{daysRemaining} days</span>
          </p>
        </div>

        <div className="flex items-end gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-white/70">Amount due</p>
            <p className="mt-1 text-3xl font-black tracking-[-0.06em]">
              ${amount.toLocaleString()}<span className="text-lg text-white/80"> USDC</span>
            </p>
          </div>

          <Button className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#5A4BDB] shadow-md hover:bg-[#f7f5ff]">
            Contribute
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
