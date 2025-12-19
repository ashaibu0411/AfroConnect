// src/hooks/useAuth.tsx
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
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          console.error("[Auth] signUp error:", error);
          setStatus("error");
          throw error;
        }
        // Supabase may require email confirmation depending on settings
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
        // onAuthStateChange will update state
      },

      signInWithPhoneOtp: async (phoneE164) => {
        setStatus("loading");
        const { error } = await supabase.auth.signInWithOtp({ phone: phoneE164 });
        if (error) {
          console.error("[Auth] signInWithOtp error:", error);
          setStatus("error");
          throw error;
        }
        // user still unauthenticated until verify OTP
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
        // onAuthStateChange will update state
      },

      signOut: async () => {
        setStatus("loading");
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error("[Auth] signOut error:", error);
          setStatus("error");
          throw error;
        }
        // onAuthStateChange will update state
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
