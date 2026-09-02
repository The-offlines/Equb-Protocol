"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "equb-wallet-state";

type WalletState = {
  walletAddress: string | null;
  isConnected: boolean;
  balance: string;
};

const defaultState: WalletState = {
  walletAddress: null,
  isConnected: false,
  balance: "0.00 USDC",
};

let globalState: WalletState = defaultState;
const listeners = new Set<() => void>();

const readStoredState = (): WalletState => {
  if (typeof window === "undefined") {
    return globalState;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return globalState;
    }

    const parsed = JSON.parse(raw) as Partial<WalletState>;
    return {
      walletAddress: parsed.walletAddress ?? globalState.walletAddress ?? null,
      isConnected: parsed.isConnected ?? globalState.isConnected ?? false,
      balance: parsed.balance ?? globalState.balance ?? "0.00 USDC",
    };
  } catch {
    return globalState;
  }
};

const persistState = (nextState: WalletState) => {
  globalState = nextState;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  }

  listeners.forEach((listener) => listener());
};

export function useWallet() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [balance, setBalance] = useState("0.00 USDC");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const syncFromStorage = () => {
      const next = readStoredState();
      setWalletAddress(next.walletAddress);
      setIsConnected(next.isConnected);
      setBalance(next.balance);
    };

    syncFromStorage();
    listeners.add(syncFromStorage);

    return () => {
      listeners.delete(syncFromStorage);
    };
  }, []);

  const signIn = async (email: string) => {
    setIsLoading(true);
    setError(null);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const nextState: WalletState = {
      walletAddress: "0x315EED96725dFbdDeFcdF35673634CD1eCEB9433",
      isConnected: true,
      balance: "1,250.00 USDC",
    };

    persistState(nextState);
    setWalletAddress(nextState.walletAddress);
    setIsConnected(nextState.isConnected);
    setBalance(nextState.balance);
    setIsLoading(false);

    if (!email || !email.trim()) {
      setError("Email is required");
      return;
    }
  };

  const signOut = () => {
    const nextState: WalletState = {
      walletAddress: null,
      isConnected: false,
      balance: "0.00 USDC",
    };

    persistState(nextState);
    setWalletAddress(null);
    setIsConnected(false);
    setBalance("0.00 USDC");
    setError(null);
  };

  return {
    walletAddress,
    isConnected,
    balance,
    signIn,
    signOut,
    isLoading,
    error,
  };
}
