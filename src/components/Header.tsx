import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Menu, LogIn } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

import AppMenuSheet from "./AppMenuSheet";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Header() {
  const { login, loginStatus, identity } = useInternetIdentity();

  const [menuOpen, setMenuOpen] = useState(false);

  const isLoggingIn = loginStatus === "logging-in";
  const isLoggedIn = !!identity && loginStatus === "success";

  // Basic display name (adjust if your identity has a different shape)
  const displayName = useMemo(() => {
    if (!isLoggedIn) return "Guest";
    // Try common fields safely:
    return (
      (identity as any)?.displayName ||
      (identity as any)?.name ||
      "User"
    );
  }, [identity, isLoggedIn]);

  // Optional profile image (adjust to your real user profile later)
  const avatarUrl = useMemo(() => {
    return (identity as any)?.avatarUrl || "";
  }, [identity]);

  // Community name (you can later read from localStorage + communities if you want)
  const communityName = useMemo(() => {
    // If you store it elsewhere later, replace this.
    return "Aurora, CO";
  }, []);

  return (
    <header className="w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container h-16 flex items-center justify-between">
        {/* LEFT: keep whatever you already had here (logo / brand / location) */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            {/* Replace with your real logo if you have one */}
            <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center font-semibold">
              A
            </div>
            <div className="min-w-0">
              <p className="font-semibold leading-tight truncate">AfroConnect</p>
              <p className="text-xs text-muted-foreground leading-tight truncate">
                Local community
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: Login + Menu moved into header */}
        <div className="flex items-center gap-2">
          {!isLoggedIn ? (
            <Button
              onClick={() => login()}
              disabled={isLoggingIn}
              className="bg-gradient-to-r from-orange-600 to-green-600 hover:opacity-90 transition-opacity"
            >
              {isLoggingIn ? (
                "Connecting..."
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </>
              )}
            </Button>
          ) : (
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex items-center gap-2 rounded-full border px-2 py-1 hover:bg-muted/60 transition"
              title="Open menu"
            >
              <Avatar className="h-8 w-8">
                {avatarUrl ? <AvatarImage src={avatarUrl} /> : null}
                <AvatarFallback>{initials(displayName)}</AvatarFallback>
              </Avatar>
              <Menu className="h-5 w-5" />
            </button>
          )}

          {/* Allow menu for guest too (optional). If you want guest to also open menu, keep this: */}
          {!isLoggedIn && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setMenuOpen(true)}
              title="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      <AppMenuSheet
        open={menuOpen}
        onOpenChange={setMenuOpen}
        displayName={displayName}
        communityName={communityName}
      />
    </header>
  );
}
