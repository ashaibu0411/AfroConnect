// src/components/HomeFeed.tsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { getCommunityLabel } from "@/lib/location";

import CreateMenuSheet, { type CreateKind } from "@/components/CreateMenuSheet";
import CreateComposerSheet from "@/components/CreateComposerSheet";
import type { ComposerPayload } from "@/components/CreateComposerSheet";

type Props = {
  onRequireLogin?: () => void;
  onGoToWelcome?: () => void;
};

type PostItem = {
  id: string;
  authorName?: string;
  content: string;
  communityLabel: string;
  createdAt: number;
  likes?: number;

  // Optional: basic metadata if you want later
  kind?: CreateKind; // "post" | "ask" | "sell" | "event"
  title?: string;
  price?: string;
  when?: string;
  where?: string;
  media?: { kind: "image" | "video"; url: string; name: string }[];
};

const LS_POSTS = "afroconnect.posts.v1";
const LS_PROFILE = "afroconnect.profile";
const [createMenuOpen, setCreateMenuOpen] = useState(false);

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function savePosts(posts: PostItem[]) {
  localStorage.setItem(LS_POSTS, JSON.stringify(posts));
}

function readPosts(): PostItem[] {
  return safeParse<PostItem[]>(localStorage.getItem(LS_POSTS), []);
}

