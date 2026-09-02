"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Mail, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useState } from "react";

import Logo from "@/components/shared/Logo";
import { useCircleContext } from "@/src/providers/CircleProvider";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signInWithEmail, verifyOtp, resetOtpFlow, connectExistingWallet, isLoading, error, awaitingOtp } = useCircleContext();
  const [view, setView] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const handleMagicLink = async () => {
    if (!email.trim()) {
      setNotice("Please enter your email address.");
      return;
    }

    const sent = await signInWithEmail(email.trim());
    if (sent) {
      setView("otp");
    }
  };

  const handleVerifyOtp = async () => {
    if (!/^\d{6}$/.test(otp)) {
      setNotice("Enter the 6-digit code from your email.");
      return;
    }

    await verifyOtp(otp);
  };

  const handleResendCode = async () => {
    if (!email.trim()) {
      setNotice("Enter your email address first.");
      setView("email");
      return;
    }

    await signInWithEmail(email.trim());
    setNotice("A new code was sent.");
  };

  const handleBackToEmail = () => {
    resetOtpFlow();
    setOtp("");
    setNotice(null);
    setView("email");
  };

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#1F1B3A]/40 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            className="my-4 max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-[#1F1B3A]/5 bg-white p-6 shadow-[0_28px_80px_rgba(31,27,58,0.20)]"
          >
            <div className="flex items-start justify-end gap-3">

              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F6F3EC] text-[#1F1B3A]"
                aria-label="Close sign in modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-[-2.25rem] flex justify-center">
              <Logo />
            </div>

            <div className="mt-5 text-center">
              <h2 className="text-2xl font-black tracking-[-0.06em] text-[#1F1B3A]">
                Welcome to Equb
              </h2>
              <p className="mt-2 text-sm text-[#6C6885]">
                Your embedded wallet is created automatically
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {!awaitingOtp && view === "email" ? (
                <div className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Enter your email"
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-[#1F1B3A] placeholder:text-[#6C6885] focus:border-[#5A4BDB] focus:outline-none focus:ring-2 focus:ring-[#5A4BDB]/10"
                  />

                  <button
                    type="button"
                    onClick={handleMagicLink}
                    disabled={isLoading}
                    className="w-full rounded-2xl bg-[#5A4BDB] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(90,75,219,0.2)] transition-colors hover:bg-[#4d3fd1] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Mail className="mr-2 inline-block h-4 w-4" />
                    {isLoading ? "Sending code..." : "Continue with Email"}
                  </button>

                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-[#6C6885]">Enter the 6-digit code sent to your email.</p>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    aria-label="Enter the 6-digit code sent to your email"
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-center text-lg font-semibold tracking-[0.3em] text-[#1F1B3A] placeholder:text-[#6C6885] focus:border-[#5A4BDB] focus:outline-none focus:ring-2 focus:ring-[#5A4BDB]/10"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={isLoading}
                    className="w-full rounded-2xl bg-[#5A4BDB] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(90,75,219,0.2)] transition-colors hover:bg-[#4d3fd1] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isLoading ? "Verifying..." : "Verify Code"}
                  </button>
                  <button
                    type="button"
                    onClick={handleBackToEmail}
                    className="w-full rounded-2xl border border-[#1F1B3A]/10 bg-white px-4 py-2 text-sm font-medium text-[#1F1B3A] hover:border-[#5A4BDB]/20 hover:text-[#5A4BDB]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleResendCode()}
                    disabled={isLoading}
                    className="w-full text-center text-xs font-semibold text-[#5A4BDB] hover:text-[#4d3fd1] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Resend Code
                  </button>
                </div>
              )}
            </div>

            <div className="my-5 flex items-center gap-3 text-xs text-[#9A96AA]">
              <span className="h-px flex-1 bg-[#1F1B3A]/10" />
              <span>or</span>
              <span className="h-px flex-1 bg-[#1F1B3A]/10" />
            </div>

            <button
              type="button"
              onClick={() => void connectExistingWallet()}
              disabled={isLoading}
              className="w-full text-center text-xs font-medium text-[#6C6885] transition-colors hover:text-[#5A4BDB] disabled:cursor-not-allowed disabled:opacity-70"
            >
              Already have a wallet? Connect with Rabby
            </button>

            {error || notice ? (
              <div className="mt-4 rounded-2xl bg-[#F6F3EC] px-3 py-2 text-center text-xs font-medium text-[#1F1B3A]">
                {error ?? notice}
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
