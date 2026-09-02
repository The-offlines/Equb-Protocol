"use client";

import { motion } from "framer-motion";

import AppShell from "@/components/layout/AppShell";

const notificationRows = [
  { label: "Email alerts", enabled: true },
  { label: "Contribution reminders", enabled: true },
  { label: "Payout notifications", enabled: false },
];

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="space-y-8 pb-10">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="space-y-3"
        >
          <h1 className="text-3xl font-black tracking-[-0.06em] text-[#1F1B3A] md:text-4xl">
            Settings
          </h1>
          <p className="text-base text-[#6C6885] md:text-lg">
            Manage your account and preferences.
          </p>
        </motion.section>

        <div className="space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: "easeOut", delay: 0.05 }}
            className="rounded-2xl border border-[#1F1B3A]/5 bg-white p-6 shadow-[0_12px_30px_rgba(31,27,58,0.04)]"
          >
            <h2 className="text-xl font-bold tracking-[-0.05em] text-[#1F1B3A]">
              Profile
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#1F1B3A]">
                  Display Name
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    defaultValue="Jordan Wells"
                    className="w-full rounded-2xl border border-gray-200 bg-[#F6F3EC] px-4 py-3 text-sm text-[#1F1B3A] outline-none focus:border-[#5A4BDB]"
                  />
                  <button
                    type="button"
                    className="rounded-2xl bg-[#5A4BDB] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(90,75,219,0.2)] hover:bg-[#4d3fd1]"
                  >
                    Save
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#1F1B3A]">
                  Wallet Address
                </label>
                <input
                  readOnly
                  placeholder="Connect wallet to view address"
                  className="w-full rounded-2xl border border-gray-200 bg-[#F6F3EC] px-4 py-3 text-sm text-[#1F1B3A] outline-none placeholder:text-[#6C6885]"
                />
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.34, ease: "easeOut", delay: 0.1 }}
            className="rounded-2xl border border-[#1F1B3A]/5 bg-white p-6 shadow-[0_12px_30px_rgba(31,27,58,0.04)]"
          >
            <h2 className="text-xl font-bold tracking-[-0.05em] text-[#1F1B3A]">
              Notifications
            </h2>

            <div className="mt-5 space-y-4">
              {notificationRows.map(({ label, enabled }) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-2xl border border-gray-200 bg-[#F6F3EC] px-4 py-3"
                >
                  <span className="text-sm font-medium text-[#1F1B3A]">{label}</span>

                  <button
                    type="button"
                    aria-pressed={enabled}
                    className={[
                      "relative inline-flex h-7 w-12 items-center rounded-full transition-colors",
                      enabled ? "bg-[#5A4BDB]" : "bg-gray-300",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "absolute h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                        enabled ? "translate-x-6" : "translate-x-1",
                      ].join(" ")}
                    />
                  </button>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.36, ease: "easeOut", delay: 0.15 }}
            className="rounded-2xl border border-[#1F1B3A]/5 bg-white p-6 shadow-[0_12px_30px_rgba(31,27,58,0.04)]"
          >
            <h2 className="text-xl font-bold tracking-[-0.05em] text-[#1F1B3A]">
              Appearance
            </h2>

            <div className="mt-5 flex items-center justify-between rounded-2xl border border-[#5A4BDB]/20 bg-[#F7F5FF] px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[#1F1B3A]">Light mode</p>
                <p className="text-xs text-[#6C6885]">Selected theme</p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5A4BDB]/10 text-[#5A4BDB]">
                <span className="text-base font-bold">L</span>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </AppShell>
  );
}
