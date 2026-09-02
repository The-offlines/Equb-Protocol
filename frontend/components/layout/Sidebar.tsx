"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const items = [
  { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  { label: "My Equbs", icon: Users, href: "/my-equbs" },
  { label: "Join Equb", icon: UserPlus, href: "/join" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className="fixed left-0 top-16 z-40 flex h-[calc(100vh-4rem)] flex-col border-r border-gray-200 bg-[#F6F3EC]"
      style={{ width: collapsed ? 64 : 224, transition: "width 0.3s ease" }}
    >
      <div className="flex w-full justify-end p-2">
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F6F3EC] text-[#1F1B3A]"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="mt-2 flex flex-col gap-2">
        {items.map(({ label, icon: Icon, href }) => {
          const active = pathname === href;
          const showLabel = !collapsed;

          return (
            <Link
              key={href}
              href={href}
              className={[
                "mx-2 flex items-center gap-3 rounded-xl px-4 py-3 transition-colors",
                active
                  ? "bg-[#5A4BDB] text-white"
                  : "text-[#1F1B3A] hover:bg-[#F6F3EC]",
                collapsed ? "justify-center px-0" : "justify-start",
              ].join(" ")}
              style={{ width: collapsed ? 40 : "auto" }}
            >
              <span className="flex h-5 w-5 items-center justify-center">
                <Icon size={18} />
              </span>

              {showLabel ? (
                <span className="whitespace-nowrap text-sm font-medium">{label}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
