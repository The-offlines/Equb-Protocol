"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";

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

type CircleAuthResult = {
  userToken: string;
  encryptionKey: string;
};

type OtpSession = {
  deviceToken: string;
  deviceEncryptionKey: string;
  otpToken: string;
};

type WalletSetupResponse = {
  walletAddress: string | null;
  challengeId?: string | null;
  pending?: boolean;
};

type CircleContextValue = {
  walletAddress: string | null;
  walletType: "circle" | "external" | null;
  externalWalletChainId: number | null;
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
  setExternalWallet: (address: string | null, chainId: number | null) => void;
  resetOtpFlow: () => void;
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

  if (!response.ok && response.status !== 202) {
    throw new Error(payload.error ?? "Circle request failed.");
  }

  return payload;
}

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export function CircleProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [externalWalletAddress, setExternalWalletAddress] = useState<string | null>(null);
  const [externalWalletChainId, setExternalWalletChainId] = useState<number | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState("0.00");
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeWalletAddress = externalWalletAddress ?? walletAddress;
  const walletType = externalWalletAddress ? "external" : walletAddress ? "circle" : null;

  useEffect(() => {
    const restoreSession = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const session = JSON.parse(stored) as CircleSession;
          setWalletAddress(session.walletAddress || null);
          setUserToken(session.userToken ?? null);
          setEncryptionKey(session.encryptionKey ?? null);
          setUserId(session.userId ?? null);
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
      if (!activeWalletAddress) {
        setBalance("0.00");
        return;
      }

      try {
          const balance = await publicClient.getBalance({ address: activeWalletAddress as `0x${string}` });
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
  }, [activeWalletAddress]);

  const completeCircleLogin = useCallback(async (
    circleSdk: W3SSdk,
    authResult: CircleAuthResult,
    currentUserId: string,
  ) => {
    circleSdk.setAuthentication({ userToken: authResult.userToken, encryptionKey: authResult.encryptionKey });

    const initialWalletResult = await postJson<WalletSetupResponse>("/api/circle/otp", {
      userId: currentUserId,
      userToken: authResult.userToken,
      encryptionKey: authResult.encryptionKey,
    });

    let resolvedWalletAddress = initialWalletResult.walletAddress;
    if (initialWalletResult.challengeId) {
      await new Promise<void>((resolve, reject) => {
        circleSdk.execute(initialWalletResult.challengeId!, (challengeError) => {
          if (challengeError) {
            reject(new Error(challengeError.message ?? "Unable to set up your Circle PIN."));
            return;
          }

          void (async () => {
            try {
              for (let attempt = 0; attempt < 30 && !resolvedWalletAddress; attempt += 1) {
                const walletResult = await postJson<WalletSetupResponse>("/api/circle/otp", {
                  userId: currentUserId,
                  userToken: authResult.userToken,
                  encryptionKey: authResult.encryptionKey,
                  challengeId: initialWalletResult.challengeId,
                });
                resolvedWalletAddress = walletResult.walletAddress;
                if (!resolvedWalletAddress && attempt < 29) {
                  await wait(1000);
                }
              }

              if (!resolvedWalletAddress) {
                throw new Error("Wallet setup is still processing. Please try again in a moment.");
              }
              resolve();
            } catch (error) {
              reject(error);
            }
          })();
        });
      });
    }

    if (!resolvedWalletAddress) {
      throw new Error("Circle did not return a wallet address.");
    }

    setWalletAddress(resolvedWalletAddress);
    setUserToken(authResult.userToken);
    setEncryptionKey(authResult.encryptionKey);
    setAwaitingOtp(false);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      walletAddress: resolvedWalletAddress,
      userToken: authResult.userToken,
      encryptionKey: authResult.encryptionKey,
      userId: currentUserId,
    }));
    if (pathname === "/") router.push("/dashboard");
  }, [pathname, router]);

  const startCircleOtpVerification = useCallback(async (otpSession: OtpSession, currentUserId: string) => {
    const circleSdk = initCircleSdk();
    if (!circleSdk) {
      throw new Error("Circle authentication is only available in the browser.");
    }

    await new Promise<void>((resolve, reject) => {
      circleSdk.updateConfigs(
        {
          appSettings: { appId: process.env.NEXT_PUBLIC_CIRCLE_APP_ID! },
          loginConfigs: otpSession,
        },
        async (authError, authResult) => {
          if (authError || !authResult) {
            reject(new Error(authError?.message ?? "Unable to verify your email."));
            return;
          }

          try {
            await completeCircleLogin(circleSdk, authResult, currentUserId);
            resolve();
          } catch (error) {
            reject(error);
          }
        },
      );
      // Circle renders the only OTP input in its verification iframe.
      circleSdk.verifyOtp();
    });
  }, [completeCircleLogin]);

  const signInWithEmail = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);
    setWalletAddress(null);
    setExternalWalletAddress(null);
    setExternalWalletChainId(null);
    setUserToken(null);
    setEncryptionKey(null);
    setAwaitingOtp(false);
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
      const otpSession = await postJson<OtpSession>("/api/circle/otp", { email, deviceId, userId: session.userId });
      setAwaitingOtp(true);
      await startCircleOtpVerification(otpSession, session.userId);
    } catch (caughtError) {
      setAwaitingOtp(false);
      setError(caughtError instanceof Error ? caughtError.message : "Unable to send verification code.");
      return false;
    } finally {
      setIsLoading(false);
    }
    return true;
  }, [startCircleOtpVerification]);

  const setExternalWallet = useCallback((address: string | null, chainId: number | null) => {
    setExternalWalletAddress(address);
    setExternalWalletChainId(chainId);
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

  const resetOtpFlow = useCallback(() => {
    setAwaitingOtp(false);
    setError(null);
  }, []);

  const signOut = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(USER_ID_STORAGE_KEY);
    setWalletAddress(null);
    setUserToken(null);
    setEncryptionKey(null);
    setExternalWalletAddress(null);
    setExternalWalletChainId(null);
    setUserId(null);
    setAwaitingOtp(false);
    setError(null);
  }, []);

  const value = useMemo<CircleContextValue>(() => ({
    walletAddress: activeWalletAddress,
    walletType,
    externalWalletChainId,
    isConnected: Boolean(activeWalletAddress && (walletType === "external" || (userToken && encryptionKey))),
    isLoading,
    balance,
    error,
    awaitingOtp,
    userToken,
    encryptionKey,
    userId,
    signInWithEmail,
    refreshUserToken,
    setExternalWallet,
    resetOtpFlow,
    signOut,
  }), [activeWalletAddress, awaitingOtp, balance, encryptionKey, error, externalWalletChainId, isLoading, refreshUserToken, resetOtpFlow, setExternalWallet, signInWithEmail, signOut, userId, userToken, walletType]);

  return <CircleContext.Provider value={value}>{children}</CircleContext.Provider>;
}

export function useCircleContext() {
  const context = useContext(CircleContext);
  if (!context) {
    throw new Error("useCircleContext must be used inside CircleProvider");
  }

  return context;
}
