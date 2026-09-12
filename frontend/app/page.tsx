"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  GitBranch,
  HeartHandshake,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  WalletCards,
} from "lucide-react";
import { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

import { LiveEqubDemo } from "@/components/landing/LiveEqubDemo";

const steps = [
  {
    number: "01",
    icon: Users,
    title: "Create your circle",
    description: "Set a contribution amount, schedule, and member limit in a few clear steps.",
  },
  {
    number: "02",
    icon: WalletCards,
    title: "Invite your people",
    description: "Share a private invite link so only trusted members can join the group.",
  },
  {
    number: "03",
    icon: CircleDollarSign,
    title: "Contribute on schedule",
    description: "Everyone pays the same amount in USDC while the group progress stays visible.",
  },
  {
    number: "04",
    icon: Target,
    title: "Receive the pool",
    description: "Each completed round sends the pool to the next member in the agreed order.",
  },
];

const benefits = [
  {
    icon: ShieldCheck,
    title: "Rules you can verify",
    description: "Contributions, member status, and round progress are recorded on-chain instead of hidden in a spreadsheet.",
  },
  {
    icon: LockKeyhole,
    title: "Private by default",
    description: "Your circle stays focused on the people you invite. There is no public marketplace to browse through.",
  },
  {
    icon: HeartHandshake,
    title: "Built for people",
    description: "A familiar savings habit with a calmer interface, clear reminders, and fewer crypto-specific decisions.",
  },
];

const faqs = [
  {
    question: "What is an Equb?",
    answer: "An Equb is a community savings circle. Members contribute a fixed amount on a recurring schedule, and one member receives the pooled funds each round.",
  },
  {
    question: "What does the group see?",
    answer: "Members can see the group rules, contribution progress, members, and completed rounds. This shared view makes it easier to coordinate without chasing updates.",
  },
  {
    question: "What happens if I miss a contribution?",
    answer: "A contribution can only be made once per round and must match the group amount. If you run into a problem, contact your Dagna before the round is completed.",
  },
];

function PrimaryLink({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#5A4BDB] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(90,75,219,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#493bc5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A4BDB]/60 focus-visible:ring-offset-2"
    >
      {children}
    </Link>
  );
}

function SecondaryLink({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#1F1B3A]/10 bg-white px-5 py-3 text-sm font-bold text-[#1F1B3A] transition-all hover:-translate-y-0.5 hover:border-[#5A4BDB]/30 hover:text-[#5A4BDB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A4BDB]/60 focus-visible:ring-offset-2"
    >
      {children}
    </Link>
  );
}

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState(0);
  const { scrollY } = useScroll();
  const heroOrbY = useTransform(scrollY, [0, 720], [0, -90]);
  const heroCardY = useTransform(scrollY, [0, 720], [0, -42]);

  return (
    <div className="min-h-screen overflow-hidden bg-[#F6F3EC] text-[#1F1B3A]">
      <main>
        <section className="relative px-4 pb-20 pt-28 sm:px-6 sm:pt-36 lg:pb-28">
          <motion.div style={{ y: heroOrbY }} className="pointer-events-none absolute -right-32 top-24 h-80 w-80 rounded-full bg-[#5A4BDB]/10 blur-3xl" />
          <motion.div style={{ y: heroOrbY }} className="pointer-events-none absolute -left-40 bottom-0 h-72 w-72 rounded-full bg-[#F0B54A]/10 blur-3xl" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.12 }}
                className="mb-5 text-[#F0B54A]"
                aria-hidden="true"
              >
                <Sparkles className="h-8 w-8 animate-pulse sm:h-10 sm:w-10" />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className="max-w-xl text-5xl font-black leading-[1.04] tracking-normal sm:text-6xl lg:text-7xl"
              >
                Save together.
                <span className="mt-2 block text-[#5A4BDB]">Receive together.</span>
              </motion.h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-[#6C6885] sm:text-xl">
                Equb brings the time-tested savings circle to transparent USDC on Arc. No crypto jargon, just a better way to build toward something together.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <PrimaryLink href="/create">
                  Create an Equb
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </PrimaryLink>
                <SecondaryLink href="/join">Join with an invite</SecondaryLink>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-[#6C6885]">
                <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#3BB273]" aria-hidden="true" />Private circles</span>
                <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#3BB273]" aria-hidden="true" />On-chain records</span>
                <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#3BB273]" aria-hidden="true" />USDC on Arc</span>
              </div>
            </div>

            <motion.div style={{ y: heroCardY }} className="relative mx-auto w-full max-w-md lg:mr-0">
              <div className="absolute inset-5 rounded-[2.5rem] bg-[#5A4BDB]/15 blur-2xl" />
              <motion.div
                animate={{ y: [0, -7, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                whileHover={{ y: -10, rotate: -1 }}
                className="relative rounded-[2rem] border border-white/80 bg-white p-5 shadow-[0_28px_70px_rgba(31,27,58,0.12)] sm:p-7"
              >
                <div className="flex items-center justify-between border-b border-[#1F1B3A]/8 pb-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6C6885]">Protocol preview</p>
                    <p className="mt-1 text-lg font-bold">A clear circle cadence</p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#EAF8F1] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#1F8A4D]">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#3BB273]" />On Arc
                  </span>
                </div>
                <div className="py-7">
                  <p className="text-sm font-medium text-[#6C6885]">Every round follows the same promise</p>
                  <p className="mt-2 text-4xl font-black tracking-normal sm:text-5xl">Save <span className="text-[#5A4BDB]">together</span></p>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {["Invite", "Contribute", "Receive"].map((step, index) => (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0.45, y: 4 }}
                      animate={{ opacity: [0.55, 1, 0.55], y: [4, 0, 4] }}
                      transition={{ duration: 2.8, delay: index * 0.35, repeat: Infinity, ease: "easeInOut" }}
                      className="rounded-2xl bg-[#F6F3EC] p-3"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-black text-[#5A4BDB]">{index + 1}</span>
                      <p className="mt-3 text-xs font-bold">{step}</p>
                      <p className="mt-1 text-[11px] leading-4 text-[#6C6885]">{index === 0 ? "Trusted people" : index === 1 ? "Same amount" : "Next member"}</p>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-7 flex items-center justify-between border-t border-[#1F1B3A]/8 pt-5">
                  <p className="text-xs font-semibold text-[#6C6885]">Private by design</p>
                  <p className="text-xs font-bold text-[#5A4BDB]">Transparent by default</p>
                </div>
              </motion.div>
              <div className="absolute -bottom-5 -left-5 hidden rounded-2xl border border-white bg-[#1F1B3A] px-4 py-3 text-white shadow-xl sm:block">
                <div className="flex items-center gap-2 text-xs font-semibold"><CheckCircle2 className="h-4 w-4 text-[#65D49A]" aria-hidden="true" />Every contribution visible</div>
              </div>
            </motion.div>
          </div>
        </section>

        <LiveEqubDemo />

        <section className="border-y border-[#1F1B3A]/8 bg-white px-4 py-8 sm:px-6">
          <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-3 sm:divide-x sm:divide-[#1F1B3A]/8">
            {[
              ["01", "Simple rules", "One amount. One schedule. No surprises."],
              ["02", "Shared visibility", "Everyone sees the same round progress."],
              ["03", "Built on Arc", "Fast, transparent USDC settlement."],
            ].map(([number, title, description]) => (
              <div key={number} className="flex gap-4 sm:px-8 first:sm:pl-0 last:sm:pr-0">
                <span className="text-xs font-black tracking-[0.15em] text-[#5A4BDB]">{number}</span>
                <div><p className="text-sm font-bold">{title}</p><p className="mt-1 text-xs leading-5 text-[#6C6885]">{description}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-20 px-4 py-20 sm:px-6 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5A4BDB]">How it works</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.07em] sm:text-5xl">A savings circle that feels clear from day one.</h2>
              <p className="mt-5 text-lg leading-8 text-[#6C6885]">The tradition stays familiar. The coordination gets easier.</p>
            </div>
            <div className="relative mt-14 grid gap-5 md:grid-cols-4">
              <div className="pointer-events-none absolute left-[8%] right-[8%] top-6 hidden h-px bg-[#5A4BDB]/15 md:block" />
              {steps.map(({ number, icon: Icon, title, description }) => (
                <motion.article key={number} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.35, delay: Number(number) * 0.05 }} className="relative rounded-3xl border border-[#1F1B3A]/8 bg-white p-6 shadow-[0_12px_30px_rgba(31,27,58,0.04)]">
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0ECFF] text-[#5A4BDB] ring-8 ring-[#F6F3EC]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.18em] text-[#6C6885]">Step {number}</p>
                  <h3 className="mt-2 text-xl font-bold tracking-[-0.04em]">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#6C6885]">{description}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section id="security" className="scroll-mt-20 bg-white px-4 py-20 sm:px-6 lg:py-28">
          <div className="mx-auto grid max-w-6xl items-end gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5A4BDB]">Why Equb</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.07em] sm:text-5xl">Trust is part of the interface.</h2>
              <p className="mt-5 text-lg leading-8 text-[#6C6885]">Good financial tools reduce uncertainty. Equb makes the important details easy to find before you commit.</p>
              <PrimaryLink href="/create"><span>Start a circle</span><ArrowRight className="h-4 w-4" aria-hidden="true" /></PrimaryLink>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {benefits.map(({ icon: Icon, title, description }) => (
                <article key={title} className="rounded-3xl border border-[#1F1B3A]/8 bg-[#F6F3EC] p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#5A4BDB] shadow-sm"><Icon className="h-5 w-5" aria-hidden="true" /></div>
                  <h3 className="mt-6 text-lg font-bold tracking-[-0.04em]">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#6C6885]">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="scroll-mt-20 px-4 py-20 sm:px-6 lg:py-28">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5A4BDB]">Questions, answered</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.07em] sm:text-5xl">Know before you join.</h2>
            </div>
            <div className="mt-12 space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div key={faq.question} className="overflow-hidden rounded-2xl border border-[#1F1B3A]/8 bg-white">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`faq-answer-${index}`}
                      onClick={() => setOpenFaq(isOpen ? -1 : index)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left text-base font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5A4BDB]/50"
                    >
                      <span>{faq.question}</span>
                      <ChevronDown className={`h-5 w-5 shrink-0 text-[#5A4BDB] transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                    </button>
                    {isOpen ? <p id={`faq-answer-${index}`} className="px-5 pb-5 text-sm leading-6 text-[#6C6885]">{faq.answer}</p> : null}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6 lg:pb-28">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-[#1F1B3A] px-6 py-12 text-center text-white sm:px-12 sm:py-16">
            <div className="mx-auto max-w-2xl">
              <Clock3 className="mx-auto h-8 w-8 text-[#A99EFF]" aria-hidden="true" />
              <h2 className="mt-5 text-4xl font-black tracking-[-0.07em] sm:text-5xl">Your next goal is better with a circle.</h2>
              <p className="mt-5 text-base leading-7 text-white/70">Bring the people you trust and make your first contribution plan in minutes.</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/create" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#5A4BDB] transition hover:bg-[#F0ECFF]">Create an Equb <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
                <Link href="/join" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10">I have an invite</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#1F1B3A]/8 bg-white px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold">Equb</p>
            <p className="mt-1 text-xs text-[#6C6885]">Community savings, made transparent.</p>
          </div>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-3 text-xs font-semibold text-[#6C6885]" aria-label="Footer navigation">
            <Link href="/#how-it-works" className="hover:text-[#1F1B3A]">How it works</Link>
            <Link href="/#security" className="hover:text-[#1F1B3A]">Security</Link>
            <Link href="/#faq" className="hover:text-[#1F1B3A]">FAQ</Link>
            <a href="https://github.com/The-offlines/Equb-Protocol" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-[#1F1B3A]"><GitBranch className="h-3.5 w-3.5" aria-hidden="true" />GitHub</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
