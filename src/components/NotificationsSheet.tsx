import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type NotificationItem = {
  id: string;
  title: string;
  subtitle?: string;
  timeAgo: string;
  avatarText: string;
  imageUrl?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityName: string;
};

type PostItem = {
  id: string;
  authorName: string;
  communityLabel: string;
  createdAt: number;
  text: string;
  media?: { url: string; kind: "image" | "video" }[];
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

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function NotificationRow({ item }: { item: NotificationItem }) {
  return (
    <button
      type="button"
      className="w-full text-left px-3 py-3 flex items-center gap-3 hover:bg-muted/60 transition rounded-md"
      onClick={() => {
        console.log("Open notification:", item.id);
      }}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src="/assets/generated/default-avatar.dim_100x100.png" />
        <AvatarFallback>{initials(item.avatarText)}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.title}</p>
        {item.subtitle ? <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p> : null}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">{item.timeAgo}</span>

        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" className="h-10 w-10 rounded-md object-cover border" />
        ) : null}
      </div>
    </button>
  );
}

export default function NotificationsSheet({ open, onOpenChange, communityName }: Props) {
  const [tab, setTab] = useState<"neighborhood" | "activity" | "alerts">("neighborhood");

  // ✅ Neighborhood derived from posts in this community
  const neighborhood = useMemo<NotificationItem[]>(() => {
    const posts = safeParse<PostItem[]>(localStorage.getItem("afroconnect.posts.v1"), []);
    const inCity = posts
      .filter((p) => p.communityLabel === communityName)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 20);

    return inCity.map((p) => ({
      id: `post-${p.id}`,
      title: `${p.authorName} posted in ${p.communityLabel}`,
      subtitle: (p.text || "").slice(0, 80) + ((p.text || "").length > 80 ? "…" : ""),
      timeAgo: formatTimeAgo(p.createdAt),
      avatarText: p.authorName,
      imageUrl: p.media?.find((m) => m.kind === "image")?.url,
    }));
  }, [communityName, open]);

  // Mock lists (replace later)
  const activity = useMemo<NotificationItem[]>(
    () => [
      { id: "a1", title: "Someone liked your post", subtitle: "“Looking for housing near Aurora…”", timeAgo: "2h", avatarText: "AfroConnect" },
      { id: "a2", title: "New comment on your post", subtitle: "“Check RTD routes from DIA…”", timeAgo: "7h", avatarText: "AfroConnect" },
    ],
    []
  );

  const alerts = useMemo<NotificationItem[]>(
    () => [{ id: "al1", title: "Weather alert in your area", subtitle: "Expect snow later tonight.", timeAgo: "1h", avatarText: "Alert" }],
    []
  );

  const list = tab === "neighborhood" ? neighborhood : tab === "activity" ? activity : alerts;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[420px] sm:w-[520px] p-0">
        <SheetHeader className="px-4 py-4 border-b">
          <SheetTitle className="text-base">Notifications</SheetTitle>
          <p className="text-xs text-muted-foreground mt-1">{communityName}</p>
        </SheetHeader>

        <div className="px-4 pt-3">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="neighborhood" className="text-xs">
                Neighborhood
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-xs">
                My activity
              </TabsTrigger>
              <TabsTrigger value="alerts" className="text-xs">
                Alerts
              </TabsTrigger>
            </TabsList>

            <TabsContent value={tab} className="mt-3">
              <ScrollArea className="h-[calc(100vh-160px)] pr-3">
                <div className="space-y-1">
                  <div className="px-1 pb-2">
                    <p className="text-xs font-semibold text-muted-foreground">Today</p>
                  </div>

                  {list.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-10">
                      No notifications yet for this city.
                    </div>
                  ) : (
                    list.map((item) => <NotificationRow key={item.id} item={item} />)
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
