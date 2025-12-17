// src/components/HomeFeed.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  MapPin,
  Users,
  Store,
  MessageCircle,
  Building2,
  Image as ImageIcon,
  Video as VideoIcon,
  Heart,
  Send,
  X,
  Trash2,
  LogIn,
} from "lucide-react";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";

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

type PostItem = {
  id: string;
  authorName: string;
  communityLabel: string;
  createdAt: number;
  text: string;
  media: MediaItem[];
  likes: number;
  comments: number; // legacy counter (we keep in sync with real comment list)
};

type CommentItem = {
  id: string;
  postId: string;
  authorName: string;
  text: string;
  createdAt: number;
};

const LS_PROFILE = "afroconnect.profile";
const LS_POSTS = "afroconnect.posts.v1";
const LS_COMMENTS = "afroconnect.comments.v1";
const LS_COMMUNITY_KEY = "afroconnect.communityId";
const LS_AREA_KEY_PREFIX = "afroconnect.areaId.";

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

function readComments(): CommentItem[] {
  return safeParse<CommentItem[]>(localStorage.getItem(LS_COMMENTS), []);
}

function saveComments(comments: CommentItem[]) {
  localStorage.setItem(LS_COMMENTS, JSON.stringify(comments));
}

function uid() {
  return (crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`) as string;
}

// Very lightweight local policy block (MVP)
// You can replace this with a real moderation service later.
function violatesPolicy(text: string) {
  const s = (text || "").toLowerCase();
  const blocked = [
    "porn",
    "nude",
    "sex",
    "sexual",
    "xxx",
    "onlyfans",
    "rape",
    "kill",
    "murder",
    "shoot",
    "gun down",
    "terrorist",
    "behead",
  ];
  return blocked.some((w) => s.includes(w));
}

function getCommunityLabelFallback() {
  const cid = localStorage.getItem(LS_COMMUNITY_KEY);
  if (!cid) return "Aurora, CO";
  return cid;
}

export default function HomeFeed({ userLocation }: Props) {
  const { identity, login, loginStatus } = useInternetIdentity();
  const isLoggedIn = !!identity && loginStatus === "success";
  const isGuest = !isLoggedIn;

  const communityLabel = useMemo(() => {
    return getCommunityLabelFallback();
  }, [userLocation?.communityId, userLocation?.areaId]);

  const [posts, setPosts] = useState<PostItem[]>(() => readPosts());

  // Comments store (local)
  const [commentsStore, setCommentsStore] = useState<CommentItem[]>(() => readComments());
  const [openCommentsForPostId, setOpenCommentsForPostId] = useState<string | null>(null);
  const [commentDraftByPost, setCommentDraftByPost] = useState<Record<string, string>>({});

  // Composer
  const [text, setText] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isPosting, setIsPosting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Persist posts whenever they change
  useEffect(() => {
    savePosts(posts);
  }, [posts]);

  // Persist comments whenever they change + keep post comment counts in sync (for UI counters)
  useEffect(() => {
    saveComments(commentsStore);

    // Keep legacy "comments" count consistent with comment list
    setPosts((prev) =>
      prev.map((p) => {
        const count = commentsStore.filter((c) => c.postId === p.id).length;
        return p.comments === count ? p : { ...p, comments: count };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentsStore]);

  // Cleanup any object URLs (videos) when component unmounts
  useEffect(() => {
    return () => {
      media.forEach((m) => {
        if (!m.persistent && m.url.startsWith("blob:")) URL.revokeObjectURL(m.url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canPost = useMemo(() => {
    if (!isLoggedIn) return false;
    return (text.trim().length > 0 || media.length > 0) && !isPosting;
  }, [isLoggedIn, text, media.length, isPosting]);

  async function handlePickFiles(files: FileList | null) {
    if (!isLoggedIn) {
      login();
      return;
    }
    if (!files || files.length === 0) return;

    const next: MediaItem[] = [];
    const picked = Array.from(files).slice(0, 6);

    for (const file of picked) {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      if (!isImage && !isVideo) continue;

      if (isImage) {
        const dataUrl = await readAsDataUrl(file);
        next.push({ id: uid(), kind: "image", url: dataUrl, name: file.name, persistent: true });
      } else {
        const blobUrl = URL.createObjectURL(file);
        next.push({ id: uid(), kind: "video", url: blobUrl, name: file.name, persistent: false });
      }
    }

    setMedia((prev) => [...prev, ...next]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeMedia(id: string) {
    setMedia((prev) => {
      const item = prev.find((m) => m.id === id);
      if (item && !item.persistent && item.url.startsWith("blob:")) URL.revokeObjectURL(item.url);
      return prev.filter((m) => m.id !== id);
    });
  }

  async function handlePost() {
    if (!isLoggedIn) {
      login();
      return;
    }
    if (!canPost) return;

    const proposedText = text.trim();

    if (violatesPolicy(proposedText)) {
      toast.error("This post appears to violate the content policy (sexual/violent content). Please edit and try again.");
      return;
    }

    setIsPosting(true);

    try {
      const authorName = readDisplayName();

      const newPost: PostItem = {
        id: uid(),
        authorName,
        communityLabel,
        createdAt: Date.now(),
        text: proposedText,
        media,
        likes: 0,
        comments: 0,
      };

      setPosts((prev) => [newPost, ...prev]);

      setText("");
      setMedia([]);
      toast.success("Posted.");
    } finally {
      setIsPosting(false);
    }
  }

  function toggleLike(postId: string) {
    if (!isLoggedIn) {
      login();
      return;
    }
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1 } : p)));
  }

  function toggleComments(postId: string) {
    if (!isLoggedIn) {
      login();
      return;
    }
    setOpenCommentsForPostId((cur) => (cur === postId ? null : postId));
  }

  function addComment(postId: string) {
    if (!isLoggedIn) {
      login();
      return;
    }

    const draft = (commentDraftByPost[postId] || "").trim();
    if (!draft) return;

    if (violatesPolicy(draft)) {
      toast.error("This comment appears to violate the content policy. Please edit and try again.");
      return;
    }

    const authorName = readDisplayName();
    const newComment: CommentItem = {
      id: uid(),
      postId,
      authorName,
      text: draft,
      createdAt: Date.now(),
    };

    // newest-first list (better UX: you immediately see your comment)
    setCommentsStore((prev) => [newComment, ...prev]);
    setCommentDraftByPost((prev) => ({ ...prev, [postId]: "" }));
    setOpenCommentsForPostId(postId);
  }

  function deleteComment(commentId: string) {
    if (!isLoggedIn) return;
    setCommentsStore((prev) => prev.filter((c) => c.id !== commentId));
    toast.success("Comment deleted.");
  }

  function deletePost(postId: string) {
    if (!isLoggedIn) return;

    setPosts((prev) => prev.filter((p) => p.id !== postId));
    // Remove related comments too
    setCommentsStore((prev) => prev.filter((c) => c.postId !== postId));

    toast.success("Post deleted.");
  }

  async function sharePost(p: PostItem) {
    if (!isLoggedIn) {
      login();
      return;
    }

    // Local MVP: share/copy a nice snippet
    const snippet =
      p.text?.trim()
        ? p.text.trim().length > 220
          ? p.text.trim().slice(0, 220) + "…"
          : p.text.trim()
        : "(media post)";

    const shareText = `AfroConnect • ${p.communityLabel}\n${snippet}`;

    try {
      // Use native share if available
      const nav: any = navigator as any;
      if (nav.share) {
        await nav.share({ text: shareText });
        toast.success("Shared.");
        return;
      }

      // Otherwise copy to clipboard
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        toast.success("Copied to clipboard.");
        return;
      }

      // Final fallback
      toast.info("Share is not supported on this browser yet.");
    } catch {
      toast.error("Could not share. Try again.");
    }
  }

  const currentUserName = useMemo(() => readDisplayName(), [isLoggedIn]);

  return (
    <div className="container max-w-5xl py-7 space-y-7">
      {/* ================================= */}
      {/* GUEST TOP CARD (REPLACES OLD ONE) */}
      {/* ================================= */}
      {isGuest && (
        <Card className="border bg-white/70 backdrop-blur shadow-sm rounded-2xl">
          <CardContent className="p-10 text-center space-y-7">
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
          </CardContent>
        </Card>
      )}

      {/* ================= */}
      {/* CREATE POST CARD  */}
      {/* ================= */}
      <Card className="border shadow-sm rounded-2xl">
        <CardHeader>
          <h2 className="text-lg font-semibold">Create a post</h2>
          <p className="text-xs text-muted-foreground mt-1">
            By posting, you agree not to share sexual content, graphic violence, threats, or hate.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              isLoggedIn ? `What’s happening in ${communityLabel}?` : "You can browse posts publicly. Login to post, like, or comment."
            }
            disabled={!isLoggedIn}
          />

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(e) => handlePickFiles(e.target.files)}
            />

            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={!isLoggedIn}>
              <ImageIcon className="h-4 w-4 mr-2" />
              Add photo/video
            </Button>

            {!isLoggedIn && (
              <Button type="button" variant="outline" onClick={login}>
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Button>
            )}

            <div className="flex-1" />

            <Button type="button" onClick={handlePost} disabled={!canPost} className="min-w-[120px]">
              {isPosting ? "Posting..." : "Post"}
            </Button>
          </div>

          {media.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {media.map((m) => (
                <div key={m.id} className="relative border rounded-xl overflow-hidden bg-background">
                  <button
                    type="button"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/90 border flex items-center justify-center hover:bg-muted"
                    onClick={() => removeMedia(m.id)}
                    title="Remove"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  {m.kind === "image" ? (
                    <img src={m.url} alt={m.name} className="h-40 w-full object-cover" />
                  ) : (
                    <div className="h-40 w-full bg-black flex items-center justify-center">
                      <video src={m.url} controls className="h-40 w-full object-contain" />
                    </div>
                  )}

                  {!m.persistent && (
                    <div className="px-2 py-2 text-[11px] text-muted-foreground border-t">
                      <VideoIcon className="inline h-3 w-3 mr-1" />
                      Video preview (won’t persist after refresh yet)
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===================== */}
      {/* COMMUNITY FEED (CORE) */}
      {/* ===================== */}
      <Card className="border shadow-sm rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Community Feed</h2>
          </div>
          <span className="text-sm text-muted-foreground">{communityLabel}</span>
        </CardHeader>

        <CardContent className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-lg font-medium">No posts yet</p>
              <p className="text-sm text-muted-foreground mt-1">Be the first to post in {communityLabel}.</p>

              {!isLoggedIn && (
                <Button className="mt-4" onClick={login}>
                  Login to Post
                </Button>
              )}
            </div>
          ) : (
            posts.map((p) => {
              const isMine = isLoggedIn && p.authorName === currentUserName && currentUserName !== "Guest";

              const postComments = commentsStore.filter((c) => c.postId === p.id);
              // newest-first (we store newest first)
              const latestComment = postComments[0] ?? null;
              const commentsOpen = openCommentsForPostId === p.id;

              return (
                <Card key={p.id} className="border rounded-2xl">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{p.authorName}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.communityLabel} · {formatTimeAgo(p.createdAt)}
                        </p>
                      </div>

                      {isMine && (
                        <Button variant="outline" size="sm" onClick={() => deletePost(p.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      )}
                    </div>

                    {p.text ? <p className="text-sm whitespace-pre-wrap leading-relaxed">{p.text}</p> : null}

                    {p.media.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {p.media.map((m) =>
                          m.kind === "image" ? (
                            <img
                              key={m.id}
                              src={m.url}
                              alt={m.name}
                              className="w-full rounded-xl border object-cover max-h-[360px]"
                            />
                          ) : (
                            <video
                              key={m.id}
                              src={m.url}
                              controls
                              className="w-full rounded-xl border bg-black max-h-[360px]"
                            />
                          )
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <Heart className="h-4 w-4" /> {p.likes}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" /> {postComments.length}
                      </span>
                    </div>

                    {/* Best UX: show latest comment preview ABOVE action buttons */}
                    {latestComment && !commentsOpen && (
                      <button
                        type="button"
                        className="w-full text-left border rounded-xl px-4 py-3 bg-white/60 hover:bg-white/80 transition"
                        onClick={() => toggleComments(p.id)}
                        disabled={!isLoggedIn}
                        title={isLoggedIn ? "View comments" : "Login to view comments"}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <span className="text-sm font-semibold">{latestComment.authorName}</span>{" "}
                            <span className="text-sm text-muted-foreground">
                              {latestComment.text.length > 140 ? latestComment.text.slice(0, 140) + "…" : latestComment.text}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">{formatTimeAgo(latestComment.createdAt)}</span>
                        </div>

                        {postComments.length > 1 && (
                          <div className="mt-2 text-xs text-muted-foreground underline">
                            View all {postComments.length} comments
                          </div>
                        )}
                      </button>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" disabled={!isLoggedIn} onClick={() => toggleLike(p.id)}>
                        <Heart className="h-4 w-4 mr-2" />
                        Like
                      </Button>

                      <Button variant="outline" size="sm" disabled={!isLoggedIn} onClick={() => toggleComments(p.id)}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {commentsOpen ? "Close comments" : "Comment"}
                      </Button>

                      <Button variant="outline" size="sm" disabled={!isLoggedIn} onClick={() => sharePost(p)}>
                        <Send className="h-4 w-4 mr-2" />
                        Share
                      </Button>

                      {!isLoggedIn && (
                        <Button size="sm" onClick={login}>
                          Login to interact
                        </Button>
                      )}
                    </div>

                    {/* COMMENTS PANEL */}
                    {commentsOpen && (
                      <div className="mt-2 border rounded-2xl bg-white/60">
                        <div className="px-4 py-4 border-b">
                          <p className="text-sm font-semibold">Comments</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Be respectful. No sexual content, violence promotion, threats, or hate.
                          </p>
                        </div>

                        <div className="p-4 space-y-3">
                          <div className="flex gap-2 items-start">
                            <Textarea
                              value={commentDraftByPost[p.id] || ""}
                              onChange={(e) =>
                                setCommentDraftByPost((prev) => ({ ...prev, [p.id]: e.target.value }))
                              }
                              placeholder="Write a comment..."
                              className="min-h-[44px]"
                              disabled={!isLoggedIn}
                            />
                            <Button
                              onClick={() => addComment(p.id)}
                              disabled={!isLoggedIn || !(commentDraftByPost[p.id] || "").trim()}
                              className="shrink-0"
                            >
                              Post
                            </Button>
                          </div>

                          {postComments.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No comments yet. Be the first.</p>
                          ) : (
                            <div className="space-y-2">
                              {postComments.map((c) => {
                                const canDelete = isLoggedIn && c.authorName === currentUserName && currentUserName !== "Guest";
                                return (
                                  <div key={c.id} className="border rounded-xl bg-background p-4">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <p className="text-sm font-semibold">{c.authorName}</p>
                                        <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                                          {c.text}
                                        </p>
                                      </div>

                                      <div className="shrink-0 text-right">
                                        <p className="text-xs text-muted-foreground">{formatTimeAgo(c.createdAt)}</p>
                                        {canDelete && (
                                          <button
                                            type="button"
                                            className="mt-2 text-xs underline text-muted-foreground hover:text-foreground"
                                            onClick={() => deleteComment(c.id)}
                                          >
                                            Delete
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* ================================= */}
      {/* GUEST BOTTOM CARD (FOOTER CTA)    */}
      {/* ================================= */}
      {isGuest && (
        <Card className="border bg-white/70 backdrop-blur shadow-sm rounded-2xl">
          <CardContent className="p-10 text-center space-y-5">
            <h3 className="text-2xl font-extrabold">Ready to Join the Community?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Login to unlock full access: post updates, join groups, connect with businesses, discover faith centers, buy
              and sell in the marketplace, and send direct messages!
            </p>

            <Button
              onClick={login}
              className="bg-gradient-to-r from-orange-600 to-green-600 hover:opacity-90 transition-opacity px-6"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Login with Internet Identity
            </Button>

            <div className="pt-6 text-xs text-muted-foreground space-y-1">
              <div>© {new Date().getFullYear()} AfroConnect. Built with ❤️ for the African diaspora.</div>
              <div>
                Powered by{" "}
                <a className="underline" href="https://caffeine.ai" target="_blank" rel="noreferrer">
                  caffeine.ai
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Keep a minimal global footer for logged-in users */}
      {!isGuest && (
        <div className="text-center text-xs text-muted-foreground py-10">
          © {new Date().getFullYear()} AfroConnect. Built with ❤️ for the African diaspora.
        </div>
      )}
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

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
