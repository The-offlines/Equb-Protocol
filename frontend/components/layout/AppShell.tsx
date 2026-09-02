"use client";

import type { ReactNode } from "react";

import Sidebar from "@/components/layout/Sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F6F3EC] text-[#1F1B3A]">
      <div className="flex flex-1 pt-16">
        <Sidebar />
        <main className="ml-56 flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}

export default AppShell;
