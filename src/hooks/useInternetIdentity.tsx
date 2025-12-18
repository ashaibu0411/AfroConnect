// src/hooks/useInternetIdentity.tsx
import React, { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type LoginStatus = "idle" | "logging-in" | "success" | "loginError";

export type AuthUser = {
  id: string;              // stable internal id
  displayName: string;     // what to show in UI
  email?: string;
  phone?: string;
};

type InternetIdentityContextValue = {
  user: AuthUser | null;
  identity: AuthUser | null; // keep backward-compat with earlier code that checks `identity`
  loginStatus: LoginStatus;
  beginAuth: () => void;      // opens your AuthSheet (email/phone)
  completeAuth: (user: AuthUser) => void;
  login: () => Promise<void>; // kept for backward-compat; calls beginAuth()
  clear: () => Promise<void>;
};

const LS_AUTH_USER = "afroconnect.authUser.v1";

const InternetIdentityContext = createContext<InternetIdentityContextValue | undefined>(undefined);

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function InternetIdentityProvider({ children }: { children: ReactNode }) {
  const [loginStatus, setLoginStatus] = useState<LoginStatus>("idle");
  const [user, setUser] = useState<AuthUser | null>(() => safeParse<AuthUser | null>(localStorage.getItem(LS_AUTH_USER), null));

  // this flag can be used by App.tsx to open AuthSheet
  const [authSheetOpen, setAuthSheetOpen] = useState(false);

  const value = useMemo<InternetIdentityContextValue>(
    () => ({
      user,
      identity: user, // for code that still checks identity
      loginStatus,

      beginAuth: () => {
        setAuthSheetOpen(true);
      },

      completeAuth: (u: AuthUser) => {
        setLoginStatus("success");
        setUser(u);
        localStorage.setItem(LS_AUTH_USER, JSON.stringify(u));
        setAuthSheetOpen(false);
      },

      // backward-compat: existing code calls login()
      login: async () => {
        try {
          setLoginStatus("logging-in");
          setAuthSheetOpen(true);
          // actual completion happens through completeAuth()
        } catch {
          setLoginStatus("loginError");
        }
      },

      clear: async () => {
        setUser(null);
        setLoginStatus("idle");
        localStorage.removeItem(LS_AUTH_USER);
      },
    }),
    [user, loginStatus]
  );

  return (
    <InternetIdentityContext.Provider value={value}>
      {/* Expose this state via window so App.tsx can open/close AuthSheet without circular deps */}
      <AuthSheetBridge open={authSheetOpen} onOpenChange={setAuthSheetOpen} />
      {children}
    </InternetIdentityContext.Provider>
  );
}

/**
 * Minimal bridge to allow App.tsx to know whether auth sheet should be open.
 * App.tsx will read window.__AFROCONNECT_AUTH__.
 */
function AuthSheetBridge({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__AFROCONNECT_AUTH__ = { open, onOpenChange };
  return null;
}

export function useInternetIdentity(): InternetIdentityContextValue {
  const ctx = useContext(InternetIdentityContext);
  if (!ctx) throw new Error("useInternetIdentity must be used within an InternetIdentityProvider");
  return ctx;
}
