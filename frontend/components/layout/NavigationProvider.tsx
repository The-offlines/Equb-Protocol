"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type NavigationContextValue = {
  mobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const value = useMemo(
    () => ({
      mobileMenuOpen,
      toggleMobileMenu: () => setMobileMenuOpen((open) => !open),
      closeMobileMenu: () => setMobileMenuOpen(false),
    }),
    [mobileMenuOpen],
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used inside NavigationProvider");
  }

  return context;
}
