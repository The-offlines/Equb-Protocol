"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import { AuthModal } from "@/components/shared/AuthModal";
import { WalletProfile } from "@/components/shared/WalletProfile";
import { useCircleContext } from "@/src/providers/CircleProvider";

const shortenAddress = (address: string | null) => {
  if (!address) {
    return "Not connected";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export function WalletButton() {
  const { walletAddress, isConnected } = useCircleContext();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  if (!isConnected) {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsAuthOpen(true)}
          className="inline-flex items-center justify-center rounded-2xl bg-[#5A4BDB] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(90,75,219,0.22)] transition-colors hover:bg-[#4d3fd1]"
        >
          Sign In
        </button>

        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      </>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsProfileOpen((current) => !current)}
        className="inline-flex items-center gap-2 rounded-full bg-[#1F1B3A] px-3 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(31,27,58,0.12)] transition-colors hover:bg-[#201a39]"
      >
        <span className="h-2.5 w-2.5 rounded-full bg-[#3BB273]" />
        <span>{shortenAddress(walletAddress)}</span>
      </button>

      <AnimatePresence>
        {isProfileOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 top-full z-50 mt-3"
          >
            <WalletProfile onClose={() => setIsProfileOpen(false)} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
