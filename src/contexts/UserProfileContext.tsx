// src/contexts/UserProfileContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type UserProfile = {
  displayName: string;
  avatarDataUrl: string; // base64 data URL
};

type Ctx = {
  profile: UserProfile;
  setDisplayName: (name: string) => void;
  setAvatarDataUrl: (dataUrl: string) => void;
  clearAvatar: () => void;
};

const LS_PROFILE_KEY = "afroconnect.profile.v1";

const DEFAULT_PROFILE: UserProfile = {
  displayName: "Guest",
  avatarDataUrl: "",
};

const UserProfileContext = createContext<Ctx | null>(null);

function safeParseProfile(raw: string | null): UserProfile {
  if (!raw) return DEFAULT_PROFILE;
  try {
    const parsed = JSON.parse(raw);
    return {
      displayName: typeof parsed?.displayName === "string" ? parsed.displayName : DEFAULT_PROFILE.displayName,
      avatarDataUrl: typeof parsed?.avatarDataUrl === "string" ? parsed.avatarDataUrl : DEFAULT_PROFILE.avatarDataUrl,
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(() => {
    return safeParseProfile(localStorage.getItem(LS_PROFILE_KEY));
  });

  useEffect(() => {
    localStorage.setItem(LS_PROFILE_KEY, JSON.stringify(profile));
  }, [profile]);

  const value = useMemo<Ctx>(() => {
    return {
      profile,
      setDisplayName: (name: string) => setProfile((p) => ({ ...p, displayName: name })),
      setAvatarDataUrl: (dataUrl: string) => setProfile((p) => ({ ...p, avatarDataUrl: dataUrl })),
      clearAvatar: () => setProfile((p) => ({ ...p, avatarDataUrl: "" })),
    };
  }, [profile]);

  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error("useUserProfile must be used inside UserProfileProvider");
  return ctx;
}
