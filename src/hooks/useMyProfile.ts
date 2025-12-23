// src/hooks/useMyProfile.ts
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

type Stored = {
  displayName?: string;
  avatarUrl?: string;
};

const LS_PROFILE = "afroconnect.profile";

function readStored(): Stored {
  try {
    const raw = localStorage.getItem(LS_PROFILE);
    if (!raw) return {};
    return JSON.parse(raw) as Stored;
  } catch {
    return {};
  }
}

export function useMyProfile() {
  const { user, status, getMyProfile } = useAuth();
  const [stored, setStored] = useState<Stored>(() => readStored());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onUpdate = () => setStored(readStored());
    window.addEventListener("afroconnect.profileUpdated", onUpdate);
    return () => window.removeEventListener("afroconnect.profileUpdated", onUpdate);
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!user || status !== "authenticated") return;
      setLoading(true);
      try {
        const prof = await getMyProfile();
        if (!alive) return;

        // useAuth already stores to LS, but this ensures first-load is consistent
        if (prof) {
          localStorage.setItem(
            LS_PROFILE,
            JSON.stringify({
              displayName: prof.display_name,
              avatarUrl: prof.avatar_url ?? undefined,
            })
          );
          window.dispatchEvent(new Event("afroconnect.profileUpdated"));
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [user, status, getMyProfile]);

  const displayName =
    stored.displayName ||
    user?.user_metadata?.full_name ||
    user?.email ||
    "Account";

  const avatarUrl = stored.avatarUrl;

  return { displayName, avatarUrl, loading };
}
