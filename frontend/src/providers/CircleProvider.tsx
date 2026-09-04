"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { initCircleSdk } from "@/src/lib/circle";
import { publicClient } from "@/src/lib/arc";

const STORAGE_KEY = "equb-circle-session";
const USER_ID_STORAGE_KEY = "circle_user_id";

type CircleSession = {
  walletAddress: string;
  userToken?: string;
  encryptionKey?: string;
  userId?: string;
};

type CircleContextValue = {
  walletAddress: string | null;
  isConnected: boolean;
  isLoading: boolean;
  balance: string;
  error: string | null;
  awaitingOtp: boolean;
  userToken: string | null;
  encryptionKey: string | null;
  userId: string | null;
  signInWithEmail: (email: string) => Promise<boolean>;
  refreshUserToken: () => Promise<{ userToken: string; encryptionKey: string } | null>;
  verifyOtp: (otp: string) => Promise<void>;
  resetOtpFlow: () => void;
  connectExistingWallet: () => Promise<void>;
  signOut: () => void;
};

export const CircleContext = createContext<CircleContextValue | undefined>(undefined);

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "Circle request failed.");
  }

  return payload;
}

export function CircleProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [deviceEncryptionKey, setDeviceEncryptionKey] = useState<string | null>(null);
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState("0.00");
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const restoreSession = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const session = JSON.parse(stored) as CircleSession;
          setWalletAddress(session.walletAddress || null);
          setUserToken(session.userToken ?? null);
          setEncryptionKey(session.encryptionKey ?? null);
          setUserId(session.userId ?? window.localStorage.getItem(USER_ID_STORAGE_KEY));
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }, 0);

    return () => window.clearTimeout(restoreSession);
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadBalance = async () => {
      if (!walletAddress) {
        setBalance("0.00");
        return;
      }

      try {
        const balance = await publicClient.getBalance({ address: walletAddress as `0x${string}` });
        if (isActive) {
          const balanceInUsdc = Number(balance) / 1e18;
          setBalance(balanceInUsdc.toFixed(2));
        }
      } catch {
        if (isActive) setBalance("0.00");
      }
    };

    void loadBalance();
    const intervalId = window.setInterval(() => void loadBalance(), 30000);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [walletAddress]);

  const signInWithEmail = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);
    setWalletAddress(null);
    window.localStorage.removeItem(STORAGE_KEY);

    try {
      const session = await postJson<{ userToken: string; encryptionKey: string; userId: string; walletId?: string | null }>("/api/circle/session", { email });
      setUserToken(session.userToken);
      setEncryptionKey(session.encryptionKey);
      setUserId(session.userId);
      window.localStorage.setItem(USER_ID_STORAGE_KEY, session.userId);
      if (session.walletId) window.localStorage.setItem("circle_wallet_id", session.walletId);
      const circleSdk = initCircleSdk();
      if (!circleSdk) throw new Error("Circle authentication is only available in the browser.");
      const deviceId = await circleSdk.getDeviceId();
      const otpSession = await postJson<{ deviceToken: string; deviceEncryptionKey: string; otpToken: string }>("/api/circle/otp", { email, deviceId, userId: session.userId });
      setDeviceToken(otpSession.deviceToken);
      setDeviceEncryptionKey(otpSession.deviceEncryptionKey);
      setOtpToken(otpSession.otpToken);
      setAwaitingOtp(true);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to send verification code.");
      return false;
    } finally {
      setIsLoading(false);
    }
    return true;
  }, []);

  const refreshUserToken = useCallback(async () => {
    if (!userId) {
      setError("Your Circle session has expired. Please sign in with your email again.");
      return null;
    }

    try {
      const session = await postJson<{ userToken: string; encryptionKey: string; userId: string; walletId?: string | null }>("/api/circle/session", { userId });
      setUserToken(session.userToken);
      setEncryptionKey(session.encryptionKey);
      window.localStorage.setItem(USER_ID_STORAGE_KEY, session.userId);
      if (session.walletId) window.localStorage.setItem("circle_wallet_id", session.walletId);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ walletAddress, userToken: session.userToken, encryptionKey: session.encryptionKey, userId: session.userId }));
      return { userToken: session.userToken, encryptionKey: session.encryptionKey };
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to refresh Circle session.");
      return null;
    }
  }, [userId, walletAddress]);

  const verifyOtp = useCallback(async (otp: string) => {
    if (!userToken || !encryptionKey) {
      setError("Your Circle session has expired. Please enter your email again.");
      setAwaitingOtp(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const circleSdk = initCircleSdk();
      if (!circleSdk || !deviceToken || !deviceEncryptionKey || !otpToken) throw new Error("Your OTP session has expired. Please request a new code.");
      await new Promise<void>((resolve, reject) => {
        circleSdk.updateConfigs({ appSettings: { appId: process.env.NEXT_PUBLIC_CIRCLE_APP_ID! }, loginConfigs: { deviceToken, deviceEncryptionKey, otpToken } }, async (authError, authResult) => {
          if (authError || !authResult) { reject(new Error(authError?.message ?? "Unable to verify code.")); return; }
          try {
            circleSdk.setAuthentication({ userToken: authResult.userToken, encryptionKey: authResult.encryptionKey });
            const result = await postJson<{ walletAddress: string | null; challengeId?: string | null }>("/api/circle/verify", { userId, userToken: authResult.userToken, encryptionKey: authResult.encryptionKey, otp });
            if (result.challengeId) {
              await new Promise<void>((challengeResolve, challengeReject) => {
                circleSdk.execute(result.challengeId!, async (challengeError) => {
                  if (challengeError) { challengeReject(new Error(challengeError.message ?? "Unable to set up your Circle PIN.")); return; }
                  try {
                    const walletResult = await postJson<{ walletAddress: string | null }>("/api/circle/verify", { userId, userToken: authResult.userToken, encryptionKey: authResult.encryptionKey, challengeId: result.challengeId });
                    if (!walletResult.walletAddress) throw new Error("Circle did not return a wallet address.");
                    setWalletAddress(walletResult.walletAddress);
                    setUserToken(authResult.userToken);
                    setEncryptionKey(authResult.encryptionKey);
                    setAwaitingOtp(false);
                    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ walletAddress: walletResult.walletAddress, userToken: authResult.userToken, encryptionKey: authResult.encryptionKey, userId }));
                    router.push("/dashboard");
                    challengeResolve();
                  } catch (error) { challengeReject(error); }
                });
              });
              return;
            }
            if (!result.walletAddress) throw new Error("Circle did not return a wallet address.");
            setWalletAddress(result.walletAddress);
            setUserToken(authResult.userToken);
            setEncryptionKey(authResult.encryptionKey);
            setAwaitingOtp(false);
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ walletAddress: result.walletAddress, userToken: authResult.userToken, encryptionKey: authResult.encryptionKey, userId }));
            router.push("/dashboard");
            resolve();
          } catch (error) { reject(error); }
        });
        circleSdk.verifyOtp();
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to verify code.");
    } finally {
      setIsLoading(false);
    }
  }, [deviceEncryptionKey, deviceToken, encryptionKey, otpToken, router, userId, userToken]);

  const resetOtpFlow = useCallback(() => {
    setAwaitingOtp(false);
    setError(null);
  }, []);

  const connectExistingWallet = useCallback(async () => {
    const provider = (window as Window & { ethereum?: { request: (args: { method: string }) => Promise<string[]> } }).ethereum;
    if (!provider) {
      setError("Rabby or MetaMask was not detected.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      const address = accounts[0];
      if (!address) {
        throw new Error("No wallet account was selected.");
      }
      setWalletAddress(address);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ walletAddress: address }));
      router.push("/dashboard");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to connect wallet.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const signOut = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(USER_ID_STORAGE_KEY);
    setWalletAddress(null);
    setUserToken(null);
    setEncryptionKey(null);
    setDeviceToken(null);
    setDeviceEncryptionKey(null);
    setOtpToken(null);
    setUserId(null);
    setAwaitingOtp(false);
    setError(null);
  }, []);

  const value = useMemo<CircleContextValue>(() => ({
    walletAddress,
    isConnected: Boolean(walletAddress),
    isLoading,
    balance,
    error,
    awaitingOtp,
    userToken,
    encryptionKey,
    userId,
    signInWithEmail,
    refreshUserToken,
    verifyOtp,
    resetOtpFlow,
    connectExistingWallet,
    signOut,
  }), [awaitingOtp, balance, connectExistingWallet, encryptionKey, error, isLoading, refreshUserToken, resetOtpFlow, signInWithEmail, signOut, userId, userToken, verifyOtp, walletAddress]);

  return <CircleContext.Provider value={value}>{children}</CircleContext.Provider>;
}

export function useCircleContext() {
  const context = useContext(CircleContext);
  if (!context) {
    throw new Error("useCircleContext must be used inside CircleProvider");
  }

  return context;
}
