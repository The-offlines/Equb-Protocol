"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check, LockKeyhole, Plus, Users } from "lucide-react";
import { useState } from "react";

import Link from "next/link";

const demoMembers = ["You", "Mekdes", "Dawit", "Liya"];

export function LiveEqubDemo() {
  const [name, setName] = useState("Weekend builders");
  const [amount, setAmount] = useState("120");
  const [members, setMembers] = useState(6);
  const [started, setStarted] = useState(false);

  const numericAmount = Math.max(Number(amount) || 0, 0);
  const pool = numericAmount * members;

  return (
    <section id="live-demo" className="relative scroll-mt-24 overflow-hidden bg-[#1F1B3A] px-4 py-20 text-white sm:px-6 lg:py-28">
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#5A4BDB]/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#F0B54A]/20 blur-3xl" />
      <div className="relative mx-auto grid max-w-6xl items-start gap-12 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A99EFF]">Try the rhythm</p>
          <h2 className="mt-4 text-4xl font-black leading-tight tracking-normal sm:text-5xl">Shape a private circle before you launch it.</h2>
          <p className="mt-5 text-base leading-7 text-white/70 sm:text-lg">
            Adjust the numbers, see the pool change, and take the plan into the real on-chain creation flow when it feels right.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-xs font-semibold text-white/70">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-2"><LockKeyhole className="h-3.5 w-3.5 text-[#A99EFF]" />Invite-only by design</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-2"><Check className="h-3.5 w-3.5 text-[#65D49A]" />USDC on Arc</span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="rounded-[2rem] border border-white/12 bg-white p-5 text-[#1F1B3A] shadow-[0_24px_70px_rgba(0,0,0,0.24)] sm:p-7"
        >
          <div className="flex items-start justify-between gap-4 border-b border-[#1F1B3A]/10 pb-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6C6885]">Live preview</p>
              <h3 className="mt-2 text-2xl font-black tracking-normal">{name || "Your private Equb"}</h3>
            </div>
            <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${started ? "bg-[#EAF8F1] text-[#1F8A4D]" : "bg-[#F0ECFF] text-[#5A4BDB]"}`}>
              {started ? "Plan ready" : "Draft"}
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-bold">
              Circle name
              <input value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-2xl border border-[#1F1B3A]/10 bg-[#F8F7F5] px-4 py-3 font-medium outline-none transition focus:border-[#5A4BDB] focus:bg-white" />
            </label>
            <label className="space-y-2 text-sm font-bold">
              Weekly contribution
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6C6885]">$</span>
                <input type="number" min="1" value={amount} onChange={(event) => setAmount(event.target.value)} className="w-full rounded-2xl border border-[#1F1B3A]/10 bg-[#F8F7F5] px-9 py-3 font-medium outline-none transition focus:border-[#5A4BDB] focus:bg-white" />
              </div>
            </label>
          </div>

          <div className="mt-6 rounded-2xl bg-[#F8F7F5] p-4">
            <div className="flex items-center justify-between gap-4 text-sm font-bold">
              <span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-[#5A4BDB]" />Members</span>
              <span className="text-[#5A4BDB]">{members} people</span>
            </div>
            <input aria-label="Number of members" type="range" min="3" max="12" value={members} onChange={(event) => setMembers(Number(event.target.value))} className="mt-4 w-full accent-[#5A4BDB]" />
            <div className="mt-3 flex justify-between text-xs text-[#6C6885]"><span>3 minimum</span><span>12 maximum</span></div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="rounded-2xl bg-[#F0ECFF] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6C6885]">Projected first pool</p>
              <p className="mt-2 text-3xl font-black tracking-normal">{pool.toLocaleString()} <span className="text-sm font-bold text-[#6C6885]">USDC</span></p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {demoMembers.slice(0, Math.min(members, demoMembers.length)).map((member) => <span key={member} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#5A4BDB]">{member}</span>)}
                {members > demoMembers.length ? <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#6C6885]">+{members - demoMembers.length}</span> : null}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:min-w-44">
              <button type="button" onClick={() => setStarted(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#5A4BDB] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#493BC5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A4BDB]/50">
                <Plus className="h-4 w-4" /> {started ? "Plan updated" : "Build preview"}
              </button>
              <Link href={`/create?name=${encodeURIComponent(name)}&amount=${encodeURIComponent(amount)}&members=${members}`} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#1F1B3A]/12 px-4 py-3 text-sm font-bold text-[#1F1B3A] transition hover:border-[#5A4BDB]/30 hover:text-[#5A4BDB]">
                Continue for real <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
