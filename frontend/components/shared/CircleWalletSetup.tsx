"use client";

import { useState } from "react";

import { useCircleContext } from "@/src/providers/CircleProvider";
import { executeChallenge } from "@/src/lib/circle";

type CircleWalletSetupProps = {
  isOpen: boolean;
  onComplete: () => void;
};

export default function CircleWalletSetup({ isOpen, onComplete }: CircleWalletSetupProps) {
  const { userId } = useCircleContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  if (!isOpen) return null;

  const handleSetup = async () => {
    if (!userId) {
      setError("Your Circle user ID is missing. Please sign in again.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/circle/initialize-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = (await response.json()) as { challengeId?: string; userToken?: string; encryptionKey?: string; error?: string };
      if (!response.ok || !data.challengeId || !data.userToken || !data.encryptionKey) {
        throw new Error(data.error ?? "Unable to start wallet setup.");
      }

      executeChallenge(data.userToken, data.encryptionKey, data.challengeId, (challengeError, result) => {
        if (challengeError) {
          setError(challengeError.message);
          setIsLoading(false);
          return;
        }
        if (result?.status === "COMPLETE") {
          setIsReady(true);
          setIsLoading(false);
          window.setTimeout(onComplete, 700);
        } else if (result?.status === "FAILED") {
          setError("Wallet setup failed.");
          setIsLoading(false);
        }
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to set up wallet.");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="wallet-setup-title">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        {isReady ? (
          <p className="text-lg font-semibold text-[#1F8A4D]">Wallet ready!</p>
        ) : (
          <>
            <h2 id="wallet-setup-title" className="text-xl font-bold text-[#1F1B3A]">Set Up Your Wallet</h2>
            <p className="mt-2 text-sm text-[#6C6885]">Create a PIN to secure your Circle wallet. You will need this PIN to approve transactions.</p>
            {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
            <button type="button" onClick={() => void handleSetup()} disabled={isLoading} className="mt-6 w-full rounded-2xl bg-[#5A4BDB] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
              {isLoading ? "Setting up..." : "Set Up PIN"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}