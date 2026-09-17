"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";

import { initCircleSdk } from "@/src/lib/circle";
import { publicClient } from "@/src/lib/arc";

const STORAGE_KEY = "equb-circle-session";
const USER_ID_STORAGE_KEY = "circle_user_id";
const DEVICE_ID_STORAGE_KEY = "circle_device_id";

type CircleSession = {
  walletAddress: string;
  email?: string;
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
  setExternalWallet: (address: string | null, chainId: number | null) => void;
  connectExistingWallet: () => Promise<void>;
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
  const emailSignInInFlight = useRef(false);

  const activeWalletAddress = externalWalletAddress ?? walletAddress;
  const walletType = externalWalletAddress ? "external" : walletAddress ? "circle" : null;

  useEffect(() => {
    const restoreSession = window.setTimeout(() => {
      const restore = async () => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const session = JSON.parse(stored) as CircleSession;
          const storedUserId = session.userId ?? window.localStorage.getItem(USER_ID_STORAGE_KEY);
          setWalletAddress(session.walletAddress || null);
          setUserId(storedUserId);
          setUserToken(session.userToken ?? null);
          setEncryptionKey(session.encryptionKey ?? null);
          if (storedUserId) window.localStorage.setItem(USER_ID_STORAGE_KEY, storedUserId);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
      };
      void restore();
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
    if (emailSignInInFlight.current) return false;
    emailSignInInFlight.current = true;
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
      const circleSdk = initCircleSdk();
      if (!circleSdk) throw new Error("Circle authentication is only available in the browser.");
      const deviceId = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY) ?? await circleSdk.getDeviceId();
      window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
      const currentUserId = userId ?? email.trim().toLowerCase();
      const otpSession = await postJson<OtpSession>("/api/circle/otp", { email, deviceId, userId: currentUserId });
      setUserId(currentUserId);
      setAwaitingOtp(true);
      await startCircleOtpVerification(otpSession, currentUserId);
    } catch (caughtError) {
      setAwaitingOtp(false);
      setError(caughtError instanceof Error ? caughtError.message : "Unable to send verification code.");
/*
      console.log("Circle sign-in: requesting browser device ID");
      const deviceId = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY) ?? await circleSdk.getDeviceId();
      window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
      console.log("Circle sign-in: browser device ID received");
      const otpSession = await postJson<{
        userToken: string;
        encryptionKey: string;
        deviceToken: string;
        deviceEncryptionKey: string;
        otpToken: string;
      }>("/api/circle/session", { email, deviceId });
      console.log("Circle sign-in: email token session received");
      const normalizedEmail = email.trim().toLowerCase();
      setUserToken(otpSession.userToken);
      setEncryptionKey(otpSession.encryptionKey);
      setDeviceToken(otpSession.deviceToken);
      setDeviceEncryptionKey(otpSession.deviceEncryptionKey);
      setOtpToken(otpSession.otpToken);
      setAwaitingOtp(true);

      circleSdk.updateConfigs({
        appSettings: { appId: process.env.NEXT_PUBLIC_CIRCLE_APP_ID! },
        authentication: { userToken: otpSession.userToken, encryptionKey: otpSession.encryptionKey },
        loginConfigs: {
          deviceToken: otpSession.deviceToken,
          deviceEncryptionKey: otpSession.deviceEncryptionKey,
          otpToken: otpSession.otpToken,
        },
      } as never);
      console.log("Circle sign-in: launching OTP card");
      verifyEmailOtp((authError, authResult) => {
        if (authError || !authResult) {
          setError(authError?.message ?? "Unable to verify code.");
          emailSignInInFlight.current = false;
          setAwaitingOtp(false);
          setIsLoading(false);
          return;
        }
        const verifiedToken = authResult.userToken;
        const verifiedEncryptionKey = authResult.encryptionKey;
        let verifiedUserId = normalizedEmail;
        try {
          const payload = JSON.parse(atob(verifiedToken.split(".")[1])) as { sub?: string; userId?: string };
          verifiedUserId = payload.sub ?? payload.userId ?? normalizedEmail;
        } catch {
          setError("Circle returned an invalid verified token.");
          emailSignInInFlight.current = false;
          setAwaitingOtp(false);
          setIsLoading(false);
          return;
        }
        setUserToken(verifiedToken);
        setEncryptionKey(verifiedEncryptionKey);
        setUserId(verifiedUserId);
        setAwaitingOtp(false);
        emailSignInInFlight.current = false;
        window.localStorage.setItem(USER_ID_STORAGE_KEY, verifiedUserId);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ email: normalizedEmail, walletAddress: "", userToken: verifiedToken, encryptionKey: verifiedEncryptionKey, userId: verifiedUserId }));
        setIsLoading(false);
        router.push("/dashboard");
      });
    } catch (caughtError) {
      emailSignInInFlight.current = false;
      const message = caughtError instanceof Error ? caughtError.message : String(caughtError);
      console.error("Circle sign-in start failed:", caughtError);
      setError(message || "Unable to send verification code.");
*/
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



  const connectExistingWallet = useCallback(async () => {
    const provider = (window as Window & {
      ethereum?: { request: (args: { method: string }) => Promise<unknown> };
    }).ethereum;

    if (!provider) {
      setError("Rabby or MetaMask was not detected.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const accounts = await provider.request({ method: "eth_requestAccounts" }) as string[];
      const address = accounts[0];
      const chainId = await provider.request({ method: "eth_chainId" }) as string;
      if (!address) throw new Error("No wallet account was selected.");

      setExternalWallet(address, Number.parseInt(chainId, 16));
      router.push("/dashboard");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to connect wallet.");
    } finally {
      setIsLoading(false);
    }
  }, [router, setExternalWallet]);

/*
  const verifyOtp = useCallback(async (otp: string) => {
    // For Email OTP, userToken and encryptionKey are provided by the SDK after OTP verification.

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
            const result = await postJson<{ walletAddress: string | null; challengeId?: string | null; walletId?: string | null; userToken?: string; encryptionKey?: string; userId?: string }>("/api/circle/verify", { userId, userToken: authResult.userToken, encryptionKey: authResult.encryptionKey, otp });
            const exactUserId = result.userId ?? userId ?? "";
            const exactUserToken = result.userToken ?? authResult.userToken;
            const exactEncryptionKey = result.encryptionKey ?? authResult.encryptionKey;
            if (result.challengeId) {
              await new Promise<void>((challengeResolve, challengeReject) => {
                circleSdk.execute(result.challengeId!, async (challengeError) => {
                  if (challengeError) { challengeReject(new Error(challengeError.message ?? "Unable to set up your Circle PIN.")); return; }
                  try {
                    const walletResult = await postJson<{ walletAddress: string | null; walletId?: string | null }>("/api/circle/verify", { userId, userToken: authResult.userToken, encryptionKey: authResult.encryptionKey, challengeId: result.challengeId });
                    if (!walletResult.walletAddress) throw new Error("Circle did not return a wallet address.");
                    setWalletAddress(walletResult.walletAddress);
                    setUserToken(exactUserToken);
                    setEncryptionKey(exactEncryptionKey);
                    setUserId(exactUserId);
                    setAwaitingOtp(false);
                    if (walletResult.walletId) window.localStorage.setItem("circle_wallet_id", walletResult.walletId);
                    window.localStorage.setItem(USER_ID_STORAGE_KEY, exactUserId);
                    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ walletAddress: walletResult.walletAddress, userToken: exactUserToken, encryptionKey: exactEncryptionKey, userId: exactUserId }));
                    router.push("/dashboard");
                    challengeResolve();
                  } catch (error) { challengeReject(error); }
                });
              });
              return;
            }
            if (!result.walletAddress) throw new Error("Circle did not return a wallet address.");
            setWalletAddress(result.walletAddress);
            setUserToken(exactUserToken);
            setEncryptionKey(exactEncryptionKey);
            setUserId(exactUserId);
            setAwaitingOtp(false);
            if (result.walletId) window.localStorage.setItem("circle_wallet_id", result.walletId);
            window.localStorage.setItem(USER_ID_STORAGE_KEY, exactUserId);
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ walletAddress: result.walletAddress, userToken: exactUserToken, encryptionKey: exactEncryptionKey, userId: exactUserId }));
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
  }, [deviceEncryptionKey, deviceToken, otpToken, router, userId]);

*/
  const resetOtpFlow = useCallback(() => {
    emailSignInInFlight.current = false;
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
    setExternalWallet,
    connectExistingWallet,
    resetOtpFlow,
    signOut,
  }), [activeWalletAddress, awaitingOtp, balance, connectExistingWallet, encryptionKey, error, externalWalletChainId, isLoading, resetOtpFlow, setExternalWallet, signInWithEmail, signOut, userId, userToken, walletType]);

  return <CircleContext.Provider value={value}>{children}</CircleContext.Provider>;
}

export function useCircleContext() {
  const context = useContext(CircleContext);
  if (!context) {
    throw new Error("useCircleContext must be used inside CircleProvider");
  }

  return context;
}
