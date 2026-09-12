"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Mail, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";

import Logo from "@/components/shared/Logo";
import { useCircleContext } from "@/src/providers/CircleProvider";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signInWithEmail, resetOtpFlow, isLoading, error, awaitingOtp, walletAddress } = useCircleContext();
  const [email, setEmail] = useState("");
  const authStarted = useRef(false);

  useEffect(() => {
    // Only close after this modal initiated authentication. Do not close it
    // because a previously stored session was restored in the background.
    if (isOpen && authStarted.current && walletAddress && !awaitingOtp) {
      authStarted.current = false;
      onClose();
    }
  }, [awaitingOtp, isOpen, onClose, walletAddress]);

  const handleClose = () => {
    authStarted.current = false;
    resetOtpFlow();
    setEmail("");
    onClose();
  };
  const handleMagicLink = async () => {
    if (!email.trim()) {
      return;
    }

    authStarted.current = true;
    if (!(await signInWithEmail(email.trim()))) {
      authStarted.current = false;
    }
  };

  // Circle owns the only OTP input. Its iframe is opened by the provider.
  if (typeof document === "undefined" || awaitingOtp) {
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
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
          onClick={handleClose}
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
                onClick={handleClose}
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
              <h2 id="auth-modal-title" className="text-2xl font-black tracking-[-0.06em] text-[#1F1B3A]">
                Welcome to Equb
              </h2>
              <p className="mt-2 text-sm text-[#6C6885]">
                Your embedded wallet is created automatically
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void handleMagicLink(); }}>
                <label htmlFor="auth-email" className="sr-only">Email address</label>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-[#1F1B3A] placeholder:text-[#6C6885] focus:border-[#5A4BDB] focus:outline-none focus:ring-2 focus:ring-[#5A4BDB]/10"
                />

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-2xl bg-[#5A4BDB] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(90,75,219,0.2)] transition-colors hover:bg-[#4d3fd1] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Mail className="mr-2 inline-block h-4 w-4" />
                  {isLoading ? "Opening verification..." : "Continue with Email"}
                </button>
              </form>
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl bg-[#FFF0F3] px-3 py-2 text-center text-xs font-medium text-[#B4234D]" role="alert">
                {error}
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
