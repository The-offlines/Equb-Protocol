"use client";

import { Calendar, Check, ChevronLeft, Info, Loader2, LockKeyhole, Users, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import AppShell from "@/components/layout/AppShell";
import { AuthModal } from "@/components/shared/AuthModal";
import { Button } from "@/components/ui/Button";
import { useCircleContext } from "@/src/providers/CircleProvider";
import { useCreateGroup } from "@/src/hooks/useCreateGroup";

const initialValues = {
  name: "",
  contributionAmount: "",
  maxMembers: "8",
  interval: "0",
};

const steps = ["Group basics", "Rules", "Review"];
const intervalOptions: Array<[value: string, label: string, description: string, icon: LucideIcon]> = [
  ["0", "Weekly", "Every 7 days", Users],
  ["1", "Monthly", "Every 30 days", Calendar],
];

export default function CreatePage() {
  const router = useRouter();
  const { walletAddress } = useCircleContext();
  const { createGroup, isLoading, isSuccess, error, txHash } = useCreateGroup();
  const [formValues, setFormValues] = useState(initialValues);
  const [currentStep, setCurrentStep] = useState(1);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const name = query.get("name");
    const amount = query.get("amount");
    const members = query.get("members");
    if (!name && !amount && !members) return;
    setFormValues((current) => ({
      ...current,
      ...(name ? { name } : {}),
      ...(amount ? { contributionAmount: amount } : {}),
      ...(members ? { maxMembers: members } : {}),
    }));
  }, []);

  const amount = Number(formValues.contributionAmount);
  const memberCount = Number(formValues.maxMembers);
  const estimatedPool = Number.isFinite(amount) && Number.isFinite(memberCount) ? amount * memberCount : 0;

  const handleChange = <K extends keyof typeof initialValues>(
    field: K,
    value: (typeof initialValues)[K],
  ) => {
    setValidationMessage(null);
    setFormValues((previous) => ({ ...previous, [field]: value }));
  };

  const validateStep = (step: number) => {
    if (step === 1) {
      if (!formValues.name.trim()) {
        setValidationMessage("Add a name so your members know which circle they are joining.");
        return false;
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        setValidationMessage("Enter a contribution amount greater than 0 USDC.");
        return false;
      }
    }

    if (step === 2 && (!Number.isInteger(memberCount) || memberCount < 3 || memberCount > 50)) {
      setValidationMessage("Choose between 3 and 50 members.");
      return false;
    }

    setValidationMessage(null);
    return true;
  };

  const handleContinue = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((step) => Math.min(step + 1, 3));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateStep(1) || !validateStep(2)) {
      setCurrentStep(!formValues.name.trim() || !Number.isFinite(amount) || amount <= 0 ? 1 : 2);
      return;
    }

    if (!walletAddress) {
      setIsAuthOpen(true);
      return;
    }

    await createGroup(
      formValues.name.trim(),
      amount,
      memberCount,
      Number(formValues.interval),
      true,
    );
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl pb-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5A4BDB]">Create an Equb</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.06em] text-[#1F1B3A] md:text-4xl">
              Launch a new savings circle
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6C6885] md:text-base">
              Define the rules once, then invite the people you trust.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-2 self-start rounded-xl px-2 py-2 text-sm font-semibold text-[#6C6885] hover:bg-white hover:text-[#1F1B3A] sm:self-auto"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Back to overview
          </button>
        </div>

        <div className="mb-6 rounded-2xl border border-[#5A4BDB]/15 bg-[#F0ECFF] p-4 text-sm text-[#493bc5]">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>Creating a group uses your Circle wallet to approve one on-chain transaction. You can add wallet members from the group page after it is deployed.</p>
          </div>
        </div>

        <div className="mb-6 grid gap-2 sm:grid-cols-3" aria-label="Create group progress">
          {steps.map((label, index) => {
            const step = index + 1;
            const complete = currentStep > step;
            const active = currentStep === step;
            return (
              <div
                key={label}
                aria-current={active ? "step" : undefined}
                className={`flex items-center gap-2 rounded-2xl border px-3 py-3 text-sm font-semibold ${
                  active
                    ? "border-[#5A4BDB] bg-[#F0ECFF] text-[#5A4BDB]"
                    : complete
                      ? "border-[#3BB273]/25 bg-[#EAF8F1] text-[#1F8A4D]"
                      : "border-[#1F1B3A]/10 bg-white text-[#6C6885]"
                }`}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs shadow-sm">
                  {complete ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : step}
                </span>
                <span>{label}</span>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <form
            onSubmit={handleSubmit}
            noValidate
            className="rounded-[28px] border border-[#1F1B3A]/8 bg-white p-5 shadow-[0_18px_40px_rgba(31,27,58,0.05)] sm:p-8"
          >
            {currentStep === 1 ? (
              <section className="space-y-6" aria-labelledby="basics-heading">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6C6885]">Step 1 of 3</p>
                  <h2 id="basics-heading" className="mt-2 text-2xl font-black tracking-[-0.05em] text-[#1F1B3A]">Start with the goal</h2>
                  <p className="mt-2 text-sm leading-6 text-[#6C6885]">Give the circle a name and choose the amount everyone will contribute.</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="group-name" className="text-sm font-semibold text-[#1F1B3A]">Group name</label>
                  <input
                    id="group-name"
                    type="text"
                    value={formValues.name}
                    onChange={(event) => handleChange("name", event.target.value)}
                    placeholder="Neighborhood Savings Circle"
                    maxLength={80}
                    autoComplete="off"
                    aria-invalid={Boolean(validationMessage && !formValues.name.trim())}
                    className="w-full rounded-2xl border border-[#1F1B3A]/10 bg-[#F8F7F5] px-4 py-3.5 text-[#1F1B3A] outline-none transition placeholder:text-[#9A96AA] focus:border-[#5A4BDB] focus:bg-white"
                  />
                  <p className="text-xs text-[#6C6885]">Use a name your members will recognize.</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="contribution-amount" className="text-sm font-semibold text-[#1F1B3A]">Contribution amount</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#6C6885]">$</span>
                    <input
                      id="contribution-amount"
                      type="number"
                      min="1"
                      step="0.01"
                      inputMode="decimal"
                      value={formValues.contributionAmount}
                      onChange={(event) => handleChange("contributionAmount", event.target.value)}
                      placeholder="250"
                      aria-invalid={Boolean(validationMessage && (!Number.isFinite(amount) || amount <= 0))}
                      className="w-full rounded-2xl border border-[#1F1B3A]/10 bg-[#F8F7F5] px-10 py-3.5 text-[#1F1B3A] outline-none transition placeholder:text-[#9A96AA] focus:border-[#5A4BDB] focus:bg-white"
                    />
                  </div>
                  <p className="text-xs text-[#6C6885]">The same amount is due from every member each round.</p>
                </div>
              </section>
            ) : null}

            {currentStep === 2 ? (
              <section className="space-y-6" aria-labelledby="rules-heading">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6C6885]">Step 2 of 3</p>
                  <h2 id="rules-heading" className="mt-2 text-2xl font-black tracking-[-0.05em] text-[#1F1B3A]">Set the rules</h2>
                  <p className="mt-2 text-sm leading-6 text-[#6C6885]">These rules are recorded with the group and used for every round.</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="max-members" className="text-sm font-semibold text-[#1F1B3A]">Member limit</label>
                  <div className="relative">
                    <Users className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6C6885]" aria-hidden="true" />
                    <input
                      id="max-members"
                      type="number"
                      min={3}
                      max={50}
                      step={1}
                      inputMode="numeric"
                      value={formValues.maxMembers}
                      onChange={(event) => handleChange("maxMembers", event.target.value)}
                      aria-describedby="member-limit-help"
                      className="w-full rounded-2xl border border-[#1F1B3A]/10 bg-[#F8F7F5] px-11 py-3.5 text-[#1F1B3A] outline-none transition focus:border-[#5A4BDB] focus:bg-white"
                    />
                  </div>
                  <p id="member-limit-help" className="text-xs text-[#6C6885]">Choose between 3 and 50 members, including you.</p>
                </div>

                <fieldset className="space-y-3">
                  <legend className="text-sm font-semibold text-[#1F1B3A]">Contribution frequency</legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {intervalOptions.map(([value, label, description, Icon]) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={formValues.interval === value}
                        onClick={() => handleChange("interval", value)}
                        className={`rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A4BDB]/50 ${
                          formValues.interval === value
                            ? "border-[#5A4BDB] bg-[#F0ECFF] text-[#5A4BDB]"
                            : "border-[#1F1B3A]/10 bg-[#F8F7F5] text-[#1F1B3A] hover:border-[#5A4BDB]/30"
                        }`}
                      >
                        <span className="flex items-center gap-2 font-bold"><Icon className="h-4 w-4" aria-hidden="true" />{label}</span>
                        <span className="mt-1 block text-xs text-[#6C6885]">{description}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div className="flex items-start gap-3 rounded-2xl border border-[#5A4BDB]/15 bg-[#F0ECFF] p-4">
                  <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-[#5A4BDB]" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-[#1F1B3A]">Private by default</p>
                    <p className="mt-1 text-xs leading-5 text-[#6C6885]">Every Equb is invite-only. Add members from the group page after launch.</p>
                  </div>
                </div>
              </section>
            ) : null}

            {currentStep === 3 ? (
              <section className="space-y-6" aria-labelledby="review-heading">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6C6885]">Step 3 of 3</p>
                  <h2 id="review-heading" className="mt-2 text-2xl font-black tracking-[-0.05em] text-[#1F1B3A]">Review before launch</h2>
                  <p className="mt-2 text-sm leading-6 text-[#6C6885]">Check the rules carefully. They become the group&apos;s shared starting point.</p>
                </div>

                <div className="rounded-3xl border border-[#1F1B3A]/8 bg-[#F8F7F5] p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4 border-b border-[#1F1B3A]/8 pb-5">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6C6885]">Group</p>
                      <h3 className="mt-1 truncate text-2xl font-black tracking-[-0.05em] text-[#1F1B3A]">{formValues.name || "Untitled Equb"}</h3>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#5A4BDB] shadow-sm">
                      <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
                      Private
                    </span>
                  </div>
                  <dl className="mt-5 grid gap-5 sm:grid-cols-2">
                    <div><dt className="text-xs text-[#6C6885]">Contribution</dt><dd className="mt-1 text-lg font-bold text-[#1F1B3A]">${Number.isFinite(amount) ? amount.toLocaleString() : "0"} USDC</dd></div>
                    <div><dt className="text-xs text-[#6C6885]">Frequency</dt><dd className="mt-1 text-lg font-bold text-[#1F1B3A]">{formValues.interval === "0" ? "Weekly" : "Monthly"}</dd></div>
                    <div><dt className="text-xs text-[#6C6885]">Member limit</dt><dd className="mt-1 text-lg font-bold text-[#1F1B3A]">{memberCount || "0"}</dd></div>
                    <div><dt className="text-xs text-[#6C6885]">Expected payout</dt><dd className="mt-1 text-lg font-bold text-[#3BB273]">${estimatedPool.toLocaleString()} USDC</dd></div>
                  </dl>
                </div>

                <div className="rounded-2xl border border-[#5A4BDB]/15 bg-[#F0ECFF] p-4 text-sm leading-6 text-[#493bc5]">
                  After deployment, the group starts in forming mode. Add members from the group page before activating the first round.
                </div>
              </section>
            ) : null}

            {validationMessage ? <p className="mt-6 rounded-2xl bg-[#FFF4E5] px-4 py-3 text-sm font-medium text-[#8A5A00]" role="alert">{validationMessage}</p> : null}
            {error ? (
              <div className="mt-6 space-y-3 rounded-2xl bg-[#FFF0F3] px-4 py-3" role="alert">
                <p className="text-sm font-medium text-[#B4234D]">{error}</p>
                <a href="https://faucet.circle.com/" target="_blank" rel="noreferrer" className="inline-flex text-xs font-bold text-[#5A4BDB] hover:underline">Get Arc testnet funds</a>
              </div>
            ) : null}
            {isSuccess ? <p className="mt-6 rounded-2xl bg-[#EAF8F1] px-4 py-3 text-sm font-semibold text-[#1F8A4D]" role="status">Equb created. Opening your group...</p> : null}
            {txHash ? <p className="mt-3 break-all text-xs text-[#6C6885]">Transaction confirmed: {txHash}</p> : null}

            <div className="mt-8 flex items-center justify-between gap-3 border-t border-[#1F1B3A]/8 pt-6">
              <div className="flex gap-1.5" aria-label={`Step ${currentStep} of 3`}>
                {steps.map((label, index) => <span key={label} className={`h-2 w-2 rounded-full ${currentStep >= index + 1 ? "bg-[#5A4BDB]" : "bg-[#1F1B3A]/10"}`} />)}
              </div>
              <div className="flex gap-3">
                {currentStep > 1 ? <Button type="button" variant="secondary" onClick={() => { setValidationMessage(null); setCurrentStep((step) => step - 1); }}>Back</Button> : null}
                {currentStep < 3 ? (
                  <Button type="button" onClick={handleContinue}>Continue</Button>
                ) : (
                  <Button type="submit" disabled={isLoading || isSuccess}>
                    {isLoading ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Creating...</span> : walletAddress ? "Deploy Equb" : "Sign in to deploy"}
                  </Button>
                )}
              </div>
            </div>
          </form>

          <aside className="hidden h-fit rounded-3xl border border-[#1F1B3A]/8 bg-white p-5 shadow-sm lg:block">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6C6885]">Live summary</p>
            <div className="mt-5 rounded-2xl bg-[#F0ECFF] p-4">
              <p className="truncate text-sm font-bold text-[#1F1B3A]">{formValues.name || "Your Equb name"}</p>
              <p className="mt-2 text-3xl font-black tracking-[-0.06em] text-[#1F1B3A]">${Number.isFinite(amount) ? amount.toLocaleString() : "0"}</p>
              <p className="text-xs font-semibold text-[#6C6885]">USDC per {formValues.interval === "0" ? "week" : "month"}</p>
            </div>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-3"><dt className="text-[#6C6885]">Members</dt><dd className="font-bold">0 / {memberCount || "-"}</dd></div>
              <div className="flex items-center justify-between gap-3"><dt className="text-[#6C6885]">Expected payout</dt><dd className="font-bold text-[#3BB273]">${estimatedPool.toLocaleString()}</dd></div>
                <div className="flex items-center justify-between gap-3"><dt className="text-[#6C6885]">Access</dt><dd className="font-bold">Invite-only</dd></div>
            </dl>
          </aside>
        </div>
      </div>
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </AppShell>
  );
}
