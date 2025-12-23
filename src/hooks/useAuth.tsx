// src/hooks/useAuth.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated" | "error";

export type ProfileRow = {
  id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  avatar_url?: string | null;
};

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  status: AuthStatus;

  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;

  signInWithGoogle: () => Promise<void>;

  signInWithPhoneOtp: (phoneE164: string) => Promise<void>;
  verifyPhoneOtp: (phoneE164: string, token: string) => Promise<void>;

  signOut: () => Promise<void>;

  upsertMyProfile: (p: { firstName: string; lastName: string }) => Promise<ProfileRow>;
  getMyProfile: () => Promise<ProfileRow | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const LS_PROFILE = "afroconnect.profile";

function saveProfileToLocal(profile: ProfileRow) {
  localStorage.setItem(
    LS_PROFILE,
    JSON.stringify({
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url ?? undefined,
    })
  );
  window.dispatchEvent(new Event("afroconnect.profileUpdated"));
}

function clearProfileLocal() {
  localStorage.removeItem(LS_PROFILE);
  window.dispatchEvent(new Event("afroconnect.profileUpdated"));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  async function getMyProfile(): Promise<ProfileRow | null> {
    const { data: s, error: sErr } = await supabase.auth.getSession();
    if (sErr) {
      console.error("[Auth] getSession error in getMyProfile:", sErr);
      return null;
    }

    const uid = s.session?.user?.id;
    if (!uid) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, display_name, avatar_url")
      .eq("id", uid)
      .maybeSingle();

    if (error) {
      console.error("[Profile] getMyProfile error:", error);
      return null;
    }

    return (data as ProfileRow) ?? null;
  }

  async function upsertMyProfile(p: { firstName: string; lastName: string }): Promise<ProfileRow> {
    const { data: s, error: sErr } = await supabase.auth.getSession();
    if (sErr) {
      console.error("[Auth] getSession error in upsertMyProfile:", sErr);
      throw sErr;
    }

    const u = s.session?.user;
    if (!u) throw new Error("No active session. Please log in again.");

    const first = p.firstName.trim();
    const last = p.lastName.trim();
    const display = `${first} ${last}`.trim();

    const payload = {
      id: u.id,
      first_name: first,
      last_name: last,
      display_name: display,
      avatar_url: null,
    };

    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select("id, first_name, last_name, display_name, avatar_url")
      .single();

    if (error) {
      console.error("[Profile] upsert error:", error);
      throw error;
    }

    saveProfileToLocal(data as ProfileRow);
    return data as ProfileRow;
  }

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

      if (data.session?.user) {
        const prof = await getMyProfile();
        if (prof) saveProfileToLocal(prof);
      } else {
        clearProfileLocal();
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setStatus(newSession?.user ? "authenticated" : "unauthenticated");

      if (newSession?.user) {
        const prof = await getMyProfile();
        if (prof) saveProfileToLocal(prof);
      } else {
        clearProfileLocal();
      }
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

        // Important: if email confirmation is ON, user may still be unauthenticated here.
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

        // onAuthStateChange will set authenticated; if it lags, avoid staying stuck
        setStatus("unauthenticated");
      },

      signInWithGoogle: async () => {
        setStatus("loading");

        // For local dev, Supabase can usually infer redirect,
        // but explicitly setting it avoids “nothing happens” issues.
        const redirectTo = window.location.origin;

        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo },
        });

        if (error) {
          console.error("[Auth] signInWithOAuth(google) error:", error);
          setStatus("error");
          throw error;
        }

        // OAuth redirects away; no further code runs here in most flows.
        setStatus("unauthenticated");
      },

      signInWithPhoneOtp: async (phoneE164) => {
        setStatus("loading");
        const { error } = await supabase.auth.signInWithOtp({ phone: phoneE164 });

        if (error) {
          console.error("[Auth] signInWithOtp error:", error);
          setStatus("error");
          throw error;
        }

        // OTP sent, still not authenticated until verify
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

        // onAuthStateChange will set authenticated
        setStatus("unauthenticated");
      },

      signOut: async () => {
        setStatus("loading");
        const { error } = await supabase.auth.signOut();

        if (error) {
          console.error("[Auth] signOut error:", error);
          setStatus("error");
          throw error;
        }

        setSession(null);
        setUser(null);
        setStatus("unauthenticated");
        clearProfileLocal();
      },

      upsertMyProfile,
      getMyProfile,
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
