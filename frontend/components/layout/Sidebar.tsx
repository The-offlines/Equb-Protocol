"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Settings,
} from "lucide-react";

const items = [
  { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  { label: "My Equbs", icon: Users, href: "/my-equbs" },
  { label: "Join Equb", icon: UserPlus, href: "/join" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

type SidebarProps = {
  mobileMenuOpen?: boolean;
  onNavigate?: () => void;
};

export default function Sidebar({ mobileMenuOpen = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      id="dashboard-navigation"
      aria-label="Dashboard navigation"
      className={`fixed left-0 top-16 z-40 flex h-[calc(100vh-4rem)] w-56 flex-col border-r border-[#1F1B3A]/10 bg-[#F6F3EC] px-3 py-4 transition-transform duration-200 md:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      <div className="mb-5 px-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6C6885]">Workspace</p>
        <p className="mt-1 text-xs text-[#9A96AA]">Manage your savings circles</p>
      </div>

      <nav className="flex flex-col gap-1.5">
        {items.map(({ label, icon: Icon, href }) => {
          const active = pathname === href || (href === "/dashboard" && pathname === "/");

          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={[
                "flex items-center gap-3 rounded-xl px-3 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A4BDB]/50",
                active
                  ? "bg-[#5A4BDB] text-white shadow-[0_8px_18px_rgba(90,75,219,0.18)]"
                  : "text-[#1F1B3A] hover:bg-white hover:text-[#5A4BDB]",
              ].join(" ")}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                <Icon size={18} aria-hidden="true" />
              </span>
              <span className="whitespace-nowrap text-sm font-semibold">{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
