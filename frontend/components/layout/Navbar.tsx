"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Bell, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import Logo from "@/components/shared/Logo";
import { WalletButton } from "@/components/shared/WalletButton";
import { cn } from "@/lib/utils";

type NavbarProps = {
  mobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
};

const navItems = [
  { label: "How it works", href: "/" },
  { label: "My Equbs", href: "/my-equbs" },
];

export function Navbar({
  mobileMenuOpen = false,
  onToggleMobileMenu,
}: NavbarProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

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
              onClick={onToggleMobileMenu}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

            <Link href="/" className="inline-flex" aria-label="Go to homepage">
              <Logo />
            </Link>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href === "/" && pathname === "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors duration-200",
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
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#1F1B3A]/10 bg-white/70 text-[#1F1B3A] shadow-sm transition-transform duration-200 hover:scale-[1.02]"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </button>

            <WalletButton />

            <Link href="/create" className="hidden sm:inline-flex">
              <Button className="rounded-2xl bg-[#5A4BDB] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(90,75,219,0.22)] hover:bg-[#4d3fd1]">
                Create Equb
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

export default Navbar;
