// src/components/AppMenuSheet.tsx
import React from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

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
  Search,
  Bell,
  LogOut,
  PlusCircle,
  MapPin,
} from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  displayName: string;
  communityName: string;
  avatarUrl?: string;
  onLogout?: () => void; // optional hook if you want sheet logout to call your auth signOut
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
  onLogout,
}: Props) {
  const navigate = useNavigate();

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {communityName}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* MAIN APP NAV */}
          <div className="px-3 py-3 space-y-1">
            <MenuItem icon={<Home className="h-4 w-4" />} label="Home" onClick={() => go("/")} />
            <MenuItem icon={<Store className="h-4 w-4" />} label="Marketplace" onClick={() => go("/marketplace")} />

            <MenuItem icon={<Building2 className="h-4 w-4" />} label="Businesses" onClick={() => go("/business")} />
            <MenuItem icon={<PlusCircle className="h-4 w-4" />} label="Add a business" onClick={() => go("/add-business")} />

            <MenuItem icon={<Users className="h-4 w-4" />} label="Groups" onClick={() => go("/groups")} />
            <MenuItem icon={<GraduationCap className="h-4 w-4" />} label="Students" onClick={() => go("/students")} />
            <MenuItem icon={<MessageCircle className="h-4 w-4" />} label="Messages" onClick={() => go("/messages")} />
            <MenuItem icon={<CalendarDays className="h-4 w-4" />} label="Events" onClick={() => go("/events")} />

            {/* Optional quick links */}
            <MenuItem icon={<Search className="h-4 w-4" />} label="Search" onClick={() => go("/search")} />
            <MenuItem icon={<Bell className="h-4 w-4" />} label="Notifications" onClick={() => go("/notifications")} />
          </div>

          <Separator />

          {/* ACCOUNT / SETTINGS */}
          <div className="px-3 py-3 space-y-1">
            <MenuItem icon={<User className="h-4 w-4" />} label="My profile" onClick={() => go("/profile")} />
            <MenuItem icon={<Settings className="h-4 w-4" />} label="Settings" onClick={() => go("/settings")} />
            <MenuItem icon={<HelpCircle className="h-4 w-4" />} label="Help Center" onClick={() => go("/help")} />
          </div>

          <Separator />

          {/* COMMUNITY / LOGOUT */}
          <div className="px-3 py-3 space-y-1">
            <MenuItem icon={<MapPin className="h-4 w-4" />} label="Change community" onClick={() => go("/welcome")} />
            <MenuItem
              icon={<LogOut className="h-4 w-4" />}
              label="Log out"
              onClick={() => {
                onOpenChange(false);
                if (onLogout) onLogout();
                else go("/welcome");
              }}
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
