// src/components/HomeFeed.tsx
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  MapPin,
  Users,
  Store,
  MessageCircle,
  Building2,
  Heart,
  Send,
  Trash2,
  LogIn,
  MoreHorizontal,
  Video as VideoIcon,
  Plus,
  FileText,
  HelpCircle,
  ShoppingBag,
  CalendarDays,
} from "lucide-react";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";

import CreateMenuSheet, { CreateKind } from "@/components/CreateMenuSheet";
import CreateComposerSheet, { ComposerPayload } from "@/components/CreateComposerSheet";

/* -------------------- Types -------------------- */

type Props = {
  userLocation?: {
    communityId?: string;
    areaId?: string;
  };
};

type MediaItem = {
  id: string;
  kind: "image" | "video";
  url: string;
  name: string;
  persistent: boolean;
};

type CommentItem = {
  id: string;
  authorName: string;
  createdAt: number;
  text: string;
};

type PostType = "post" | "ask" | "sell" | "event";

type PostItem = {
  id: string;
  authorName: string;
  communityLabel: string;
  createdAt: number;
  text: string;
  media: MediaItem[];
  likes: number;
  comments: number;
  commentsList?: CommentItem[];
  postType?: PostType;
  title?: string;
  price?: string;
  when?: string;
  where?: string;
};

/* -------------------- Storage -------------------- */

const LS_PROFILE = "afroconnect.profile";
const LS_POSTS = "afroconnect.posts.v1";
const LS_COMMUNITY_KEY = "afroconnect.communityId";

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function readDisplayName(): string {
  const p = safeParse<{ displayName?: string }>(localStorage.getItem(LS_PROFILE), {});
  return (p.displayName || "Guest").trim() || "Guest";
}

function readPosts(): PostItem[] {
  return safeParse<PostItem[]>(localStorage.getItem(LS_POSTS), []);
}

function savePosts(posts: PostItem[]) {
  localStorage.setItem(LS_POSTS, JSON.stringify(posts));
}

function uid() {
  return crypto.randomUUID();
}

function getCommunityLabelFallback() {
  return localStorage.getItem(LS_COMMUNITY_KEY) || "Aurora, CO";
}

/* -------------------- Feed -------------------- */

type FeedScope = "local" | "global";
type FeedDensity = "comfortable" | "compact";

export default function HomeFeed({ userLocation }: Props) {
  const { identity, login, loginStatus } = useInternetIdentity();
  const isLoggedIn = !!identity && loginStatus === "success";
  const canInteract = isLoggedIn;

  const communityLabel = useMemo(() => getCommunityLabelFallback(), []);

  const [posts, setPosts] = useState<PostItem[]>(() =>
    readPosts().map((p) => ({
      ...p,
      commentsList: p.commentsList ?? [],
      comments: p.comments ?? 0,
      postType: p.postType ?? "post",
    }))
  );

  const [feedScope, setFeedScope] = useState<FeedScope>("local");
  const [feedSearch, setFeedSearch] = useState("");

  const [density, setDensity] = useState<FeedDensity>(() => {
    const d = localStorage.getItem("afroconnect.feedDensity");
    return d === "compact" ? "compact" : "comfortable";
  });

  useEffect(() => {
    localStorage.setItem("afroconnect.feedDensity", density);
  }, [density]);

  useEffect(() => {
    savePosts(posts);
  }, [posts]);

  const visiblePosts = useMemo(() => {
    const term = feedSearch.trim().toLowerCase();
    const matches = (p: PostItem) =>
      !term ||
      `${p.authorName} ${p.text} ${p.communityLabel}`.toLowerCase().includes(term);

    const local = posts.filter((p) => p.communityLabel === communityLabel && matches(p));
    const global = posts.filter(matches);

    return feedScope === "global" || (term && local.length === 0) ? global : local;
  }, [posts, feedSearch, feedScope, communityLabel]);

  /* -------------------- Render -------------------- */

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 space-y-6">
      <Card className="border shadow-sm rounded-2xl">
        <CardHeader className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Community Feed</h2>
            </div>
            <span className="text-sm text-muted-foreground">{communityLabel}</span>
          </div>

          {/* ✅ ONE LINE TOGGLES */}
          <div className="flex flex-wrap items-center gap-2">
            <Toggle active={feedScope === "local"} onClick={() => setFeedScope("local")}>
              Local
            </Toggle>
            <Toggle active={feedScope === "global"} onClick={() => setFeedScope("global")}>
              Global
            </Toggle>
            <Toggle active={density === "comfortable"} onClick={() => setDensity("comfortable")}>
              Comfortable
            </Toggle>
            <Toggle active={density === "compact"} onClick={() => setDensity("compact")}>
              Compact
            </Toggle>
          </div>

          {/* ✅ SEARCH BELOW */}
          <Input
            value={feedSearch}
            onChange={(e) => setFeedSearch(e.target.value)}
            placeholder={
              feedScope === "local" ? "Search local posts…" : "Search global posts…"
            }
            className="w-full"
          />
        </CardHeader>

        <CardContent className="space-y-4">
          {visiblePosts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No posts found
            </div>
          ) : (
            visiblePosts.map((p) => (
              <Card key={p.id} className="border rounded-2xl">
                <CardContent className={density === "compact" ? "p-3" : "p-5"}>
                  <p className="text-sm font-semibold">{p.authorName}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.communityLabel} · {formatTimeAgo(p.createdAt)}
                  </p>
                  <p className="mt-3 text-sm whitespace-pre-wrap">{p.text}</p>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------- Helpers -------------------- */

function Toggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-4 py-1.5 rounded-full text-sm border transition",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background hover:bg-muted/50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function formatTimeAgo(ts: number) {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

