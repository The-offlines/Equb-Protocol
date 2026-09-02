"use client";

import { useEffect, useState } from "react";
import { formatUnits } from "viem";

import { useCircleContext } from "@/src/providers/CircleProvider";
import { publicClient } from "@/src/lib/arc";

export function useCircleWallet() {
  const context = useCircleContext();
  const [balance, setBalance] = useState(context.balance);

  useEffect(() => {
    let isActive = true;

    const loadBalance = async () => {
      if (!context.walletAddress) {
        setBalance("0.00 USDC");
        return;
      }

      try {
        const value = await publicClient.getBalance({ address: context.walletAddress as `0x${string}` });
        if (isActive) {
          setBalance(`${Number(formatUnits(value, 18)).toFixed(2)} USDC`);
        }
      } catch {
        if (isActive) {
          setBalance("0.00 USDC");
        }
      }
    };

    void loadBalance();
    const intervalId = window.setInterval(() => void loadBalance(), 30000);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [context.walletAddress]);

  return { ...context, balance };
}