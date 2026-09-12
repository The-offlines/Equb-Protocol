"use client";

import type { ReactNode } from "react";

import Sidebar from "@/components/layout/Sidebar";
import { useNavigation } from "@/components/layout/NavigationProvider";

export function AppShell({ children }: { children: ReactNode }) {
  const { mobileMenuOpen, closeMobileMenu } = useNavigation();

  return (
    <div className="flex min-h-screen flex-col bg-[#F6F3EC] text-[#1F1B3A]">
      <div className="flex flex-1 pt-16">
        <Sidebar
          mobileMenuOpen={mobileMenuOpen}
          onNavigate={closeMobileMenu}
        />
        {mobileMenuOpen ? (
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={closeMobileMenu}
            className="fixed inset-0 top-16 z-30 bg-[#1F1B3A]/35 md:hidden"
          />
        ) : null}
        <main className="min-w-0 flex-1 overflow-auto p-4 sm:p-6 md:ml-56">{children}</main>
      </div>
    </div>
  );
}

export default AppShell;
