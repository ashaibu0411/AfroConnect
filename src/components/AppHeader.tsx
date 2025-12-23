// src/components/AppHeader.tsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, Menu, MessageCircle, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useAuth } from "@/hooks/useAuth";
import { getCommunityLabel } from "@/lib/location";

const LS_PROFILE = "afroconnect.profile";

function readProfileLocal() {
  try {
    return JSON.parse(localStorage.getItem(LS_PROFILE) || "{}") as {
      displayName?: string;
      avatarUrl?: string;
    };
  } catch {
    return {};
  }
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function AppHeader({
  onOpenAuth,
  onOpenMenu,
}: {
  onOpenAuth?: () => void;
  onOpenMenu?: () => void;
}) {
  const { user, status, signOut } = useAuth();
  const isLoggedIn = !!user && status === "authenticated";

  const routerLocation = useLocation();
  const navigate = useNavigate();

  // Reactive community label
  const [communityLabel, setCommunityLabel] = useState(() => getCommunityLabel());
  useEffect(() => {
    const handler = () => setCommunityLabel(getCommunityLabel());
    window.addEventListener("afroconnect.communityChanged", handler);
    return () => window.removeEventListener("afroconnect.communityChanged", handler);
  }, []);

  // Reactive local profile (displayName + avatarUrl)
  const [profile, setProfile] = useState(() => readProfileLocal());
  useEffect(() => {
    const handler = () => setProfile(readProfileLocal());
    window.addEventListener("afroconnect.profileUpdated", handler);
    return () => window.removeEventListener("afroconnect.profileUpdated", handler);
  }, []);

  const slogan = "Connecting Africans Globally, Building Communities";

  async function handleLogout() {
    await signOut();
    navigate("/welcome", { replace: true });
  }

  // LOGGED OUT HEADER (Welcome)
  if (!isLoggedIn) {
    return (
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-2xl bg-orange-100 flex items-center justify-center font-bold shrink-0">
              AC
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-sm font-semibold truncate">AfroConnect</div>
              <div className="text-xs text-muted-foreground truncate">{slogan}</div>
            </div>
          </div>

          <Button className="rounded-xl" onClick={onOpenAuth}>
            Log in / Create account
          </Button>
        </div>
      </header>
    );
  }

  // LOGGED IN HEADER (All app pages)
  const displayName = profile.displayName?.trim() || "My account";
  const avatarUrl = profile.avatarUrl;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
        {/* LEFT: community label (click to change location) */}
        <button
          className="flex items-center gap-3 rounded-xl px-2 py-1 hover:bg-muted/40 transition min-w-0"
          onClick={() => navigate("/welcome")}
          title="Change location"
          type="button"
        >
          <div className="h-9 w-9 rounded-2xl bg-orange-100 flex items-center justify-center font-bold shrink-0">
            AC
          </div>
          <div className="leading-tight text-left min-w-0">
            <div className="text-sm font-semibold truncate">AfroConnect</div>
            <div className="text-xs text-muted-foreground truncate">{communityLabel}</div>
          </div>
        </button>

        {/* RIGHT: icons + avatar + menu + logout */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            aria-label="Search"
            onClick={() => navigate("/search")}
          >
            <Search className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            aria-label="Notifications"
            onClick={() => navigate("/notifications")}
          >
            <Bell className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            aria-label="Messages"
            onClick={() => navigate("/messages")}
          >
            <MessageCircle className="h-5 w-5" />
          </Button>

          {/* Avatar pill */}
          <div className="flex items-center gap-2 rounded-xl border px-2 py-1.5">
            <Avatar className="h-8 w-8">
              {avatarUrl ? <AvatarImage src={avatarUrl} /> : null}
              <AvatarFallback>{initials(displayName || user?.email || "User")}</AvatarFallback>
            </Avatar>

            <div className="hidden sm:block text-sm max-w-[160px] truncate">
              {displayName}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              aria-label="Menu"
              onClick={() => {
                if (onOpenMenu) onOpenMenu();
                else navigate("/menu");
              }}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          <Button variant="outline" className="rounded-xl" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </div>
    </header>
  );
}
