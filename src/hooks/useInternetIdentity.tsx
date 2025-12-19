// src/hooks/useInternetIdentity.tsx
import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type LoginStatus = "idle" | "logging-in" | "success" | "loginError";

export type AuthUser = {
  id: string; // stable internal id
  displayName: string; // what to show in UI
  email?: string;
  phone?: string;
};

type InternetIdentityContextValue = {
  user: AuthUser | null;
  identity: AuthUser | null; // backward-compat for earlier code that checks `identity`
  loginStatus: LoginStatus;

  // Opens your AuthSheet (email/phone)
  beginAuth: () => void;

  // Call this once email/phone verification succeeds and you have the user object
  completeAuth: (user: AuthUser) => void;

  // Backward-compat: existing code calls login()
  login: () => Promise<void>;

  clear: () => Promise<void>;
};

const LS_AUTH_USER = "afroconnect.authUser.v1";

const InternetIdentityContext = createContext<
  InternetIdentityContextValue | undefined
>(undefined);

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
  const [user, setUser] = useState<AuthUser | null>(() =>
    safeParse<AuthUser | null>(localStorage.getItem(LS_AUTH_USER), null)
  );

  // Used by App.tsx to open AuthSheet
  const [authSheetOpen, setAuthSheetOpen] = useState(false);

  const value = useMemo<InternetIdentityContextValue>(
    () => ({
      user,
      identity: user,
      loginStatus,

      beginAuth: () => {
        setLoginStatus("logging-in");
        setAuthSheetOpen(true);
      },

      completeAuth: (u: AuthUser) => {
        setUser(u);
        setLoginStatus("success");
        localStorage.setItem(LS_AUTH_USER, JSON.stringify(u));
        setAuthSheetOpen(false);
      },

      // backward-compat: existing code calls login()
      login: async () => {
        try {
          setLoginStatus("logging-in");
          setAuthSheetOpen(true);
        } catch (e) {
          console.error("[Auth] login error:", e);
          setLoginStatus("loginError");
        }
      },

      clear: async () => {
        setUser(null);
        setLoginStatus("idle");
        setAuthSheetOpen(false);
        localStorage.removeItem(LS_AUTH_USER);
      },
    }),
    [user, loginStatus, authSheetOpen]
  );

  return (
    <InternetIdentityContext.Provider value={value}>
      {/* Bridge: exposes auth sheet open state without circular imports */}
      <AuthSheetBridge open={authSheetOpen} onOpenChange={setAuthSheetOpen} />
      {children}
    </InternetIdentityContext.Provider>
  );
}

/**
 * Minimal bridge to allow App.tsx to know whether auth sheet should be open.
 * App.tsx will read window.__AFROCONNECT_AUTH__.
 */
function AuthSheetBridge({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__AFROCONNECT_AUTH__ = { open, onOpenChange };
  return null;
}

export function useInternetIdentity(): InternetIdentityContextValue {
  const ctx = useContext(InternetIdentityContext);
  if (!ctx) {
    throw new Error(
      "useInternetIdentity must be used within an InternetIdentityProvider"
    );
  }
  return ctx;
}