function uid() {
  return (crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`) as string;
}

function readDisplayNameFallback() {
  try {
    const p = JSON.parse(localStorage.getItem(LS_PROFILE) || "{}") as { displayName?: string };
    if (p.displayName?.trim()) return p.displayName.trim();
  } catch {
    // ignore
  }
  return null;
}

export default function HomeFeed({ onRequireLogin, onGoToWelcome }: Props) {
  const { user, status } = useAuth();
  const isLoggedIn = !!user && status === "authenticated";

  const [communityLabel, setCommunityLabel] = useState(() => getCommunityLabel());
  const [tab, setTab] = useState<"local" | "global">("local");
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [query, setQuery] = useState("");

  // Composer state
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerKind, setComposerKind] = useState<CreateKind>("post");

  const [posts, setPosts] = useState<PostItem[]>(() => {
    const existing = readPosts();
    if (existing.length) return existing;
    <CreateMenuSheet
  open={createMenuOpen}
  onOpenChange={setCreateMenuOpen}
  onPick={(k) => {
    setCreateMenuOpen(false);
    setComposerKind(k);
    setComposerOpen(true);
  }}
/>
    // Seed sample posts (demo only)
    const seeded: PostItem[] = [
      {
        id: uid(),
        authorName: "Guest",
        content:
          "Welcome to AfroConnect. Switch your location on the Welcome screen to preview other communities.",
        communityLabel: "Colorado, United States",
        createdAt: Date.now() - 1000 * 60 * 60 * 10,
        likes: 0,
        kind: "post",
      },
      {
        id: uid(),
        authorName: "Zaq",
        content: "Things are working",
        communityLabel: "Colorado, United States",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
        likes: 1,
        kind: "post",
      },
    ];
    savePosts(seeded);
    return seeded;
  });

  useEffect(() => savePosts(posts), [posts]);

  // Update community label when selection changes
  useEffect(() => {
    const handler = () => setCommunityLabel(getCommunityLabel());
    window.addEventListener("afroconnect.communityChanged", handler);
    return () => window.removeEventListener("afroconnect.communityChanged", handler);
  }, []);

  // Listen for "open composer" events (used by FirstLoginOnboardingSheet)
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ kind?: CreateKind; prefill?: string }>;
      const kind = ce.detail?.kind ?? "post";
      const prefill = ce.detail?.prefill;

      setComposerKind(kind);

      // One-time prefill channel the composer already supports
      if (prefill) (window as any).__AFROCONNECT_COMPOSER_PREFILL__ = prefill;

      setComposerOpen(true);
    };

    window.addEventListener("afroconnect.openComposer", handler as EventListener);
    return () => window.removeEventListener("afroconnect.openComposer", handler as EventListener);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return posts
      .filter((p) => {
        // Local/global filter
        if (tab === "local") {
          const a = (p?.communityLabel || "").trim().toLowerCase();
          const b = (communityLabel || "").trim().toLowerCase();
          if (a !== b) return false;
        }

        // Search filter
        if (!q) return true;
        const content = (p?.content || "").toLowerCase();
        const author = (p?.authorName || "").toLowerCase();
        const title = (p?.title || "").toLowerCase();
        return content.includes(q) || author.includes(q) || title.includes(q);
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [posts, tab, communityLabel, query]);

  function requestLogin() {
    onRequireLogin?.();
  }

  function openComposer(kind: CreateKind = "post") {
    if (!isLoggedIn) return requestLogin();
    setComposerKind(kind);
    setComposerOpen(true);
  }

  function onSubmitComposer(payload: ComposerPayload) {
    // Build a post record from the composer payload
    const displayName =
      readDisplayNameFallback() ||
      user?.name ||
      user?.email ||
      "Member";

    const newPost: PostItem = {
      id: uid(),
      authorName: displayName,
      content: payload.text,
      communityLabel,
      createdAt: Date.now(),
      likes: 0,

      kind: payload.kind,
      title: payload.title,
      price: payload.price,
      when: payload.when,
      where: payload.where,
      media: payload.media?.map((m) => ({ kind: m.kind, url: m.url, name: m.name })) || [],
    };

    setPosts((prev) => [newPost, ...prev]);
  }

  function likePost(id: string) {
    if (!isLoggedIn) return requestLogin();
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, likes: (p.likes || 0) + 1 } : p)));
  }

  return (
    <div className="space-y-6">
      {/* Composer Sheet */}
      <CreateComposerSheet
        open={composerOpen}
        onOpenChange={setComposerOpen}
        kind={composerKind}
        communityLabel={communityLabel}
        canInteract={isLoggedIn}
        onRequireLogin={requestLogin}
        onSubmit={onSubmitComposer}
      />

      {/* Guest banner */}
      {!isLoggedIn ? (
        <Card className="rounded-2xl border">
          <CardContent className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="font-semibold">Browsing as guest</div>
              <div className="text-sm text-muted-foreground">
                Community:{" "}
                <strong className="text-foreground">{communityLabel}</strong>. Log
                in to post, like, comment, and message.
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button className="rounded-xl" onClick={requestLogin}>
                Log in / Create account
              </Button>

              {onGoToWelcome ? (
                <Button className="rounded-xl" variant="outline" onClick={onGoToWelcome}>
                  Welcome screen
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Feed header */}
      <Card className="rounded-2xl border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold">Community Feed</CardTitle>
              <div className="text-sm text-muted-foreground mt-1">{communityLabel}</div>
            </div>

            <div className="flex gap-2">
              <Button
                className="rounded-xl"
                variant={tab === "local" ? "default" : "outline"}
                onClick={() => setTab("local")}
              >
                Local
              </Button>
              <Button
                className="rounded-xl"
                variant={tab === "global" ? "default" : "outline"}
                onClick={() => setTab("global")}
              >
                Global
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            <Button
              className="rounded-xl"
              variant={density === "comfortable" ? "default" : "outline"}
              onClick={() => setDensity("comfortable")}
            >
              Comfortable
            </Button>
            <Button
              className="rounded-xl"
              variant={density === "compact" ? "default" : "outline"}
              onClick={() => setDensity("compact")}
            >
              Compact
            </Button>
          </div>

          <div className="mt-4">
            <Input
              className="rounded-xl"
              placeholder={tab === "local" ? "Search local posts..." : "Search all posts..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-lg font-semibold">No posts found</div>
              <div className="text-sm text-muted-foreground mt-1">
                Try another search, or switch to Global.
              </div>

              <div className="mt-4">
                <Button className="rounded-xl" onClick={requestLogin}>
                  Login to Post
                </Button>
              </div>
            </div>
          ) : (
            filtered.map((p) => (
              <div key={p.id} className="rounded-2xl border bg-background/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{p.authorName || "Guest"}</div>
                    <div className="text-xs text-muted-foreground">{p.communityLabel}</div>
                    {p.kind && p.kind !== "post" ? (
                      <div className="text-[11px] text-muted-foreground mt-1">
                        Type: <span className="font-medium">{p.kind.toUpperCase()}</span>
                        {p.title ? ` · ${p.title}` : ""}
                      </div>
                    ) : null}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(p.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className={`mt-3 ${density === "compact" ? "text-sm" : "text-base"}`}>
                  {p.content}
                </div>

                {/* Optional media preview (images only; videos are supported by composer but you can expand this later) */}
                {p.media?.length ? (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {p.media
                      .filter((m) => m.kind === "image")
                      .slice(0, 4)
                      .map((m, idx) => (
                        <img
                          key={`${p.id}-${idx}`}
                          src={m.url}
                          alt={m.name}
                          className="rounded-xl border h-40 w-full object-cover"
                        />
                      ))}
                  </div>
                ) : null}

                <div className="mt-4 flex gap-2">
                  <Button className="rounded-xl" variant="outline" onClick={() => likePost(p.id)}>
                    Like {p.likes || 0}
                  </Button>
                  <Button className="rounded-xl" variant="outline" onClick={requestLogin}>
                    Comment
                  </Button>
                  <Button className="rounded-xl" variant="outline" onClick={requestLogin}>
                    Share
                  </Button>
                </div>
              </div>
            ))
          )}

          {/* Floating Pencil Button */}
          <div className="fixed bottom-8 right-8">
            <Button
              className="h-14 w-14 rounded-full shadow-md"
              onClick={() => {
                    if (!isLoggedIn) return requestLogin();
                  setCreateMenuOpen(true);
                               }}
              title={isLoggedIn ? "Create post" : "Log in to post"}
            >
              <Pencil className="h-6 w-6" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
