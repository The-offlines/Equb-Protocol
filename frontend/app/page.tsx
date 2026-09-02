"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  Bell, Users, ArrowRight, ShieldCheck, 
  Wallet, Target, CheckCircle2, ChevronRight, 
  HeartHandshake, Gem, Network, Search, Filter, 
  Clock, ArrowDownRight, ChevronLeft, Calendar, 
  Lock, Globe, DollarSign, QrCode, Link, Copy, Check
} from 'lucide-react';

const FontInjector = () => (
  <style dangerouslySetInnerHTML={{__html: `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Inter+Tight:wght@500;600;700&family=Playfair+Display:ital,wght@1,600&display=swap');
    
    .font-sans-body { font-family: 'Inter', sans-serif; }
    .font-sans-heading { font-family: 'Inter Tight', sans-serif; }
    .font-serif-italic { font-family: 'Playfair Display', serif; font-style: italic; font-weight: 600; }
  `}} />
);

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = {
  children: React.ReactNode;
  variant?: ButtonVariant;
  className?: string;
  icon?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

const Button = ({ children, variant = 'primary', className = '', icon, onClick }: ButtonProps) => {
  const baseStyle = "inline-flex items-center justify-center font-sans-body font-medium transition-all duration-300 rounded-2xl px-6 py-3.5";
  
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-[#5A4BDB] text-white hover:bg-[#4a3bc7] hover:shadow-lg hover:-translate-y-0.5",
    secondary: "bg-white text-[#1F1B3A] border border-black/5 hover:border-black/10 hover:shadow-sm",
    ghost: "text-[#6C6885] hover:text-[#1F1B3A] hover:bg-black/5",
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} onClick={onClick}>
      {children}
      {icon && <span className="ml-2">{icon}</span>}
    </button>
  );
};

type AvatarProps = {
  initials: string;
  bgClass?: string;
  textClass?: string;
  className?: string;
};

const Avatar = ({ initials, bgClass = "bg-slate-100", textClass = "text-slate-600", className = "" }: AvatarProps) => (
  <div className={`flex items-center justify-center rounded-full text-sm font-semibold font-sans-body border-2 border-white w-10 h-10 ${bgClass} ${textClass} ${className}`}>
    {initials}
  </div>
);

