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

import CreateMenuSheet, { CreateKind } from "@/components/CreateMenuSheet";
import CreateComposerSheet, { ComposerPayload } from "@/components/CreateComposerSheet";
import { useAuth } from "@/hooks/useAuth";

type Props = {
  userLocation?: {
    communityId?: string;
    areaId?: string;
  };
  onRequireLogin?: () => void;
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

const LS_PROFILE = "afroconnect.profile";
const LS_POSTS = "afroconnect.posts.v1";
const LS_COMMUNITY_KEY = "afroconnect.communityId";

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
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
  return (crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`) as string;
}

function getCommunityLabelFallback() {
  const cid = localStorage.getItem(LS_COMMUNITY_KEY);
  if (!cid) return "Aurora, CO";
  return cid;
}

async function shareTextOrUrl(payload: { title?: string; text?: string; url?: string }) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav: any = navigator;
    if (nav?.share) {
      await nav.share(payload);
      return true;
    }
  } catch {
    // ignore cancel
  }

  const str = [payload.title, payload.text, payload.url].filter(Boolean).join("\n");
  try {
    await navigator.clipboard.writeText(str);
    toast.success("Copied to clipboard.");
    return true;
  } catch {
    toast.info("Share not available. Copy manually.");
    return false;
  }
}

type FeedScope = "local" | "global";
type FeedDensity = "comfortable" | "compact";

export default function HomeFeed({ userLocation, onRequireLogin }: Props) {
  const { user, status } = useAuth();

  const isLoggedIn = !!user && status === "authenticated";
  const canInteract = isLoggedIn;

  const requestLogin = () => {
    if (onRequireLogin) onRequireLogin();
    else toast.info("Login is required.");
  };

  const communityLabel = useMemo(() => {
    return getCommunityLabelFallback();
  }, [userLocation?.communityId, userLocation?.areaId]);

  const [posts, setPosts] = useState<PostItem[]>(() => {
    const loaded = readPosts();
    return loaded.map((p) => ({
      ...p,
      commentsList: p.commentsList ?? [],
      comments: p.comments ?? (p.commentsList?.length ?? 0),
      postType: p.postType ?? "post",
    }));
  });

  const [feedScope, setFeedScope] = useState<FeedScope>("local");
  const [feedSearch, setFeedSearch] = useState("");

  const [density, setDensity] = useState<FeedDensity>(() => {
    const saved = localStorage.getItem("afroconnect.feedDensity") as FeedDensity | null;
    return saved === "compact" || saved === "comfortable" ? saved : "comfortable";
  });

  useEffect(() => {
    localStorage.setItem("afroconnect.feedDensity", density);
  }, [density]);

  const [openThread, setOpenThread] = useState(false);
  const [threadPostId, setThreadPostId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");

  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerKind, setComposerKind] = useState<CreateKind>("post");

  useEffect(() => {
    savePosts(posts);
  }, [posts]);

  const currentUserName = useMemo(() => readDisplayName(), [isLoggedIn]);

  const activeThreadPost = useMemo(() => {
    if (!threadPostId) return null;
    return posts.find((p) => p.id === threadPostId) ?? null;
  }, [threadPostId, posts]);

  const visiblePosts = useMemo(() => {
    const term = feedSearch.trim().toLowerCase();
    const matchesTerm = (p: PostItem) => {
      if (!term) return true;
      const hay = `${p.authorName} ${p.communityLabel} ${p.text} ${p.title ?? ""} ${p.where ?? ""}`.toLowerCase();
      return hay.includes(term);
    };

    const localOnly = posts.filter((p) => p.communityLabel === communityLabel && matchesTerm(p));
    const globalAll = posts.filter((p) => matchesTerm(p));

    if (feedScope === "global") return globalAll;
    if (localOnly.length === 0 && term) return globalAll;
    return localOnly;
  }, [posts, feedSearch, feedScope, communityLabel]);

  function openComments(postId: string) {
    if (!canInteract) return requestLogin();
    setThreadPostId(postId);
    setCommentDraft("");
    setOpenThread(true);
  }

  function submitComment() {
    if (!canInteract) return requestLogin();
    if (!threadPostId) return;
    const txt = commentDraft.trim();
    if (!txt) return;

    const c: CommentItem = {
      id: uid(),
      authorName: readDisplayName(),
      createdAt: Date.now(),
      text: txt,
    };

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== threadPostId) return p;
        const list = [...(p.commentsList ?? []), c];
        return { ...p, commentsList: list, comments: list.length };
      })
    );

    setCommentDraft("");
  }

  function toggleLike(postId: string) {
    if (!canInteract) return requestLogin();
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1 } : p)));
  }

  function deletePost(postId: string) {
    if (!canInteract) return;
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    toast.success("Post deleted.");
  }

  async function sharePost(p: PostItem) {
    if (!canInteract) return requestLogin();
    const preview = (p.text || "").slice(0, 180);
    await shareTextOrUrl({
      title: `AfroConnect · ${p.communityLabel}`,
      text: `${p.authorName}: ${preview}${preview.length >= 180 ? "…" : ""}`,
      url: window.location.href,
    });
  }

  function typeChip(t?: PostType) {
    switch (t) {
      case "ask":
        return { label: "Ask", icon: <HelpCircle className="h-3.5 w-3.5" /> };
      case "sell":
        return { label: "For Sale", icon: <ShoppingBag className="h-3.5 w-3.5" /> };
      case "event":
        return { label: "Event", icon: <CalendarDays className="h-3.5 w-3.5" /> };
      default:
        return { label: "Post", icon: <FileText className="h-3.5 w-3.5" /> };
    }
  }

  function onFabClick() {
    if (!canInteract) return requestLogin();
    setCreateMenuOpen(true);
  }

  function onPickCreateKind(k: CreateKind) {
    setCreateMenuOpen(false);
    setComposerKind(k);
    setComposerOpen(true);
  }

  function onComposerSubmit(payload: ComposerPayload) {
    const authorName = readDisplayName();

    const newPost: PostItem = {
      id: uid(),
      authorName,
      communityLabel,
      createdAt: Date.now(),
      text: payload.text,
      media: payload.media,
      likes: 0,
      comments: 0,
      commentsList: [],
      postType: payload.kind,
      title: payload.title,
      price: payload.price,
      when: payload.when,
      where: payload.where,
    };

    setPosts((prev) => [newPost, ...prev]);
  }

  const isGuest = !isLoggedIn;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 space-y-6 relative">
      {/* GUEST TOP CARD */}
      {isGuest && (
        <Card className="border bg-white/70 backdrop-blur shadow-sm rounded-2xl">
          <CardContent className="p-8 text-center space-y-6">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Welcome to AfroConnect</h1>

            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              A vibrant social platform connecting Africans globally through community, culture and business. Explore
              public posts from different regions or login to unlock full access.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
              <Feature icon={<Users className="h-5 w-5" />} label="Community Feeds" />
              <Feature icon={<Users className="h-5 w-5" />} label="Interest Groups" />
              <Feature icon={<Building2 className="h-5 w-5" />} label="Business Directory" />
              <Feature icon={<Store className="h-5 w-5" />} label="Marketplace" />
              <Feature icon={<MessageCircle className="h-5 w-5" />} label="Direct Messages" />
            </div>

            <p className="text-sm text-muted-foreground">
              Current community: <strong>{communityLabel}</strong>
            </p>

            <Button onClick={requestLogin} className="bg-gradient-to-r from-orange-600 to-green-600 hover:opacity-90">
              <LogIn className="h-4 w-4 mr-2" />
              Login to post
            </Button>
          </CardContent>
        </Card>
      )}

      {/* COMMUNITY FEED */}
      <Card className="border shadow-sm rounded-2xl">
        <CardHeader className="space-y-3">
          <div className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Community Feed</h2>
            </div>
            <span className="text-sm text-muted-foreground">{communityLabel}</span>
          </div>

          {/* ONE LINE: Local/Global/Comfortable/Compact */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFeedScope("local")}
              className={[
                "px-4 py-1.5 rounded-full text-sm border transition",
                feedScope === "local"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted/50",
              ].join(" ")}
            >
              Local
            </button>
            <button
              type="button"
              onClick={() => setFeedScope("global")}
              className={[
                "px-4 py-1.5 rounded-full text-sm border transition",
                feedScope === "global"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted/50",
              ].join(" ")}
            >
              Global
            </button>

            <div className="w-px h-6 bg-border mx-1 hidden sm:block" />

            <button
              type="button"
              onClick={() => setDensity("comfortable")}
              className={[
                "px-4 py-1.5 rounded-full text-sm border transition",
                density === "comfortable"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted/50",
              ].join(" ")}
            >
              Comfortable
            </button>
            <button
              type="button"
              onClick={() => setDensity("compact")}
              className={[
                "px-4 py-1.5 rounded-full text-sm border transition",
                density === "compact"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted/50",
              ].join(" ")}
            >
              Compact
            </button>
          </div>

          {/* SEARCH BELOW */}
          <Input
            value={feedSearch}
            onChange={(e) => setFeedSearch(e.target.value)}
            placeholder={feedScope === "local" ? "Search local posts…" : "Search global posts…"}
            className="w-full sm:max-w-[420px]"
          />

          {feedScope === "local" && feedSearch.trim() ? (
            <div className="text-xs text-muted-foreground">
              Local search first. If nothing is found locally, AfroConnect extends to global automatically.
            </div>
          ) : null}
        </CardHeader>

        <CardContent className="space-y-4">
          {visiblePosts.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-lg font-medium">No posts found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {feedScope === "local" ? "Try another search, or switch to Global." : "Try another search term."}
              </p>
              {!isLoggedIn && (
                <Button className="mt-4" onClick={requestLogin}>
                  Login to Post
                </Button>
              )}
            </div>
          ) : (
            visiblePosts.map((p) => {
              const isMine = canInteract && p.authorName === currentUserName && currentUserName !== "Guest";
              const commentCount = p.commentsList?.length ?? p.comments ?? 0;

              const chip = typeChip(p.postType);
              const latest = (p.commentsList ?? []).slice(density === "compact" ? -1 : -2);

              return (
                <Card key={p.id} className="border rounded-2xl overflow-hidden">
                  <CardContent className={density === "compact" ? "p-3" : "p-5"}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <AvatarCircle name={p.authorName} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold truncate">{p.authorName}</p>

                            <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full bg-muted text-muted-foreground">
                              {chip.icon}
                              {chip.label}
                            </span>
                          </div>

                          <p className="text-xs text-muted-foreground truncate">
                            {p.communityLabel} · {formatTimeAgo(p.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isMine ? (
                          <Button variant="outline" size="sm" onClick={() => deletePost(p.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="More"
                            onClick={() => toast.info("Next: hide/report/mute actions (MVP).")}
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {(p.title || p.price || p.when || p.where) && (
                      <div className="mt-3 rounded-xl border bg-muted/20 p-3 space-y-1">
                        {p.title ? <div className="font-semibold">{p.title}</div> : null}
                        {p.price ? <div className="text-sm text-muted-foreground">Price: {p.price}</div> : null}
                        {p.when ? <div className="text-sm text-muted-foreground">When: {p.when}</div> : null}
                        {p.where ? <div className="text-sm text-muted-foreground">Where: {p.where}</div> : null}
                      </div>
                    )}

                    {p.text ? (
                      <p className={["mt-3 whitespace-pre-wrap leading-relaxed", "text-sm"].join(" ")}>{p.text}</p>
                    ) : null}

                    {p.media.length > 0 && (
                      <div className={["mt-3 grid gap-3", p.media.length > 1 ? "grid-cols-2" : "grid-cols-1"].join(" ")}>
                        {p.media.map((m) =>
                          m.kind === "image" ? (
                            <img
                              key={m.id}
                              src={m.url}
                              alt={m.name}
                              className={[
                                "w-full rounded-xl border object-cover",
                                density === "compact" ? "max-h-[220px]" : "max-h-[360px]",
                              ].join(" ")}
                            />
                          ) : (
                            <video
                              key={m.id}
                              src={m.url}
                              controls
                              className={[
                                "w-full rounded-xl border bg-black",
                                density === "compact" ? "max-h-[220px]" : "max-h-[360px]",
                              ].join(" ")}
                            />
                          )
                        )}
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <Heart className="h-4 w-4" /> {p.likes}
                      </span>

                      <button
                        type="button"
                        className="inline-flex items-center gap-2 hover:underline underline-offset-4"
                        onClick={() => openComments(p.id)}
                      >
                        <MessageCircle className="h-4 w-4" /> {commentCount}
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <Button variant="outline" className="w-full" disabled={!canInteract} onClick={() => toggleLike(p.id)}>
                        <Heart className="h-4 w-4 mr-2" />
                        Like
                      </Button>

                      <Button variant="outline" className="w-full" disabled={!canInteract} onClick={() => openComments(p.id)}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Comment
                      </Button>

                      <Button variant="outline" className="w-full" disabled={!canInteract} onClick={() => sharePost(p)}>
                        <Send className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>

                    {latest.length > 0 && (
                      <div className="mt-3 border rounded-2xl bg-muted/25 p-3 space-y-2">
                        {latest.map((c) => (
                          <div key={c.id} className="text-sm">
                            <span className="font-semibold">{c.authorName}</span>{" "}
                            <span className="text-muted-foreground text-xs">· {formatTimeAgo(c.createdAt)}</span>
                            <div className="text-sm mt-1 line-clamp-2 whitespace-pre-wrap">{c.text}</div>
                          </div>
                        ))}

                        {commentCount > (density === "compact" ? 1 : 2) ? (
                          <button
                            type="button"
                            className="text-xs text-primary underline underline-offset-4"
                            onClick={() => openComments(p.id)}
                          >
                            View all comments
                          </button>
                        ) : null}
                      </div>
                    )}

                    {!canInteract && (
                      <div className="mt-3">
                        <Button size="sm" onClick={requestLogin}>
                          Login to interact
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* FAB */}
      <button
        type="button"
        onClick={onFabClick}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-95 active:scale-95 transition"
        title="Create"
      >
        <Plus className="h-6 w-6" />
      </button>

      <CreateMenuSheet open={createMenuOpen} onOpenChange={setCreateMenuOpen} onPick={onPickCreateKind} />

      <CreateComposerSheet
        open={composerOpen}
        onOpenChange={setComposerOpen}
        kind={composerKind}
        communityLabel={communityLabel}
        canInteract={canInteract}
        onRequireLogin={requestLogin}
        onSubmit={onComposerSubmit}
      />

      <Sheet open={openThread} onOpenChange={setOpenThread}>
        <SheetContent side="bottom" className="p-0 sm:max-w-none">
          <div className="p-4 border-b">
            <SheetHeader>
              <SheetTitle>Comments</SheetTitle>
            </SheetHeader>
            {activeThreadPost ? (
              <p className="text-xs text-muted-foreground mt-1">
                {activeThreadPost.authorName} · {formatTimeAgo(activeThreadPost.createdAt)}
              </p>
            ) : null}
          </div>

          <div className="p-4 space-y-3 max-h-[60vh] overflow-auto">
            {activeThreadPost ? (
              <>
                <Card className="border rounded-xl">
                  <CardContent className="p-4 space-y-2">
                    {activeThreadPost.text ? (
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{activeThreadPost.text}</p>
                    ) : null}

                    {activeThreadPost.media?.length ? (
                      <div className="grid grid-cols-3 gap-2">
                        {activeThreadPost.media.slice(0, 6).map((m) =>
                          m.kind === "image" ? (
                            <img
                              key={m.id}
                              src={m.url}
                              alt={m.name}
                              className="h-20 w-full rounded-lg border object-cover"
                            />
                          ) : (
                            <div key={m.id} className="h-20 w-full rounded-lg border bg-black flex items-center justify-center">
                              <VideoIcon className="h-5 w-5 text-white/80" />
                            </div>
                          )
                        )}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                <div className="flex gap-2 items-center">
                  <Input
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    placeholder="Write a comment…"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitComment();
                    }}
                  />
                  <Button onClick={submitComment} disabled={!commentDraft.trim()}>
                    Post
                  </Button>
                </div>

                <div className="space-y-2">
                  {(activeThreadPost.commentsList ?? []).length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-6">No comments yet.</div>
                  ) : (
                    [...(activeThreadPost.commentsList ?? [])]
                      .slice()
                      .reverse()
                      .map((c) => (
                        <div key={c.id} className="border rounded-xl p-3 bg-background">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold truncate">{c.authorName}</p>
                            <p className="text-xs text-muted-foreground shrink-0">{formatTimeAgo(c.createdAt)}</p>
                          </div>
                          <p className="text-sm mt-2 whitespace-pre-wrap leading-relaxed">{c.text}</p>
                        </div>
                      ))
                  )}
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Thread not found.</div>
            )}
          </div>

          <div className="p-4 border-t flex justify-end">
            <Button variant="outline" onClick={() => setOpenThread(false)}>
              Close
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">{icon}</span>
      <span className="font-medium">{label}</span>
    </div>
  );
}

function initials(name: string) {
  return (name || "U")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function AvatarCircle({ name }: { name: string }) {
  return (
    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-semibold text-sm shrink-0">
      {initials(name)}
    </div>
  );
}

function formatTimeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}
