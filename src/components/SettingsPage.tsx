// src/components/SettingsPage.tsx
import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import {
  ArrowLeft,
  ChevronRight,
  MapPin,
  Bell,
  Shield,
  Eye,
  User,
  Lock,
  FileText,
  HelpCircle,
  LogOut,
  Moon,
  Smartphone,
  MessageCircle,
  Heart,
  Megaphone,
} from "lucide-react";

import { toast } from "sonner";

type Props = {
  communityLabel: string;
  isLoggedIn: boolean;
  displayName: string;

  onBack: () => void;
  onLogout: () => void;
};

type SettingsState = {
  // Notifications
  notifPosts: boolean;
  notifComments: boolean;
  notifMessages: boolean;
  notifEvents: boolean;

  // Feed / Experience
  autoplayVideos: boolean;
  reduceMotion: boolean;

  // Privacy / Safety
  showOnlineStatus: boolean;
  allowDMsFromAnyone: boolean;
  hideProfileFromSearch: boolean;

  // Appearance
  darkMode: boolean;
};

const LS_SETTINGS = "afroconnect.settings.v1";

const DEFAULT_SETTINGS: SettingsState = {
  notifPosts: true,
  notifComments: true,
  notifMessages: true,
  notifEvents: true,

  autoplayVideos: true,
  reduceMotion: false,

  showOnlineStatus: true,
  allowDMsFromAnyone: true,
  hideProfileFromSearch: false,

  darkMode: false,
};

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-1">
      <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {children}
      </p>
    </div>
  );
}

function Row({
  icon,
  title,
  subtitle,
  right,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const clickable = !!onClick && !disabled;

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={[
        "w-full text-left px-4 py-4 flex items-center gap-3 transition",
        "active:scale-[0.998]",
        disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-muted/40",
      ].join(" ")}
    >
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{title}</p>
        {subtitle ? (
          <p className="text-xs text-muted-foreground truncate mt-1">{subtitle}</p>
        ) : null}
      </div>

      <div className="shrink-0 flex items-center gap-2">
        {right}
        {clickable ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : null}
      </div>
    </button>
  );
}

