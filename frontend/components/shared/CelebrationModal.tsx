"use client";

import { motion } from "framer-motion";

const confettiColors = ["#F0B54A", "#FFFFFF", "#3BB273", "#FF8BA7", "#A99EFF"];

function shortenAddress(address: string) {
  return address.length > 12 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;
}

type CelebrationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  winner: string;
  round: number;
  amount: number;
};

export function CelebrationModal({ isOpen, onClose, winner, round, amount }: CelebrationModalProps) {
  return (
    <>
      <style>{`
        @keyframes equb-confetti-fall {
          0% { transform: translate3d(0, -12vh, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate3d(var(--drift), 112vh, 0) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {isOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-[#5A4BDB] p-6 text-white">
          {Array.from({ length: 28 }, (_, index) => (
            <span
              key={index}
              aria-hidden="true"
              className="pointer-events-none absolute top-0 h-3 w-2 rounded-sm"
              style={{
                left: `${(index * 37) % 100}%`,
                backgroundColor: confettiColors[index % confettiColors.length],
                animation: `equb-confetti-fall ${2.8 + (index % 5) * 0.35}s linear ${(index % 7) * 0.18}s infinite`,
                ["--drift" as string]: `${((index % 9) - 4) * 18}px`,
              }}
            />
          ))}

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative z-10 w-full max-w-md text-center"
          >
            <div className="text-7xl" role="img" aria-label="Trophy">🏆</div>
            <h2 className="mt-6 text-4xl font-black tracking-[-0.06em]">Round {round} Complete!</h2>
            <p className="mt-5 text-sm font-medium uppercase tracking-[0.16em] text-white/70">Winner</p>
            <p className="mt-2 text-xl font-bold">{shortenAddress(winner)}</p>
            <p className="mt-6 text-3xl font-black">{amount.toLocaleString()} USDC</p>
            <p className="mt-1 text-sm text-white/75">Amount received</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-8 rounded-2xl bg-white px-8 py-3 text-sm font-semibold text-[#5A4BDB] shadow-lg transition-transform hover:scale-[1.02]"
            >
              Continue
            </button>
          </motion.div>
        </div>
      ) : null}
    </>
  );
}