const Hero = () => (
  <div className="relative pt-40 pb-32 overflow-hidden">
    <div className="max-w-[1440px] mx-auto px-8 relative z-10">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-black/5 mb-8 shadow-sm">
            <SparklesIcon className="w-4 h-4 text-[#5A4BDB]" />
            <span className="font-sans-body text-sm font-medium text-[#1F1B3A]">Old wisdom, new rails</span>
          </div>
          
          <h1 className="font-sans-heading text-6xl md:text-[5rem] font-bold text-[#1F1B3A] leading-[1.05] tracking-tight mb-8">
            Save together.<br/>
            <span className="font-serif-italic text-[#5A4BDB] font-semibold pr-2">Receive</span> 
            together.
          </h1>
          
          <p className="font-sans-body text-xl text-[#6C6885] leading-relaxed mb-10 max-w-lg">
            Equb brings the time-tested savings circle to transparent, reliable USDC on Arc. No crypto jargon—just a better way to build together.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Button variant="primary" className="w-full sm:w-auto text-lg px-8 py-4" onClick={() => {}}>
              Create a Group
            </Button>
            <Button variant="secondary" className="w-full sm:w-auto text-lg px-8 py-4" onClick={() => {}}>
              Join an Equb
            </Button>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#5A4BDB]/10 rounded-full blur-3xl"></div>
          
          <div className="relative bg-white rounded-[2rem] p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] border border-black/[0.03] transform rotate-1 hover:rotate-0 transition-transform duration-500">
            <div className="flex justify-between items-center mb-8">
              <span className="font-sans-heading text-xs font-bold tracking-widest text-[#6C6885] uppercase">
                This Week&apos;s Pool
              </span>
              <div className="px-3 py-1 bg-green-50 rounded-full flex items-center gap-1.5 border border-green-100">
                <div className="w-1.5 h-1.5 bg-[#3BB273] rounded-full animate-pulse"></div>
                <span className="font-sans-body text-xs font-semibold text-[#3BB273]">Live</span>
              </div>
            </div>

            <div className="mb-10">
              <h2 className="font-sans-heading text-[2.75rem] font-bold text-[#1F1B3A] tracking-tight leading-none">
                2,400 <span className="text-2xl text-[#6C6885] ml-1">USDC</span>
              </h2>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-end">
                <span className="font-sans-body text-sm font-medium text-[#1F1B3A]">Collection Progress</span>
                <span className="font-sans-body text-sm font-medium text-[#6C6885]">10 / 12 paid</span>
              </div>
              <div className="w-full h-3 bg-[#F6F3EC] rounded-full overflow-hidden">
                <div className="w-[83%] h-full bg-[#3BB273] rounded-full transition-all duration-1000 ease-out"></div>
              </div>
            </div>

            <div className="pt-6 border-t border-black/5 flex items-center justify-between">
              <div className="flex -space-x-3">
                <Avatar initials="JD" bgClass="bg-[#F0B54A]/20" textClass="text-[#F0B54A]" />
                <Avatar initials="AM" bgClass="bg-[#5A4BDB]/20" textClass="text-[#5A4BDB]" />
                <Avatar initials="SK" bgClass="bg-[#3BB273]/20" textClass="text-[#3BB273]" />
                <div className="flex items-center justify-center rounded-full text-xs font-semibold font-sans-body border-2 border-white w-10 h-10 bg-[#F6F3EC] text-[#6C6885]">
                  +9
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-sans-body text-xs text-[#6C6885]">Next payout in</span>
                <span className="font-sans-body font-medium text-[#1F1B3A]">2 days</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
);

const HowItWorks = () => (
  <div className="py-24 bg-white border-y border-black/5">
    <div className="max-w-[1440px] mx-auto px-8">
      <div className="max-w-3xl mb-24">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5A4BDB]/5 border border-[#5A4BDB]/10 mb-6 shadow-sm">
          <span className="font-sans-heading text-xs font-bold tracking-widest text-[#5A4BDB] uppercase">What is Equb?</span>
        </div>
        <h2 className="font-sans-heading text-3xl md:text-5xl font-bold text-[#1F1B3A] mb-6 tracking-tight">
          A savings circle, reimagined for the internet.
        </h2>
        <p className="font-sans-body text-[#6C6885] text-lg leading-relaxed">
          Equb is a community savings protocol where trusted members contribute the same amount on a schedule, and one member receives the pooled funds each round. Built on Arc using native USDC, it brings transparency and simplicity to a tradition that has connected communities for generations.
        </p>
      </div>
      
      <div className="relative mt-8">
        <div className="hidden md:block absolute top-6 left-12 right-12 h-[2px] bg-gradient-to-r from-transparent via-black/5 to-transparent"></div>
        
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { icon: <Users className="w-5 h-5"/>, title: "Create a trusted group", desc: "Invite friends, family, or colleagues to a private circle." },
            { icon: <Wallet className="w-5 h-5"/>, title: "Members contribute USDC", desc: "Deposit your fixed share automatically or manually on schedule." },
            { icon: <Target className="w-5 h-5"/>, title: "The pool is completed", desc: "Funds are securely locked in smart contracts until the round completes." },
            { icon: <CheckCircle2 className="w-5 h-5"/>, title: "One member receives the payout", desc: "The entire pool is sent to the week's designated recipient." }
          ].map((step, i) => (
            <div key={i} className="relative group text-center md:text-left">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#5A4BDB] shadow-md border border-black/5 mb-8 relative z-10 mx-auto md:mx-0 group-hover:scale-110 group-hover:bg-[#5A4BDB] group-hover:text-white transition-all duration-300">
                {step.icon}
              </div>
              <div className="p-8 rounded-[2rem] bg-[#F6F3EC]/50 border border-black/5 hover:bg-white hover:shadow-xl hover:shadow-black/5 transition-all duration-300 h-full">
                <div className="font-sans-heading text-xs font-bold text-[#6C6885] mb-3 uppercase tracking-wider">Step 0{i + 1}</div>
                <h3 className="font-sans-heading text-lg font-bold text-[#1F1B3A] mb-3">{step.title}</h3>
                <p className="font-sans-body text-[#6C6885] leading-relaxed text-sm">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const WhyEqub = () => (
  <div className="py-32">
    <div className="max-w-[1440px] mx-auto px-8">
      <div className="text-center max-w-2xl mx-auto mb-20">
        <h2 className="font-sans-heading text-4xl font-bold text-[#1F1B3A] mb-4">Why choose Equb?</h2>
        <p className="font-sans-body text-xl text-[#6C6885]">The principles of traditional community finance, supercharged with modern infrastructure.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {[
          { 
            icon: <ShieldCheck className="w-8 h-8"/>, 
            title: "Transparent Contributions", 
            desc: "Every deposit and payout is visible to the group. No more questioning who has paid their share this week."
          },
          { 
            icon: <Gem className="w-8 h-8"/>, 
            title: "Native USDC Payments", 
            desc: "Save in digital dollars. Avoid local currency inflation and cross-border payment friction entirely."
          },
          { 
            icon: <HeartHandshake className="w-8 h-8"/>, 
            title: "Community Coordination", 
            desc: "Built-in chat, automated reminders, and reputation scoring make managing groups effortless for the Dagna."
          }
        ].map((feature, i) => (
          <div key={i} className="bg-white p-10 rounded-[2rem] shadow-sm border border-black/5 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500">
            <div className="text-[#5A4BDB] mb-6">
              {feature.icon}
            </div>
            <h3 className="font-sans-heading text-2xl font-bold text-[#1F1B3A] mb-4">{feature.title}</h3>
            <p className="font-sans-body text-[#6C6885] leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const FAQ = () => (
  <div className="py-24 bg-[#F6F3EC]">
    <div className="max-w-3xl mx-auto px-8">
      <div className="text-center mb-16">
        <h2 className="font-sans-heading text-3xl md:text-4xl font-bold text-[#1F1B3A] mb-4">Frequently Asked Questions</h2>
      </div>
      <div className="space-y-4">
        {[
          { q: "Is my USDC safe?", a: "Yes. Funds are securely locked in audited smart contracts on Arc network, and can only be distributed according to the group's predefined schedule and rules." },
          { q: "What happens if a member defaults on payment?", a: "Equb utilizes an on-chain reputation scoring system and optional collateral. Members who default lose their staked collateral and face severe reputation penalties, protecting the rest of the circle." },
          { q: "How is the weekly recipient chosen?", a: "The Dagna (group manager) can choose to set a fixed schedule based on member agreement, or utilize an automated smart contract lottery system that transparently selects the winner." }
        ].map((faq, i) => (
           <div key={i} className="bg-white p-8 rounded-[2rem] border border-black/5 hover:border-[#5A4BDB]/20 hover:shadow-xl hover:shadow-[#5A4BDB]/5 transition-all duration-300">
             <h4 className="font-sans-heading font-bold text-[#1F1B3A] text-lg mb-3 flex items-start gap-3">
               <div className="mt-1"><Target className="w-4 h-4 text-[#5A4BDB]"/></div>
               {faq.q}
             </h4>
             <p className="font-sans-body text-[#6C6885] leading-relaxed pl-7">{faq.a}</p>
           </div>
        ))}
      </div>
    </div>
  </div>
);

const CTA = () => (
  <div className="py-32 bg-white border-y border-black/5">
    <div className="max-w-3xl mx-auto px-8 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#5A4BDB]/10 text-[#5A4BDB] mb-8">
        <Network className="w-8 h-8" />
      </div>
      <h2 className="font-sans-heading text-5xl font-bold text-[#1F1B3A] mb-8 tracking-tight">
        Build your first Equb today.
      </h2>
      <Button variant="primary" className="text-lg px-10 py-4 shadow-lg shadow-[#5A4BDB]/20" onClick={() => {}}>
        Create Equb
      </Button>
    </div>
  </div>
);

const Footer = () => (
  <footer className="bg-[#F6F3EC] py-12 border-t border-black/5">
    <div className="max-w-[1440px] mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="flex items-center gap-3">
        <Image src="/logo.png" width={40} height={40} alt="Equb" className="object-contain" />
        <span className="font-sans-body font-medium text-[#1F1B3A]">Built on Arc Network</span>
      </div>
      
      <div className="flex items-center gap-8 font-sans-body text-sm font-medium text-[#6C6885]">
        <a href="#" className="hover:text-[#1F1B3A] transition-colors">Terms</a>
        <a href="#" className="hover:text-[#1F1B3A] transition-colors">Privacy</a>
        <a href="#" className="hover:text-[#1F1B3A] transition-colors">GitHub</a>
        <a href="#" className="hover:text-[#1F1B3A] transition-colors">X</a>
      </div>
    </div>
  </footer>
);

const JoinEqubPage = () => {
  const [inviteCode, setInviteCode] = useState("");
  
  return (
    <div className="pt-32 pb-24 min-h-screen flex items-center justify-center">
      <div className="max-w-xl w-full mx-auto px-8">
         <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#5A4BDB]/10 text-[#5A4BDB] mb-6">
              <Link className="w-8 h-8" />
            </div>
            <h1 className="font-sans-heading text-4xl font-bold text-[#1F1B3A] mb-4">Join an Equb</h1>
            <p className="font-sans-body text-[#6C6885] text-lg">Enter an invite code or paste a link from your Dagna to join your trusted circle.</p>
         </div>

         <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-black/5 border border-black/5">
            <div className="mb-8">
               <label className="block font-sans-body font-medium text-[#1F1B3A] mb-3">Invite Link or Code</label>
               <div className="relative">
                 <Link className="w-6 h-6 absolute left-5 top-1/2 -translate-y-1/2 text-[#6C6885]" />
                 <input 
                   type="text" 
                   placeholder="e.g. equb.fi/join/abc123xyz" 
                   className="w-full pl-14 pr-5 py-4 bg-[#F6F3EC]/50 border border-black/5 rounded-2xl font-sans-body text-lg focus:outline-none focus:ring-2 focus:ring-[#5A4BDB]/20 focus:bg-white transition-all"
                   value={inviteCode}
                   onChange={(e) => setInviteCode(e.target.value)}
                 />
               </div>
            </div>

            {/* Mock Group Preview (Shows up when user types something) */}
            {inviteCode.length > 4 && (
               <div className="mb-8 p-6 bg-[#F6F3EC]/50 rounded-2xl border border-black/5 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <span className="font-sans-heading text-xs font-bold tracking-widest text-[#6C6885] uppercase mb-4 block">
                    Group Preview
                  </span>
                  <div className="flex items-center gap-4 mb-6">
                     <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center font-sans-heading font-bold text-xl text-[#5A4BDB]">
                       A
                     </div>
                     <div>
                       <h3 className="font-sans-heading font-bold text-lg text-[#1F1B3A]">Addis Tech Founders</h3>
                       <p className="font-sans-body text-sm text-[#6C6885]">Invited by Dagna (0x4A...2F)</p>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-white p-4 rounded-xl border border-black/5">
                        <span className="block font-sans-body text-xs text-[#6C6885] mb-1">Contribution</span>
                        <span className="block font-sans-heading font-bold text-[#1F1B3A]">500 USDC / Wk</span>
                     </div>
                     <div className="bg-white p-4 rounded-xl border border-black/5">
                        <span className="block font-sans-body text-xs text-[#6C6885] mb-1">Members</span>
                        <span className="block font-sans-heading font-bold text-[#1F1B3A]">8 / 12</span>
                     </div>
                  </div>
               </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
               <Button variant="primary" className="flex-1 py-4 text-lg" icon={<Wallet className="w-5 h-5"/>} onClick={() => {}}>
                 Join with Wallet
               </Button>
               <Button variant="secondary" className="px-6 py-4" icon={<QrCode className="w-5 h-5"/>}>
                 Scan QR
               </Button>
            </div>
         </div>
      </div>
    </div>
  );
}

const MyEqubsPage = () => {
  return (
    <div className="pt-32 pb-24 min-h-screen">
      <div className="max-w-[1440px] mx-auto px-8">
        <h1 className="font-sans-heading text-3xl font-bold text-[#1F1B3A] mb-8">My Dashboard</h1>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: "Total Saved", value: "8,500", suffix: "USDC", icon: <Wallet className="w-5 h-5"/>, color: "text-[#5A4BDB]", bg: "bg-[#5A4BDB]/10" },
            { label: "Total Received", value: "4,000", suffix: "USDC", icon: <ArrowDownRight className="w-5 h-5"/>, color: "text-[#3BB273]", bg: "bg-[#3BB273]/10" },
            { label: "Active Equbs", value: "3", suffix: "", icon: <Network className="w-5 h-5"/>, color: "text-[#1F1B3A]", bg: "bg-black/5" },
            { label: "Next Contribution", value: "In 2 days", suffix: "", icon: <Clock className="w-5 h-5"/>, color: "text-[#F0B54A]", bg: "bg-[#F0B54A]/20" }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${stat.bg} ${stat.color}`}>
                {stat.icon}
              </div>
              <div className="font-sans-body text-sm font-medium text-[#6C6885] mb-2">{stat.label}</div>
              <div className="font-sans-heading text-3xl font-bold text-[#1F1B3A] tracking-tight">
                {stat.value} {stat.suffix && <span className="text-base text-[#6C6885] font-normal tracking-normal">{stat.suffix}</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            
            {/* Pending Invitations */}
            <div className="bg-[#5A4BDB]/5 rounded-[2rem] p-8 border border-[#5A4BDB]/10 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#5A4BDB]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
               <h2 className="font-sans-heading text-xl font-bold text-[#5A4BDB] mb-6 flex items-center gap-2">
                 <Bell className="w-5 h-5"/> Pending Invitations (1)
               </h2>
               
               <div className="bg-white p-6 rounded-[1.5rem] border border-black/5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                 <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-[#F6F3EC] rounded-2xl flex items-center justify-center font-sans-heading font-bold text-xl text-[#5A4BDB]">
                       D
                    </div>
                    <div>
                       <h4 className="font-sans-heading text-lg font-bold text-[#1F1B3A] mb-1">Design Vanguard</h4>
                       <div className="flex items-center gap-2 font-sans-body text-sm text-[#6C6885]">
                         <span className="font-medium text-[#1F1B3A]">50 USDC</span>
                         <span>• Monthly • 15/20 Members</span>
                       </div>
                    </div>
                 </div>
                 <div className="flex gap-3 w-full sm:w-auto">
                    <Button variant="ghost" className="flex-1 sm:flex-none py-2.5 px-6 bg-black/5 hover:bg-black/10">Decline</Button>
                    <Button variant="primary" className="flex-1 sm:flex-none py-2.5 px-6">Accept</Button>
                 </div>
               </div>
            </div>

            <div className="bg-white rounded-[2rem] p-8 border border-black/5 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h2 className="font-sans-heading text-2xl font-bold text-[#1F1B3A]">Upcoming Contributions</h2>
                <Button variant="ghost" className="text-sm py-2 px-4">View All</Button>
              </div>
              <div className="space-y-4">
                {[
                  { name: "Addis Tech Founders", amount: 500, date: "Tomorrow, 10:00 AM", status: "pending" },
                  { name: "Family Savings", amount: 250, date: "Oct 15, 2026", status: "scheduled" }
                ].map((payment, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-[#F6F3EC]/50 border border-black/5 hover:bg-white transition-colors gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center font-sans-heading font-bold text-xl text-[#5A4BDB]">
                        {payment.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-sans-heading text-lg font-bold text-[#1F1B3A]">{payment.name}</h4>
                        <p className="font-sans-body text-sm text-[#6C6885] mt-1">{payment.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0">
                      <span className="font-sans-heading text-xl font-bold text-[#1F1B3A]">{payment.amount} USDC</span>
                      <Button variant={payment.status === 'pending' ? 'primary' : 'secondary'} className="py-2.5 px-6 text-sm">
                        {payment.status === 'pending' ? 'Pay Now' : 'Manage'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-8 border border-black/5 shadow-sm">
               <h2 className="font-sans-heading text-2xl font-bold text-[#1F1B3A] mb-8">My Groups</h2>
               <div className="grid sm:grid-cols-2 gap-5">
                  {[
                    { name: "Addis Tech Founders", role: "Member", pool: 4000 },
                    { name: "Creative Studio", role: "Dagna", pool: 1200 },
                    { name: "Family Savings", role: "Member", pool: 2000 }
                  ].map((group, i) => (
                     <div key={i} className="p-6 rounded-[1.5rem] border border-black/5 hover:border-black/10 hover:bg-[#F6F3EC]/20 transition-colors cursor-pointer group">
                       <div className="flex justify-between items-start mb-6">
                          <div>
                            <h4 className="font-sans-heading text-lg font-bold text-[#1F1B3A]">{group.name}</h4>
                            <span className="inline-block mt-1 font-sans-body text-sm text-[#6C6885] bg-black/5 px-2 py-0.5 rounded-md">{group.role}</span>
                          </div>
                          <div className="px-2.5 py-1 bg-green-50 rounded-lg border border-green-100">
                            <span className="font-sans-body text-[10px] font-bold text-[#3BB273] uppercase tracking-wider">Active</span>
                          </div>
                       </div>
                       <div className="flex justify-between items-end mt-8">
                          <div>
                            <span className="block font-sans-body text-xs text-[#6C6885] mb-1">Total Pool</span>
                            <span className="block font-sans-heading text-xl font-bold text-[#1F1B3A]">{group.pool} USDC</span>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center group-hover:bg-[#5A4BDB] group-hover:text-white transition-colors text-[#1F1B3A]">
                            <ChevronRight className="w-4 h-4"/>
                          </div>
                       </div>
                     </div>
                  ))}
               </div>
            </div>
          </div>

          <div className="space-y-8">
             <div className="bg-[#1F1B3A] rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden group">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#5A4BDB] rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity duration-700"></div>
                <h2 className="font-sans-heading text-xl font-bold mb-8 relative z-10 text-[#F6F3EC]">Current Round Winner</h2>
                
                <div className="flex items-center gap-5 mb-8 relative z-10">
                   <Avatar initials="JD" bgClass="bg-[#F0B54A]" textClass="text-[#1F1B3A]" className="w-16 h-16 text-xl border-[#1F1B3A] border-4 shadow-xl" />
                   <div>
                     <h4 className="font-sans-heading text-xl font-bold">John Doe</h4>
                     <p className="font-sans-body text-[15px] text-[#6C6885]">Addis Tech Founders</p>
                   </div>
                </div>
                
                <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-md relative z-10 border border-white/10">
                  <span className="block font-sans-body text-sm text-[#F6F3EC]/80 mb-2">Payout Amount</span>
                  <span className="block font-sans-heading text-4xl font-bold text-white tracking-tight mb-4">4,000 <span className="text-xl text-[#6C6885] font-normal">USDC</span></span>
                  <div className="flex items-center gap-2 text-sm font-medium text-[#3BB273] bg-[#3BB273]/10 px-3 py-1.5 rounded-lg w-fit border border-[#3BB273]/20">
                    <CheckCircle2 className="w-4 h-4"/>
                    <span>Transferred securely</span>
                  </div>
                </div>
             </div>

             <div className="bg-white rounded-[2rem] p-8 border border-black/5 shadow-sm">
               <h2 className="font-sans-heading text-xl font-bold text-[#1F1B3A] mb-8">Contribution History</h2>
               <div className="space-y-6">
                 {[
                   { title: "You paid 500 USDC", desc: "Addis Tech Founders", time: "2 hours ago", icon: <Wallet className="w-4 h-4"/>, color: "text-[#5A4BDB]", bg: "bg-[#5A4BDB]/10" },
                   { title: "Round completed", desc: "Family Savings", time: "Yesterday", icon: <CheckCircle2 className="w-4 h-4"/>, color: "text-[#3BB273]", bg: "bg-[#3BB273]/10" },
                   { title: "New member joined", desc: "Creative Studio", time: "2 days ago", icon: <Users className="w-4 h-4"/>, color: "text-[#F0B54A]", bg: "bg-[#F0B54A]/20" }
                 ].map((act, i) => (
                   <div key={i} className="flex gap-4">
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${act.bg} ${act.color}`}>
                       {act.icon}
                     </div>
                     <div>
                       <h4 className="font-sans-heading font-bold text-[#1F1B3A]">{act.title}</h4>
                       <div className="flex gap-2 items-center mt-1">
                         <span className="font-sans-body text-xs font-medium text-[#6C6885]">{act.desc}</span>
                         <span className="w-1 h-1 bg-[#6C6885]/30 rounded-full"></span>
                         <span className="font-sans-body text-xs text-[#6C6885]">{act.time}</span>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const CreateEqubPage = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "", desc: "", frequency: "Weekly", amount: "500", members: "10", date: ""
  });
  const [copied, setCopied] = useState(false);

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));
  
  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="pt-32 pb-24 min-h-screen bg-white">
      <div className="max-w-[1200px] mx-auto px-8">
        
        <div className="flex gap-12 lg:gap-24">
          <div className="flex-1 max-w-2xl">
            <button 
              onClick={() => prevStep()} 
              className="flex items-center gap-2 text-[#6C6885] hover:text-[#1F1B3A] transition-colors mb-8 font-sans-body font-medium"
            >
              <ChevronLeft className="w-4 h-4"/>
              {step === 1 ? 'Cancel' : 'Back'}
            </button>
            
            <div className="mb-12">
              <span className="font-sans-heading text-sm font-bold text-[#5A4BDB] tracking-widest uppercase mb-3 block">Step 0{step} of 04</span>
              <h1 className="font-sans-heading text-4xl font-bold text-[#1F1B3A] mb-4">
                {step === 1 && "What's the goal?"}
                {step === 2 && "Set the rules."}
                {step === 3 && "Invite Members."}
                {step === 4 && "Review & Deploy."}
              </h1>
            </div>

            <div className="space-y-8 min-h-[420px]">
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div>
                    <label className="block font-sans-body font-medium text-[#1F1B3A] mb-2">Group Name</label>
                    <input type="text" placeholder="e.g. Dream House Fund" className="w-full px-5 py-4 bg-[#F6F3EC]/50 border border-black/5 rounded-2xl font-sans-body text-lg focus:outline-none focus:ring-2 focus:ring-[#5A4BDB]/20 focus:bg-white transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block font-sans-body font-medium text-[#1F1B3A] mb-2">Description (Optional)</label>
                    <textarea placeholder="What are we saving for?" rows={4} className="w-full px-5 py-4 bg-[#F6F3EC]/50 border border-black/5 rounded-2xl font-sans-body focus:outline-none focus:ring-2 focus:ring-[#5A4BDB]/20 focus:bg-white transition-all resize-none" value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div>
                    <label className="block font-sans-body font-medium text-[#1F1B3A] mb-3">Frequency</label>
                    <div className="grid grid-cols-2 gap-4">
                      {['Weekly', 'Monthly'].map(f => (
                        <button key={f} onClick={() => setFormData({...formData, frequency: f})} className={`py-4 rounded-2xl font-sans-body font-bold text-lg transition-all border ${formData.frequency === f ? 'bg-[#5A4BDB]/5 border-[#5A4BDB] text-[#5A4BDB]' : 'bg-[#F6F3EC]/50 border-transparent text-[#6C6885] hover:bg-black/5'}`}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block font-sans-body font-medium text-[#1F1B3A] mb-2">Contribution Amount (USDC)</label>
                    <div className="relative">
                      <DollarSign className="w-6 h-6 absolute left-5 top-1/2 -translate-y-1/2 text-[#6C6885]" />
                      <input type="number" placeholder="500" className="w-full pl-14 pr-5 py-4 bg-[#F6F3EC]/50 border border-black/5 rounded-2xl font-sans-body text-lg focus:outline-none focus:ring-2 focus:ring-[#5A4BDB]/20 focus:bg-white transition-all" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="block font-sans-body font-medium text-[#1F1B3A] mb-2">Max Members (3 - 50)</label>
                    <input type="number" placeholder="12" className="w-full px-5 py-4 bg-[#F6F3EC]/50 border border-black/5 rounded-2xl font-sans-body text-lg focus:outline-none focus:ring-2 focus:ring-[#5A4BDB]/20 focus:bg-white transition-all" value={formData.members} onChange={e => setFormData({...formData, members: e.target.value})} />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div>
                    <label className="block font-sans-body font-medium text-[#1F1B3A] mb-2">Invite via Wallet Address</label>
                    <div className="flex gap-3">
                      <input type="text" placeholder="Wallet address or ENS" className="w-full px-5 py-4 bg-[#F6F3EC]/50 border border-black/5 rounded-2xl font-sans-body text-lg focus:outline-none focus:ring-2 focus:ring-[#5A4BDB]/20 focus:bg-white transition-all" />
                      <Button variant="secondary" className="px-8 shrink-0">Add Member</Button>
                    </div>
                  </div>

                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-black/10"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white px-4 text-xs font-sans-heading font-bold tracking-widest text-[#6C6885] uppercase">OR SHARE LINK</span>
                    </div>
                  </div>

                  <div>
                     <label className="block font-sans-body font-medium text-[#1F1B3A] mb-3">Invite Link</label>
                     <div className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-[#F6F3EC]/50 border border-black/5 rounded-2xl">
                        <div className="hidden sm:flex w-12 h-12 bg-white rounded-xl shadow-sm items-center justify-center text-[#5A4BDB] shrink-0">
                          <QrCode className="w-6 h-6" />
                        </div>
                        <div className="flex-1 w-full overflow-hidden px-2 text-center sm:text-left">
                           <p className="font-sans-body text-sm font-bold text-[#1F1B3A] truncate select-all">equb.fi/join/0x4a9...8f2</p>
                           <p className="font-sans-body text-xs text-[#6C6885]">Anyone with this link can request to join</p>
                        </div>
                        <Button 
                          variant="secondary" 
                          className="w-full sm:w-auto px-6 py-2.5 text-sm bg-white" 
                          icon={copied ? <Check className="w-4 h-4 text-[#3BB273]" /> : <Copy className="w-4 h-4"/>}
                          onClick={handleCopy}
                        >
                          {copied ? 'Copied' : 'Copy'}
                        </Button>
                     </div>
                  </div>

                  <div>
                    <label className="block font-sans-body font-medium text-[#1F1B3A] mb-2">Start Date</label>
                    <div className="relative">
                      <Calendar className="w-6 h-6 absolute left-5 top-1/2 -translate-y-1/2 text-[#6C6885]" />
                      <input type="date" className="w-full pl-14 pr-5 py-4 bg-[#F6F3EC]/50 border border-black/5 rounded-2xl font-sans-body text-lg focus:outline-none focus:ring-2 focus:ring-[#5A4BDB]/20 focus:bg-white transition-all" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="bg-[#F6F3EC]/50 rounded-[2rem] p-8 border border-black/5 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-6 border-b border-black/5 pb-8">
                     <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center font-sans-heading font-bold text-3xl text-[#5A4BDB]">
                       {formData.name.charAt(0) || 'E'}
                     </div>
                     <div>
                       <h3 className="font-sans-heading font-bold text-2xl text-[#1F1B3A] mb-1">{formData.name || 'Unnamed Equb'}</h3>
                       <p className="font-sans-body text-[#6C6885] bg-white px-3 py-1 rounded-full border border-black/5 inline-flex items-center gap-2">
                         <Lock className="w-3 h-3"/>
                         Private Group
                       </p>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-y-8 gap-x-4">
                    <div>
                      <span className="block font-sans-body text-sm font-medium text-[#6C6885] mb-1">Contribution</span>
                      <span className="block font-sans-heading text-xl font-bold text-[#1F1B3A]">{formData.amount} USDC</span>
                    </div>
                    <div>
                      <span className="block font-sans-body text-sm font-medium text-[#6C6885] mb-1">Frequency</span>
                      <span className="block font-sans-heading text-xl font-bold text-[#1F1B3A]">{formData.frequency}</span>
                    </div>
                    <div>
                      <span className="block font-sans-body text-sm font-medium text-[#6C6885] mb-1">Max Members</span>
                      <span className="block font-sans-heading text-xl font-bold text-[#1F1B3A]">{formData.members}</span>
                    </div>
                    <div>
                      <span className="block font-sans-body text-sm font-medium text-[#6C6885] mb-1">Estimated Pool Size</span>
                      <span className="block font-sans-heading text-xl font-bold text-[#3BB273]">{(Number(formData.amount || 0) * Number(formData.members || 0)).toLocaleString()} USDC</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-8 flex justify-between items-center border-t border-black/5 mt-8">
              <div className="flex gap-3">
                {[1,2,3,4].map(s => (
                  <div key={s} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${step >= s ? 'bg-[#5A4BDB]' : 'bg-black/10'}`}></div>
                ))}
              </div>
              <Button variant="primary" className="px-10 py-4 text-lg" onClick={() => nextStep()}>
                {step === 4 ? 'Deploy Equb' : 'Continue'}
              </Button>
            </div>
          </div>

          <div className="hidden lg:block flex-1 pt-4">
             <div className="bg-[#F6F3EC] rounded-[3rem] p-12 h-full flex flex-col justify-center items-center sticky top-32 min-h-[600px] border border-black/5">
               <div className="w-full max-w-sm bg-white rounded-[2rem] p-8 shadow-2xl shadow-indigo-900/5 border border-black/5 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                 <div className="flex justify-between items-center mb-8">
                   <span className="font-sans-heading text-xs font-bold tracking-widest text-[#6C6885] uppercase">
                     Preview
                   </span>
                   <div className="px-3 py-1 bg-[#5A4BDB]/5 rounded-full border border-[#5A4BDB]/10">
                     <span className="font-sans-body text-xs font-semibold text-[#5A4BDB]">{formData.frequency}</span>
                   </div>
                 </div>
                 <div className="mb-8">
                   <h4 className="font-sans-heading text-xl font-bold text-[#1F1B3A] mb-2 truncate" title={formData.name}>{formData.name || 'Your Equb Name'}</h4>
                   <h2 className="font-sans-heading text-[2.5rem] leading-none font-bold text-[#1F1B3A] tracking-tight">
                     {formData.amount || '0'} <span className="text-xl text-[#6C6885] tracking-normal">USDC</span>
                   </h2>
                 </div>
                 <div className="space-y-4 mb-8">
                   <div className="flex justify-between font-sans-body text-sm pb-4 border-b border-black/5">
                     <span className="text-[#6C6885] font-medium">Pool Value</span>
                     <span className="font-bold text-[#1F1B3A]">{(Number(formData.amount || 0) * Number(formData.members || 0)).toLocaleString()} USDC</span>
                   </div>
                   <div className="flex justify-between font-sans-body text-sm">
                     <span className="text-[#6C6885] font-medium">Members</span>
                     <span className="font-bold text-[#1F1B3A]">0 / {formData.members || '0'}</span>
                   </div>
                 </div>
                 <Button variant="secondary" className="w-full py-4 text-[#6C6885] cursor-default bg-[#F6F3EC]/50 hover:bg-[#F6F3EC]/50 border-dashed border-2">
                    Waiting for members...
                 </Button>
               </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function App() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (pathname !== '/') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F6F3EC] selection:bg-[#5A4BDB]/20 selection:text-[#5A4BDB]">
      <FontInjector />
      <main className="animate-in fade-in duration-700">
        <Hero />
        <HowItWorks />
        <WhyEqub />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
    </svg>
  );
}