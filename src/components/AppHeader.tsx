// src/components/AppHeader.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, MessageCircle, Menu, ChevronDown, MapPin, Search } from "lucide-react";

type Props = {
  locationLabel: string;

  displayName: string;
  avatarUrl?: string;

  isLoggedIn: boolean;
  isLoggingIn: boolean;

  onOpenLocation: () => void;
  onOpenNotifications: () => void;
  onGoMessages: () => void;
  onOpenSearch: () => void;

  onLogin: () => void;
  onOpenMenu: () => void;
};

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
  locationLabel,
  displayName,
  avatarUrl,
  isLoggedIn,
  isLoggingIn,
  onOpenLocation,
  onOpenNotifications,
  onGoMessages,
  onOpenSearch,
  onLogin,
  onOpenMenu,
}: Props) {
  return (
    <header className="border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70 sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between h-14 px-4">
        {/* LEFT: City/Area selector */}
        <button
          type="button"
          onClick={onOpenLocation}
          className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted/60 transition"
          title="Change location"
        >
          <span className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <MapPin className="h-4 w-4" />
          </span>

          <span className="font-semibold text-sm max-w-[220px] truncate">{locationLabel}</span>

          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* RIGHT */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" title="Search" onClick={onOpenSearch}>
            <Search className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" title="Notifications" onClick={onOpenNotifications}>
            <Bell className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" title="Messages" onClick={onGoMessages}>
            <MessageCircle className="h-5 w-5" />
          </Button>

          {!isLoggedIn ? (
            <>
              <Button
                onClick={onLogin}
                disabled={isLoggingIn}
                className="bg-gradient-to-r from-orange-600 to-green-600 hover:opacity-90 transition-opacity"
              >
                {isLoggingIn ? "Connecting..." : "Login"}
              </Button>

              <Button variant="outline" size="icon" title="Menu" onClick={onOpenMenu}>
                <Menu className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <button type="button" onClick={onOpenMenu} className="rounded-full" title="Open menu">
              <Avatar className="h-9 w-9">
                {avatarUrl ? <AvatarImage src={avatarUrl} /> : null}
                <AvatarFallback>{initials(displayName)}</AvatarFallback>
              </Avatar>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