export default function SettingsPage({
  communityLabel,
  isLoggedIn,
  displayName,
  onBack,
  onLogout,
}: Props) {
  const [s, setS] = useState<SettingsState>(() =>
    safeParse<SettingsState>(localStorage.getItem(LS_SETTINGS), DEFAULT_SETTINGS)
  );

  // Persist settings
  useEffect(() => {
    localStorage.setItem(LS_SETTINGS, JSON.stringify(s));
  }, [s]);

  // Simple dark mode toggle
  useEffect(() => {
    const root = document.documentElement;
    if (s.darkMode) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [s.darkMode]);

  const subtitle = useMemo(() => `${displayName} · ${communityLabel}`, [displayName, communityLabel]);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-50 via-background to-emerald-50">
      <div className="container max-w-4xl py-6 space-y-5">
        {/* TOP BAR */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={onBack} title="Back">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Settings</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-2 truncate">{subtitle}</p>
          </div>
        </div>

        {/* ACCOUNT SETTINGS (Nextdoor-style list) */}
        <Card className="border rounded-2xl shadow-sm bg-white/70 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Account settings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Row
              icon={<User className="h-5 w-5" />}
              title="Account settings"
              subtitle={isLoggedIn ? "Profile, security, and sessions" : "Login to manage your account"}
              onClick={() => toast.info("Next: link to Profile + security pages.")}
            />
            <Separator />
            <Row
              icon={<Shield className="h-5 w-5" />}
              title="Privacy settings"
              subtitle="Control how people find and contact you"
              onClick={() => toast.info("Next: build Privacy details page.")}
            />
            <Separator />
            <Row
              icon={<Bell className="h-5 w-5" />}
              title="Notifications"
              subtitle="Customize what you get notified about"
              onClick={() => toast.info("Below toggles already work (local).")}
            />
            <Separator />
            <Row
              icon={<FileText className="h-5 w-5" />}
              title="Feed preferences"
              subtitle="What you see in your community feed"
              onClick={() => toast.info("Next: feed filters + muted keywords.")}
            />
            <Separator />
            <Row
              icon={<Moon className="h-5 w-5" />}
              title="Appearance"
              subtitle={s.darkMode ? "Dark mode" : "Light mode"}
              right={
                <Switch
                  checked={s.darkMode}
                  onCheckedChange={(v) => setS((p) => ({ ...p, darkMode: v }))}
                />
              }
            />
            <Separator />
            <Row
              icon={<Smartphone className="h-5 w-5" />}
              title="Add business page"
              subtitle="Create a page for your business (coming next)"
              onClick={() => toast.info("Next: business page creation flow.")}
            />
          </CardContent>
        </Card>

        {/* QUICK TOGGLES */}
        <Card className="border rounded-2xl shadow-sm bg-white/70 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Quick toggles</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Row
              icon={<Megaphone className="h-5 w-5" />}
              title="Posts in my community"
              subtitle="Trending posts, important updates"
              right={
                <Switch
                  checked={s.notifPosts}
                  onCheckedChange={(v) => setS((p) => ({ ...p, notifPosts: v }))}
                />
              }
            />
            <Separator />
            <Row
              icon={<MessageCircle className="h-5 w-5" />}
              title="Comments & replies"
              subtitle="When people reply to your posts"
              right={
                <Switch
                  checked={s.notifComments}
                  onCheckedChange={(v) => setS((p) => ({ ...p, notifComments: v }))}
                />
              }
            />
            <Separator />
            <Row
              icon={<Lock className="h-5 w-5" />}
              title="Messages"
              subtitle="New message notifications"
              right={
                <Switch
                  checked={s.notifMessages}
                  onCheckedChange={(v) => setS((p) => ({ ...p, notifMessages: v }))}
                />
              }
            />
            <Separator />
            <Row
              icon={<Heart className="h-5 w-5" />}
              title="Autoplay videos"
              subtitle="Automatically play videos in the feed"
              right={
                <Switch
                  checked={s.autoplayVideos}
                  onCheckedChange={(v) => setS((p) => ({ ...p, autoplayVideos: v }))}
                />
              }
            />
            <Separator />
            <Row
              icon={<Shield className="h-5 w-5" />}
              title="Reduce motion"
              subtitle="Less animation, smoother experience"
              right={
                <Switch
                  checked={s.reduceMotion}
                  onCheckedChange={(v) => setS((p) => ({ ...p, reduceMotion: v }))}
                />
              }
            />
            <Separator />
            <Row
              icon={<Eye className="h-5 w-5" />}
              title="Show online status"
              subtitle="Let others see when you’re active"
              right={
                <Switch
                  checked={s.showOnlineStatus}
                  onCheckedChange={(v) => setS((p) => ({ ...p, showOnlineStatus: v }))}
                />
              }
            />
          </CardContent>
        </Card>

        {/* HELP CENTER / POLICY LINKS */}
        <Card className="border rounded-2xl shadow-sm bg-white/70 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Help center</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Row
              icon={<FileText className="h-5 w-5" />}
              title="Privacy policy"
              subtitle="How we handle your data (coming next)"
              onClick={() => toast.info("Next: create Privacy Policy page route.")}
            />
            <Separator />
            <Row
              icon={<FileText className="h-5 w-5" />}
              title="Member agreement"
              subtitle="Community rules & terms (coming next)"
              onClick={() =>
                toast.info(
                  "Member agreement: no sexual content, violence promotion, harassment, hate, or illegal content."
                )
              }
            />
            <Separator />
            <Row
              icon={<HelpCircle className="h-5 w-5" />}
              title="Share this app"
              subtitle="Invite friends (coming next)"
              onClick={() => toast.info("Next: add share sheet.")}
            />
            <Separator />
            <Row
              icon={<Shield className="h-5 w-5" />}
              title="Do Not Sell or Share My Personal Data"
              subtitle="Privacy controls (coming next)"
              onClick={() => toast.info("Next: privacy request flow.")}
            />
          </CardContent>
        </Card>

        {/* LOG OUT */}
        <Card className="border rounded-2xl shadow-sm bg-white/70 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Log out</p>
              <p className="text-xs text-muted-foreground truncate">
                You can still browse community posts as a guest.
              </p>
            </div>

            <Button variant="outline" onClick={onLogout} disabled={!isLoggedIn} className="shrink-0">
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </Button>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground py-8">
          © {new Date().getFullYear()} AfroConnect.
        </div>
      </div>
    </div>
  );
}
