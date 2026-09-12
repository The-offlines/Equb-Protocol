"use client";

import { useEffect } from "react";
import { useAccount, useChainId } from "wagmi";

import { useCircleContext } from "@/src/providers/CircleProvider";

/** Mirrors an injected wallet into the app's shared wallet state. */
export function WalletSync() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { setExternalWallet } = useCircleContext();

  useEffect(() => {
    setExternalWallet(isConnected && address ? address : null, isConnected ? chainId : null);
  }, [address, chainId, isConnected, setExternalWallet]);

  return null;
}
