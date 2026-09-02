"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";

type ToastProps = {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
};

const typeStyles = {
  success: "bg-[#1F8A4D]",
  error: "bg-[#D9345F]",
  info: "bg-[#3478D4]",
};

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timeoutId = window.setTimeout(onClose, 4000);
    return () => window.clearTimeout(timeoutId);
  }, [message, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      className={`fixed bottom-6 right-6 z-50 flex max-w-sm items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg ${typeStyles[type]}`}
      role="status"
    >
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="Close notification" className="shrink-0 rounded-full p-1 hover:bg-white/15">
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
