import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated" | "error";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  status: AuthStatus;

  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;

  signInWithPhoneOtp: (phoneE164: string) => Promise<void>;
  verifyPhoneOtp: (phoneE164: string, token: string) => Promise<void>;

  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getSiteUrl() {
  // Prefer explicit env var for Vercel stability; fallback to current origin.
  const env = (import.meta as any)?.env;
  const fromEnv = (env?.VITE_SITE_URL as string | undefined)?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return window.location.origin.replace(/\/$/, "");
}

function getAuthCallbackUrl() {
  return `${getSiteUrl()}/auth/callback`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let alive = true;

    (async () => {
      setStatus("loading");
      const { data, error } = await supabase.auth.getSession();
      if (!alive) return;

      if (error) {
        console.error("[Auth] getSession error:", error);
        setStatus("error");
        return;
      }

      setSession(data.session);
      setUser(data.session?.user ?? null);
      setStatus(data.session?.user ? "authenticated" : "unauthenticated");
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setStatus(newSession?.user ? "authenticated" : "unauthenticated");
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      status,

      signUpWithEmail: async (email, password) => {
        setStatus("loading");

        const emailRedirectTo = getAuthCallbackUrl();

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo,
          },
        });

        if (error) {
          console.error("[Auth] signUp error:", error);
          setStatus("error");
          throw error;
        }

        // If confirmation is OFF, user may be signed in immediately.
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user ?? null);
        setStatus(data.session?.user ? "authenticated" : "unauthenticated");
      },

      signInWithEmail: async (email, password) => {
        setStatus("loading");
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          console.error("[Auth] signInWithPassword error:", error);
          setStatus("error");
          throw error;
        }
        // onAuthStateChange updates state
      },

      signInWithPhoneOtp: async (phoneE164) => {
        setStatus("loading");

        // Phone OTP does not typically use redirectTo, but we keep callback URL handy
        // for future magic-link/OAuth additions.
        const { error } = await supabase.auth.signInWithOtp({
          phone: phoneE164,
          options: {
            // keep user creation enabled
            shouldCreateUser: true,
          },
        });

        if (error) {
          console.error("[Auth] signInWithOtp error:", error);
          setStatus("error");
          throw error;
        }

        setStatus("unauthenticated");
      },

      verifyPhoneOtp: async (phoneE164, token) => {
        setStatus("loading");
        const { error } = await supabase.auth.verifyOtp({
          phone: phoneE164,
          token,
          type: "sms",
        });
        if (error) {
          console.error("[Auth] verifyOtp error:", error);
          setStatus("error");
          throw error;
        }
        // onAuthStateChange updates state
      },

      signOut: async () => {
        setStatus("loading");
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error("[Auth] signOut error:", error);
          setStatus("error");
          throw error;
        }
        // onAuthStateChange updates state
      },
    }),
    [user, session, status]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
