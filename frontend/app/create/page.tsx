"use client";

import { Calendar, Check, Copy, Loader2, Plus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { useCreateGroup } from "@/src/hooks/useCreateGroup";

const initialValues = {
  name: "",
  contributionAmount: "",
  maxMembers: "8",
  interval: "604800",
  isPrivate: true,
};

export default function CreatePage() {
  const router = useRouter();
  const { createGroup, isLoading, isSuccess, error, txHash } = useCreateGroup();
  const [formValues, setFormValues] = useState(initialValues);
  const [currentStep, setCurrentStep] = useState(1);
  const [walletAddresses, setWalletAddresses] = useState<string[]>([]);
  const [newWalletAddress, setNewWalletAddress] = useState("");

  useEffect(() => {
    if (!isSuccess) {
      return;
    }

    const timer = window.setTimeout(() => {
      router.push("/my-equbs");
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [isSuccess, router]);

  const handleChange = <K extends keyof typeof initialValues>(field: K, value: (typeof initialValues)[K]) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = formValues.name.trim();
    const contributionAmount = Number(formValues.contributionAmount);
    const maxMembers = Number(formValues.maxMembers);

    if (!name) {
      return;
    }

    if (!Number.isFinite(contributionAmount) || contributionAmount <= 0) {
      return;
    }

    await createGroup(
      name,
      contributionAmount,
      maxMembers,
      Number(formValues.interval),
      formValues.isPrivate,
    );
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl pb-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5A4BDB]">
              Create Equb
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.06em] text-[#1F1B3A]">
              Launch a new savings circle
            </h1>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-[#5A4BDB]/15 bg-[#5A4BDB]/5 px-4 py-3 text-sm text-[#4D3FD1]">
          Sign in with email for your identity, then approve the transaction with your Circle embedded wallet
        </div>

        <div className="mb-6 grid grid-cols-3 gap-2">
          {["Group Setup", "Schedule & Privacy", "Invite Members"].map((label, index) => {
            const step = index + 1;
            const complete = currentStep > step;
            return (
            <div
              key={label}
              className={`flex items-center justify-center gap-2 rounded-full border px-2 py-2 text-center text-xs font-semibold sm:text-sm ${
                step === currentStep
                  ? "border-[#5A4BDB] bg-[#5A4BDB]/10 text-[#5A4BDB]"
                  : complete
                    ? "border-[#1F8A4D]/20 bg-[#E9F8EF] text-[#1F8A4D]"
                    : "border-[#1F1B3A]/10 bg-white text-[#6C6885]"
              }`}
            >
              {complete ? <Check className="h-4 w-4" /> : null}
              <span>{label}</span>
            </div>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="rounded-[28px] border border-[#1F1B3A]/5 bg-white p-6 shadow-[0_18px_40px_rgba(31,27,58,0.04)] sm:p-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="group-name" className="text-sm font-semibold text-[#1F1B3A]">
                  Group Name
                </label>
                <input
                  id="group-name"
                  type="text"
                  value={formValues.name}
                  onChange={(event) => handleChange("name", event.target.value)}
                  placeholder="Neighborhood Savings Circle"
                  className="w-full rounded-2xl border border-[#1F1B3A]/10 bg-[#F8F7F5] px-4 py-3 text-[#1F1B3A] outline-none transition focus:border-[#5A4BDB]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="contribution-amount" className="text-sm font-semibold text-[#1F1B3A]">
                  Contribution Amount in USDC
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6C6885]">
                    $
                  </span>
                  <input
                    id="contribution-amount"
                    type="number"
                    min="1"
                    step="1"
                    value={formValues.contributionAmount}
                    onChange={(event) => handleChange("contributionAmount", event.target.value)}
                    placeholder="250"
                    className="w-full rounded-2xl border border-[#1F1B3A]/10 bg-[#F8F7F5] px-10 py-3 text-[#1F1B3A] outline-none transition focus:border-[#5A4BDB]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="rounded-2xl bg-[#5A4BDB] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(90,75,219,0.2)] transition hover:bg-[#4d3fd1]"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="max-members" className="text-sm font-semibold text-[#1F1B3A]">
                  Max Members
                </label>
                <input
                  id="max-members"
                  type="number"
                  min={3}
                  max={50}
                  value={formValues.maxMembers}
                  onChange={(event) => handleChange("maxMembers", event.target.value)}
                  className="w-full rounded-2xl border border-[#1F1B3A]/10 bg-[#F8F7F5] px-4 py-3 text-[#1F1B3A] outline-none transition focus:border-[#5A4BDB]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#1F1B3A]">Interval</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleChange("interval", "604800")}   // Weekly = 7 days in seconds
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      formValues.interval === "604800"
                        ? "border-[#5A4BDB] bg-[#5A4BDB]/10 text-[#5A4BDB]"
                        : "border-[#1F1B3A]/10 bg-[#F8F7F5] text-[#1F1B3A]"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <Users className="h-4 w-4" />
                      Weekly
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange("interval", "2592000")}   // Monthly = 30 days in seconds
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      formValues.interval === "2592000"
                        ? "border-[#5A4BDB] bg-[#5A4BDB]/10 text-[#5A4BDB]"
                        : "border-[#1F1B3A]/10 bg-[#F8F7F5] text-[#1F1B3A]"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <Calendar className="h-4 w-4" />
                      Monthly
                    </div>
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-[#1F1B3A]/10 bg-[#F8F7F5] p-4">
                <label className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#1F1B3A]">Private group</p>
                    <p className="text-xs text-[#6C6885]">Invite-only access</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formValues.isPrivate}
                    onClick={() => handleChange("isPrivate", !formValues.isPrivate)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                      formValues.isPrivate ? "bg-[#5A4BDB]" : "bg-[#D9D3F5]"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full bg-white transition ${
                        formValues.isPrivate ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </label>
              </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="rounded-2xl border border-[#1F1B3A]/10 bg-white px-4 py-2.5 text-sm font-semibold text-[#1F1B3A] transition hover:bg-[#F7F5FF]"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="min-w-45 rounded-2xl bg-[#5A4BDB] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(90,75,219,0.2)] hover:bg-[#4d3fd1]"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="wallet-address" className="text-sm font-semibold text-[#1F1B3A]">
                  Wallet Addresses
                </label>
                <div className="flex gap-2">
                  <input
                    id="wallet-address"
                    type="text"
                    value={newWalletAddress}
                    onChange={(event) => setNewWalletAddress(event.target.value)}
                    placeholder="0x..."
                    className="min-w-0 flex-1 rounded-2xl border border-[#1F1B3A]/10 bg-[#F8F7F5] px-4 py-3 text-[#1F1B3A] outline-none transition focus:border-[#5A4BDB]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const address = newWalletAddress.trim();
                      if (!address || walletAddresses.includes(address)) return;
                      setWalletAddresses((previous) => [...previous, address]);
                      setNewWalletAddress("");
                    }}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#5A4BDB]/20 text-[#5A4BDB]"
                    aria-label="Add wallet address"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                {walletAddresses.length > 0 ? <p className="break-all text-xs text-[#6C6885]">{walletAddresses.join(", ")}</p> : null}
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6C6885]">Shareable Link</p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={`${typeof window === "undefined" ? "equb.app" : window.location.host}/join/${formValues.name.trim().toLowerCase().replace(/\s+/g, "-") || "new-equb"}`}
                    className="min-w-0 flex-1 rounded-2xl border border-[#1F1B3A]/10 bg-[#F8F7F5] px-4 py-3 text-sm font-semibold text-[#1F1B3A]"
                  />
                  <button
                    type="button"
                    onClick={() => void navigator.clipboard.writeText(`${window.location.origin}/join/${formValues.name.trim().toLowerCase().replace(/\s+/g, "-") || "new-equb"}`)}
                    className="flex items-center gap-2 rounded-2xl border border-[#1F1B3A]/10 px-4 py-3 text-sm font-semibold text-[#5A4BDB]"
                  >
                    <Copy className="h-4 w-4" /> Copy
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-[#1F1B3A]/10 bg-[#F8F7F5] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6C6885]">Preview</p>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-xs text-[#6C6885]">Name</p><p className="mt-1 font-bold">{formValues.name || "Untitled Equb"}</p></div>
                  <div><p className="text-xs text-[#6C6885]">Contribution</p><p className="mt-1 font-bold">${formValues.contributionAmount || "0"} USDC</p></div>
                  <div><p className="text-xs text-[#6C6885]">Members</p><p className="mt-1 font-bold">{formValues.maxMembers}</p></div>
                  <div><p className="text-xs text-[#6C6885]">Frequency</p><p className="mt-1 font-bold">{formValues.interval === "0" ? "Weekly" : "Monthly"}</p></div>
                  <div><p className="text-xs text-[#6C6885]">Privacy</p><p className="mt-1 font-bold">{formValues.isPrivate ? "Private" : "Public"}</p></div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button type="button" onClick={() => setCurrentStep(2)} className="rounded-2xl border border-[#1F1B3A]/10 bg-white px-4 py-2.5 text-sm font-semibold text-[#1F1B3A]">Back</button>
                <Button type="submit" disabled={isLoading} className="min-w-45 rounded-2xl bg-[#5A4BDB] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(90,75,219,0.2)] hover:bg-[#4d3fd1]">
                  {isLoading ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Creating...</span> : "Deploy Equb"}
                </Button>
              </div>
            </div>
          )}

          {isSuccess && (
            <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              Equb created successfully!
            </div>
          )}

          {txHash && (
            <p className="mt-4 break-all text-xs text-[#6C6885]">Transaction: {txHash}</p>
          )}

          {error ? (
            <div className="mt-5 space-y-3 text-center">
              <p className="text-sm font-medium text-red-600">{error}</p>
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
        </form>
      </div>
    </AppShell>
  );
}
