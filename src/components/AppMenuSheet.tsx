// src/components/AppMenuSheet.tsx
import React from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  Home,
  Store,
  Building2,
  Users,
  GraduationCap,
  MessageCircle,
  HelpCircle,
  User,
  CalendarDays,
  Settings,
} from "lucide-react";

export type TabRoute =
  | "home"
  | "marketplace"
  | "businesses"
  | "groups"
  | "students"
  | "messages"
  | "events"
  | "profile"
  | "settings";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  displayName: string;
  communityName: string;
  avatarUrl?: string;

  onNavigate?: (route: TabRoute) => void;
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

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className="w-full flex items-center gap-3 px-3 py-3 rounded-md hover:bg-muted/60 transition text-left"
      onClick={onClick}
    >
      <span className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
        {icon}
      </span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

export default function AppMenuSheet({
  open,
  onOpenChange,
  displayName,
  communityName,
  avatarUrl,
  onNavigate,
}: Props) {
  const nav = (route: TabRoute) => {
    onOpenChange(false);
    onNavigate?.(route);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* Make the sheet a flex column so we can scroll the middle */}
      <SheetContent side="right" className="w-[320px] p-0 flex flex-col">
        {/* Header */}
        <div className="px-4 py-5 shrink-0">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              {avatarUrl ? <AvatarImage src={avatarUrl} /> : null}
              <AvatarFallback>{initials(displayName)}</AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <p className="text-base font-semibold truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{communityName}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* MAIN APP NAV */}
          <div className="px-3 py-3 space-y-1">
            <MenuItem icon={<Home className="h-4 w-4" />} label="Home" onClick={() => nav("home")} />
            <MenuItem icon={<Store className="h-4 w-4" />} label="Marketplace" onClick={() => nav("marketplace")} />
            <MenuItem icon={<Building2 className="h-4 w-4" />} label="Businesses" onClick={() => nav("businesses")} />
            <MenuItem icon={<Users className="h-4 w-4" />} label="Groups" onClick={() => nav("groups")} />
            <MenuItem icon={<GraduationCap className="h-4 w-4" />} label="Students" onClick={() => nav("students")} />
            <MenuItem icon={<MessageCircle className="h-4 w-4" />} label="Messages" onClick={() => nav("messages")} />
            <MenuItem icon={<CalendarDays className="h-4 w-4" />} label="Events" onClick={() => nav("events")} />
          </div>

          <Separator />

          {/* ACCOUNT / SETTINGS (this is what you’re missing) */}
          <div className="px-3 py-3 space-y-1">
            <MenuItem icon={<User className="h-4 w-4" />} label="My profile" onClick={() => nav("profile")} />
            <MenuItem icon={<Settings className="h-4 w-4" />} label="Settings" onClick={() => nav("settings")} />
            <MenuItem
              icon={<HelpCircle className="h-4 w-4" />}
              label="Help Center"
              onClick={() => console.log("Help (next)")}
            />
          </div>
        </div>

        {/* Bottom actions */}
        <div className="px-4 pb-5 pt-2 shrink-0">
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
