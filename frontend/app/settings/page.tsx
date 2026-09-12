"use client";

import { Check, Copy, Moon, Save, Sun, WalletCards } from "lucide-react";
import { useEffect, useState } from "react";

import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { useCircleContext } from "@/src/providers/CircleProvider";

const notificationDefaults = {
  email: true,
  reminders: true,
  payouts: false,
};

const SETTINGS_KEY = "equb-preferences";

function shortenAddress(address: string | null) {
  return address ? `${address.slice(0, 8)}...${address.slice(-6)}` : "Not connected";
}

export default function SettingsPage() {
  const { walletAddress } = useCircleContext();
  const [displayName, setDisplayName] = useState("Equb member");
  const [notifications, setNotifications] = useState(notificationDefaults);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(SETTINGS_KEY);
        if (!stored) return;
        const preferences = JSON.parse(stored) as { displayName?: string; notifications?: Partial<typeof notificationDefaults> };
        if (preferences.displayName) setDisplayName(preferences.displayName);
        if (preferences.notifications) setNotifications((current) => ({ ...current, ...preferences.notifications }));
      } catch {
        window.localStorage.removeItem(SETTINGS_KEY);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const savePreferences = () => {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ displayName: displayName.trim() || "Equb member", notifications }));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  const copyAddress = async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-8 pb-10">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5A4BDB]">Preferences</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.07em] text-[#1F1B3A] md:text-4xl">Settings</h1>
          <p className="mt-2 text-sm leading-6 text-[#6C6885] md:text-base">Keep your profile and contribution updates configured the way you prefer.</p>
        </header>

        <section className="rounded-3xl border border-[#1F1B3A]/8 bg-white p-5 shadow-[0_14px_35px_rgba(31,27,58,0.05)] sm:p-6" aria-labelledby="profile-heading">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0ECFF] text-[#5A4BDB]"><WalletCards className="h-5 w-5" aria-hidden="true" /></div>
            <div><h2 id="profile-heading" className="text-xl font-black tracking-[-0.05em] text-[#1F1B3A]">Profile</h2><p className="mt-1 text-sm text-[#6C6885]">This name is stored on this device and is not written to the chain.</p></div>
          </div>
          <div className="mt-6 space-y-5">
            <div className="space-y-2"><label htmlFor="display-name" className="text-sm font-bold text-[#1F1B3A]">Display name</label><input id="display-name" type="text" value={displayName} maxLength={40} onChange={(event) => setDisplayName(event.target.value)} className="w-full rounded-2xl border border-[#1F1B3A]/10 bg-[#F8F7F5] px-4 py-3 text-sm text-[#1F1B3A] outline-none transition placeholder:text-[#9A96AA] focus:border-[#5A4BDB] focus:bg-white" /></div>
            <div className="space-y-2"><label htmlFor="wallet-address" className="text-sm font-bold text-[#1F1B3A]">Connected wallet</label><div className="flex gap-2"><input id="wallet-address" readOnly value={walletAddress ?? ""} placeholder="Sign in to connect a wallet" className="min-w-0 flex-1 rounded-2xl border border-[#1F1B3A]/10 bg-[#F8F7F5] px-4 py-3 text-sm text-[#1F1B3A] outline-none placeholder:text-[#9A96AA]" /><button type="button" onClick={() => void copyAddress()} disabled={!walletAddress} className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-[#1F1B3A]/10 px-3 py-2 text-xs font-bold text-[#5A4BDB] hover:bg-[#F0ECFF] disabled:cursor-not-allowed disabled:opacity-50" aria-label="Copy connected wallet address">{copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}{copied ? "Copied" : "Copy"}</button></div><p className="text-xs text-[#6C6885]">{shortenAddress(walletAddress)} · Arc Testnet</p></div>
          </div>
        </section>

        <section className="rounded-3xl border border-[#1F1B3A]/8 bg-white p-5 shadow-[0_14px_35px_rgba(31,27,58,0.05)] sm:p-6" aria-labelledby="notifications-heading">
          <div><h2 id="notifications-heading" className="text-xl font-black tracking-[-0.05em] text-[#1F1B3A]">Notifications</h2><p className="mt-1 text-sm text-[#6C6885]">Choose which updates you want to see from your circles.</p></div>
          <div className="mt-6 divide-y divide-[#1F1B3A]/8 rounded-2xl border border-[#1F1B3A]/8">
            {([
              ["email", "Email alerts", "Sign-in and account updates"],
              ["reminders", "Contribution reminders", "A heads-up before a payment is due"],
              ["payouts", "Payout notifications", "When a round is completed"],
            ] as const).map(([key, label, description]) => (
              <div key={key} className="flex items-center justify-between gap-4 p-4"><div><p className="text-sm font-bold text-[#1F1B3A]">{label}</p><p className="mt-1 text-xs text-[#6C6885]">{description}</p></div><button type="button" role="switch" aria-checked={notifications[key]} aria-label={`Toggle ${label.toLowerCase()}`} onClick={() => setNotifications((current) => ({ ...current, [key]: !current[key] }))} className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${notifications[key] ? "bg-[#5A4BDB]" : "bg-[#C9C5D7]"}`}><span className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${notifications[key] ? "translate-x-6" : "translate-x-1"}`} /></button></div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-[#1F1B3A]/8 bg-white p-5 shadow-[0_14px_35px_rgba(31,27,58,0.05)] sm:p-6" aria-labelledby="appearance-heading">
          <div><h2 id="appearance-heading" className="text-xl font-black tracking-[-0.05em] text-[#1F1B3A]">Appearance</h2><p className="mt-1 text-sm text-[#6C6885]">Choose how Equb looks on this device.</p></div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="button" aria-pressed="true" className="flex items-center gap-3 rounded-2xl border border-[#5A4BDB] bg-[#F0ECFF] p-4 text-left"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#5A4BDB]"><Sun className="h-5 w-5" aria-hidden="true" /></span><span><span className="block text-sm font-bold text-[#1F1B3A]">Light mode</span><span className="mt-1 block text-xs text-[#6C6885]">Current theme</span></span></button><button type="button" disabled aria-pressed="false" className="flex items-center gap-3 rounded-2xl border border-[#1F1B3A]/8 bg-[#F8F7F5] p-4 text-left opacity-55"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#6C6885]"><Moon className="h-5 w-5" aria-hidden="true" /></span><span><span className="block text-sm font-bold text-[#1F1B3A]">Dark mode</span><span className="mt-1 block text-xs text-[#6C6885]">Coming soon</span></span></button></div>
        </section>

        <div className="flex flex-col items-start justify-between gap-3 border-t border-[#1F1B3A]/8 pt-6 sm:flex-row sm:items-center"><p className="text-xs text-[#6C6885]">Preferences are saved locally to this browser.</p><Button type="button" onClick={savePreferences} className="gap-2"><Save className="h-4 w-4" aria-hidden="true" />{saved ? "Saved" : "Save changes"}</Button></div>
        {saved ? <p className="rounded-2xl bg-[#EAF8F1] px-4 py-3 text-sm font-semibold text-[#1F8A4D]" role="status">Your preferences were saved.</p> : null}
      </div>
    </AppShell>
  );
}
