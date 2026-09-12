"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Bell, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import Logo from "@/components/shared/Logo";
import { WalletButton } from "@/components/shared/WalletButton";
import { useNavigation } from "@/components/layout/NavigationProvider";
import { cn } from "@/lib/utils";

type NavbarProps = {
  mobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
};

const navItems = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "My Equbs", href: "/my-equbs" },
];

export function Navbar({
  mobileMenuOpen: mobileMenuOpenProp,
  onToggleMobileMenu,
}: NavbarProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const navigation = useNavigation();
  const mobileMenuOpen = mobileMenuOpenProp ?? navigation.mobileMenuOpen;
  const toggleMobileMenu = onToggleMobileMenu ?? navigation.toggleMobileMenu;
  const hasSidebar = pathname !== "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={false}
      animate={{
        backgroundColor: scrolled ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0)",
        boxShadow: scrolled ? "0 10px 30px rgba(31,27,58,0.08)" : "0 0 0 rgba(0,0,0,0)",
      }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="fixed left-0 right-0 top-0 z-50 h-16 border-b border-transparent bg-[#F6F3EC]/90 backdrop-blur-sm"
    >
      <div className="w-full px-6 py-3 h-full">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#1F1B3A]/10 bg-white/60 text-[#1F1B3A] shadow-sm md:hidden"
              onClick={toggleMobileMenu}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls={hasSidebar ? "dashboard-navigation" : "mobile-navigation"}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

            <Link href="/" className="inline-flex" aria-label="Go to homepage" onClick={navigation.closeMobileMenu}>
              <Logo />
            </Link>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href === "/#how-it-works" && pathname === "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-2 py-1 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A4BDB]/50",
                    isActive
                      ? "text-[#1F1B3A]"
                      : "text-[#6C6885] hover:text-[#1F1B3A]",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#1F1B3A]/10 bg-white/70 text-[#1F1B3A] shadow-sm transition-colors duration-200 hover:border-[#5A4BDB]/30 hover:text-[#5A4BDB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A4BDB]/50"
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((open) => !open)}
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
              </button>
              {notificationsOpen ? (
                <div className="absolute right-0 top-12 z-50 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-[#1F1B3A]/10 bg-white p-4 text-left shadow-[0_18px_45px_rgba(31,27,58,0.14)]" role="status">
                  <p className="text-sm font-bold text-[#1F1B3A]">Notifications</p>
                  <p className="mt-1 text-xs leading-5 text-[#6C6885]">You&apos;re all caught up. New contribution updates will appear here.</p>
                  <Link
                    href="/my-equbs"
                    onClick={() => setNotificationsOpen(false)}
                    className="mt-4 block rounded-xl bg-[#F6F3EC] px-3 py-2 text-xs font-semibold text-[#5A4BDB] hover:bg-[#F0ECFF]"
                  >
                    View contribution activity
                  </Link>
                </div>
              ) : null}
            </div>

            <WalletButton />

            <Link href="/create" className="hidden sm:inline-flex">
              <span className="inline-flex items-center justify-center rounded-2xl bg-[#5A4BDB] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(90,75,219,0.22)] transition-colors hover:bg-[#4d3fd1]">
                Create Equb
              </span>
            </Link>
          </div>
        </div>
      </div>
      {!hasSidebar && mobileMenuOpen ? (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="border-t border-[#1F1B3A]/10 bg-white px-6 py-4 shadow-lg md:hidden"
        >
          <div className="flex flex-col gap-1">
            {[
              ["How it works", "/#how-it-works"],
              ["My Equbs", "/my-equbs"],
              ["Join Equb", "/join"],
              ["Settings", "/settings"],
              ["Create Equb", "/create"],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                onClick={navigation.closeMobileMenu}
                className="rounded-xl px-3 py-3 text-sm font-semibold text-[#1F1B3A] hover:bg-[#F6F3EC] hover:text-[#5A4BDB]"
              >
                {label}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </motion.header>
  );
}

export default Navbar;
