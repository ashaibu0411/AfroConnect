// src/hooks/useAuth.tsx
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
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

// Helps ensure we never stay stuck forever in “loading”
function withTimeout<T>(p: Promise<T>, ms: number, label: string) {
  return new Promise<T>((resolve, reject) => {
    const id = window.setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    p.then(
      (v) => {
        window.clearTimeout(id);
        resolve(v);
      },
      (e) => {
        window.clearTimeout(id);
        reject(e);
      }
    );
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const syncingRef = useRef(false);

  async function getMyProfile(): Promise<ProfileRow | null> {
    try {
      const { data: s, error: sErr } = await supabase.auth.getSession();
      if (sErr) return null;

      const uid = s.session?.user?.id;
      if (!uid) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, display_name, avatar_url")
        .eq("id", uid)
        .maybeSingle();

      if (error) return null;
      return (data as ProfileRow) ?? null;
    } catch {
      return null;
    }
  }

  // src/hooks/useAuth.tsx
async function upsertMyProfile(p: {
  firstName: string;
  lastName: string;
  handle: string;                // ✅ new
  interests?: string[];          // ✅ optional
  onboardingComplete?: boolean;  // ✅ optional
}): Promise<ProfileRow & { handle?: string | null; interests?: string[]; onboarding_complete?: boolean }> {
  const { data: s, error: sErr } = await supabase.auth.getSession();
  if (sErr) {
    console.error("[Auth] getSession error in upsertMyProfile:", sErr);
    throw sErr;
  }

  const u = s.session?.user;
  if (!u) throw new Error("No active session. Please log in again.");

  const first = p.firstName.trim();
  const last = p.lastName.trim();
  const handle = p.handle.trim();
  const display = handle || `${first} ${last}`.trim();

  const payload: any = {
    id: u.id,
    first_name: first,
    last_name: last,
    display_name: display,
    handle: handle || null,
  };

  if (Array.isArray(p.interests)) payload.interests = p.interests;
  if (typeof p.onboardingComplete === "boolean") payload.onboarding_complete = p.onboardingComplete;

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select("id, first_name, last_name, display_name, avatar_url, handle, interests, onboarding_complete")
    .single();

  if (error) {
    console.error("[Profile] upsert error:", error);
    throw error;
  }

  // keep your local save (if you already have it)
  localStorage.setItem(
    "afroconnect.profile",
    JSON.stringify({
      displayName: data.display_name,
      avatarUrl: data.avatar_url ?? undefined,
    })
  );
  window.dispatchEvent(new Event("afroconnect.profileUpdated"));

  return data;
}

  async function syncSessionState() {
    if (syncingRef.current) return;
    syncingRef.current = true;

    try {
      // If Supabase env is wrong, this can hang/fail — timeout prevents “forever loading”.
      const { data, error } = await withTimeout(supabase.auth.getSession(), 6000, "supabase.auth.getSession");

      if (error) {
        console.error("[Auth] getSession error:", error);
        setSession(null);
        setUser(null);
        setStatus("unauthenticated"); // don’t brick UI
        clearProfileLocal();
        return;
      }

      const sess = data.session ?? null;
      const u = sess?.user ?? null;

      setSession(sess);
      setUser(u);
      setStatus(u ? "authenticated" : "unauthenticated");

      if (u) {
        const prof = await getMyProfile();
        if (prof) saveProfileToLocal(prof);
      } else {
        clearProfileLocal();
      }
    } catch (e) {
      console.error("[Auth] syncSessionState failed:", e);
      setSession(null);
      setUser(null);
      setStatus("unauthenticated"); // do not stay stuck in loading
      clearProfileLocal();
    } finally {
      syncingRef.current = false;
    }
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!alive) return;
      setStatus("loading");
      await syncSessionState();
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, _newSession) => {
      if (!alive) return;
      await syncSessionState();
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
          setStatus("unauthenticated");
          throw error;
        }
        await syncSessionState(); // may remain unauthenticated if email confirm enabled
      },

      signInWithEmail: async (email, password) => {
        setStatus("loading");
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setStatus("unauthenticated");
          throw error;
        }

        // reflect immediately
        const sess = data.session ?? null;
        const u = sess?.user ?? null;
        setSession(sess);
        setUser(u);
        setStatus(u ? "authenticated" : "unauthenticated");

        await syncSessionState();
      },

      signInWithGoogle: async () => {
        setStatus("loading");

        // Make sure this exact origin is in Supabase Auth -> URL Configuration -> Redirect URLs
        const redirectTo = window.location.origin;

        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo },
        });

        if (error) {
          setStatus("unauthenticated");
          throw error;
        }
        // Redirect happens; state sync on return.
      },

      signInWithPhoneOtp: async (phoneE164) => {
        setStatus("loading");
        const { error } = await supabase.auth.signInWithOtp({ phone: phoneE164 });
        if (error) {
          setStatus("unauthenticated");
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
          setStatus("unauthenticated");
          throw error;
        }
        await syncSessionState();
      },

      signOut: async () => {
        setStatus("loading");
        const { error } = await supabase.auth.signOut();
        if (error) {
          setStatus("error");
          throw error;
        }
        await syncSessionState();
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
