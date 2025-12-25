// src/components/AppHeader.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Bell, MessageCircle } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { getCommunityLabel } from "@/lib/location";

const LS_AVATAR_URL = "afroconnect.avatarUrl";
const PROFILE_UPDATED_EVENT = "afroconnect.profileUpdated";

function initials(nameOrEmail: string) {
  const s = (nameOrEmail || "").trim();
  if (!s) return "AC";
  if (s.includes("@")) return s.slice(0, 2).toUpperCase();
  return s
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type Props = {
  onOpenAuth?: () => void;
};

export default function AppHeader({ onOpenAuth }: Props) {
  const navigate = useNavigate();
  const { user, status, signOut } = useAuth() as any;

  const isLoggedIn = !!user && status === "authenticated";

  const [community, setCommunity] = useState(() => getCommunityLabel());
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() =>
    localStorage.getItem(LS_AVATAR_URL)
  );

  const displayName = useMemo(() => {
    try {
      const raw = localStorage.getItem("afroconnect.profile");
      if (raw) {
        const p = JSON.parse(raw) as { displayName?: string };
        if (p.displayName?.trim()) return p.displayName.trim();
      }
    } catch {
      // ignore
    }
    return user?.name || user?.email || user?.phone || "Member";
  }, [user]);

  useEffect(() => {
    const onCommunity = () => setCommunity(getCommunityLabel());
    const onProfile = () => setAvatarUrl(localStorage.getItem(LS_AVATAR_URL));

    window.addEventListener("afroconnect.communityChanged", onCommunity);
    window.addEventListener(PROFILE_UPDATED_EVENT, onProfile);

    return () => {
      window.removeEventListener("afroconnect.communityChanged", onCommunity);
      window.removeEventListener(PROFILE_UPDATED_EVENT, onProfile);
    };
  }, []);

  async function handleLogout() {
    try {
      if (typeof signOut === "function") await signOut();
    } finally {
      navigate("/welcome", { replace: true });
    }
  }

  return (
    <header className="w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
        {/* Left: App + community */}
        <button
          type="button"
          className="min-w-0 flex items-center gap-3 text-left"
          onClick={() => navigate("/welcome")}
          title="Change your community"
        >
          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
            AC
          </div>
          <div className="min-w-0">
            <div className="font-semibold leading-tight">AfroConnect</div>
            <div className="text-xs text-muted-foreground truncate">{community}</div>
          </div>
        </button>

        {/* Right: icons + avatar menu */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Search"
            onClick={() => navigate("/search")}
          >
            <Search className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifications"
            onClick={() => navigate("/notifications")}
          >
            <Bell className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Messages"
            onClick={() => navigate("/messages")}
          >
            <MessageCircle className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="ml-1">
                <Avatar className="h-9 w-9">
                  {avatarUrl ? <AvatarImage src={avatarUrl} /> : null}
                  <AvatarFallback>{initials(displayName)}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2">
                <div className="text-sm font-semibold truncate">{displayName}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {user?.email || user?.phone || ""}
                </div>
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => navigate("/profile")}>My profile</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>Settings</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/welcome")}>Change community</DropdownMenuItem>

              <DropdownMenuSeparator />

              {isLoggedIn ? (
                <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => (onOpenAuth ? onOpenAuth() : navigate("/welcome"))}>
                  Log in / Create account
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
