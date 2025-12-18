// src/components/AppSearchSheet.tsx
import { useMemo, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Search, User, FileText, CalendarDays, Building2, Users, LogIn, Globe, MapPin } from "lucide-react";

type TabId =
  | "home"
  | "events"
  | "businesses"
  | "groups"
  | "messages"
  | "students"
  | "marketplace"
  | "profile"
  | "settings";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  communityLabel: string;
  isLoggedIn: boolean;
  onLogin: () => void;

  onNavigate: (tab: TabId) => void;
};

const LS_POSTS = "afroconnect.posts.v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function norm(s: string) {
  return (s || "").toLowerCase().trim();
}

export default function AppSearchSheet({ open, onOpenChange, communityLabel, isLoggedIn, onLogin, onNavigate }: Props) {
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<"all" | "people" | "posts" | "events" | "businesses" | "groups">("all");
  const [scope, setScope] = useState<"local" | "global">("local"); // ✅ default local first

  const posts = useMemo(() => {
    const raw = localStorage.getItem(LS_POSTS);
    return safeParse<any[]>(raw, []);
  }, [open]);

  // MVP datasets (replace later with backend)
  const people = useMemo(
    () => [
      { id: "p1", name: "Ama Mensah", subtitle: "Accra · Osu", community: "accra" },
      { id: "p2", name: "Zaq", subtitle: communityLabel, community: norm(communityLabel) },
      { id: "p3", name: "Kwame Boateng", subtitle: "Denver · Aurora", community: "denver" },
    ],
    [communityLabel]
  );

  const businesses = useMemo(
    () => [
      { id: "b1", name: "Osu Mini Mart", subtitle: "Groceries · Osu", community: "accra" },
      { id: "b2", name: "Afro Braid Studio", subtitle: "Beauty · Aurora", community: "denver" },
    ],
    []
  );

  const groups = useMemo(
    () => [
      { id: "g1", name: "Nima Community Group", subtitle: "Community · Accra", community: "accra" },
      { id: "g2", name: "Colorado Africans", subtitle: "Diaspora · Denver", community: "denver" },
    ],
    []
  );

  const events = useMemo(
    () => [
      { id: "e1", name: "AfroConnect Meet & Greet", subtitle: "This Saturday · 5:00 PM", community: "denver" },
      { id: "e2", name: "Business Networking Night", subtitle: "Next week · 7:00 PM", community: "accra" },
    ],
    []
  );

  const normalized = norm(q);
  const localKey = norm(communityLabel); // e.g. "denver, co" or "denver-co"

  const results = useMemo(() => {
    const match = (s: string) => norm(s).includes(normalized);

    // community filter (local scope)
    const inScope = (itemCommunity?: string, text?: string) => {
      if (scope === "global") return true;
      const c = norm(itemCommunity || "");
      const t = norm(text || "");
      // forgiving match: localKey might be "denver, co" while ids might be "denver"
      return c && (localKey.includes(c) || c.includes(localKey)) ? true : t.includes(localKey);
    };

    const peopleHits = (normalized ? people.filter((p) => match(p.name) || match(p.subtitle)) : people).filter((p) =>
      inScope(p.community, p.subtitle)
    );

    const postHits = (normalized
      ? posts.filter(
          (p: any) =>
            match(String(p.authorName ?? "")) ||
            match(String(p.text ?? "")) ||
            match(String(p.communityLabel ?? ""))
        )
      : posts.slice(0, 30)
    ).filter((p: any) => (scope === "global" ? true : norm(String(p.communityLabel ?? "")).includes(localKey)));

    const eventHits = (normalized ? events.filter((e) => match(e.name) || match(e.subtitle)) : events).filter((e) =>
      inScope(e.community, e.subtitle)
    );

    const bizHits = (normalized
      ? businesses.filter((b) => match(b.name) || match(b.subtitle))
      : businesses
    ).filter((b) => inScope(b.community, b.subtitle));

    const groupHits = (normalized ? groups.filter((g) => match(g.name) || match(g.subtitle)) : groups).filter((g) =>
      inScope(g.community, g.subtitle)
    );

    const pack = { people: peopleHits, posts: postHits, events: eventHits, businesses: bizHits, groups: groupHits };

    if (mode === "all") return pack;
    return { ...pack, [mode]: (pack as any)[mode] };
  }, [q, mode, scope, people, posts, events, businesses, groups, localKey]);

  const totalHits =
    (results.people?.length ?? 0) +
    (results.posts?.length ?? 0) +
    (results.events?.length ?? 0) +
    (results.businesses?.length ?? 0) +
    (results.groups?.length ?? 0);

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setScope("local"); // reset each time
      }}
    >
      <SheetContent side="top" className="p-0 sm:max-w-none">
        <div className="p-4 border-b bg-background/95 backdrop-blur">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
              <Search className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Search AfroConnect</p>
              <p className="text-xs text-muted-foreground truncate">
                {scope === "local" ? "Nearby: " : "Global: "}
                {communityLabel}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setScope((s) => (s === "local" ? "global" : "local"))}
              title="Toggle search scope"
            >
              {scope === "local" ? (
                <>
                  <MapPin className="h-4 w-4 mr-2" />
                  Nearby
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4 mr-2" />
                  Global
                </>
              )}
            </Button>

            {!isLoggedIn ? (
              <Button variant="outline" size="sm" onClick={onLogin}>
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Button>
            ) : null}
          </div>

          <div className="mt-3">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search people, posts, events, groups, businesses…"
            />
          </div>

          <div className="mt-3">
            <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
              <TabsList className="grid grid-cols-6">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="people">
                  <User className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="posts">
                  <FileText className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="events">
                  <CalendarDays className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="businesses">
                  <Building2 className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="groups">
                  <Users className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* ✅ “Search globally if none found” prompt */}
          {scope === "local" && q.trim() && totalHits === 0 ? (
            <div className="mt-3">
              <Button variant="outline" className="w-full" onClick={() => setScope("global")}>
                <Globe className="h-4 w-4 mr-2" />
                No local results. Search globally
              </Button>
            </div>
          ) : null}
        </div>

        <div className="p-4 space-y-5 max-h-[72vh] overflow-auto">
          <Section
            title="People"
            icon={<User className="h-4 w-4" />}
            items={results.people ?? []}
            renderItem={(p: any) => (
              <ResultRow
                title={p.name}
                subtitle={p.subtitle}
                tag="Profile"
                onClick={() => {
                  toast.info("Profile result (next: open profile detail).");
                  onNavigate("profile");
                }}
              />
            )}
          />

          <Separator />

          <Section
            title="Posts"
            icon={<FileText className="h-4 w-4" />}
            items={results.posts ?? []}
            emptyText="No posts found."
            renderItem={(p: any) => (
              <ResultRow
                title={`${p.authorName ?? "User"} · ${p.communityLabel ?? ""}`}
                subtitle={String(p.text ?? "").slice(0, 120)}
                tag="Post"
                onClick={() => {
                  toast.info("Post result (next: deep-link to post).");
                  onNavigate("home");
                }}
              />
            )}
          />

          <Separator />

          <Section
            title="Events"
            icon={<CalendarDays className="h-4 w-4" />}
            items={results.events ?? []}
            renderItem={(e: any) => (
              <ResultRow
                title={e.name}
                subtitle={e.subtitle}
                tag="Event"
                onClick={() => onNavigate("events")}
              />
            )}
          />

          <Separator />

          <Section
            title="Businesses"
            icon={<Building2 className="h-4 w-4" />}
            items={results.businesses ?? []}
            renderItem={(b: any) => (
              <ResultRow
                title={b.name}
                subtitle={b.subtitle}
                tag="Business"
                onClick={() => onNavigate("businesses")}
              />
            )}
          />

          <Separator />

          <Section
            title="Groups"
            icon={<Users className="h-4 w-4" />}
            items={results.groups ?? []}
            renderItem={(g: any) => (
              <ResultRow
                title={g.name}
                subtitle={g.subtitle}
                tag="Group"
                onClick={() => onNavigate("groups")}
              />
            )}
          />

          <div className="pt-2 flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({
  title,
  icon,
  items,
  renderItem,
  emptyText,
}: {
  title: string;
  icon: React.ReactNode;
  items: any[];
  renderItem: (item: any) => React.ReactNode;
  emptyText?: string;
}) {
  if (!items || items.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">{icon}</span>
          {title}
        </div>
        <div className="text-sm text-muted-foreground">{emptyText ?? "No results."}</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">{icon}</span>
        {title}
      </div>

      <div className="space-y-2">{items.slice(0, 10).map(renderItem)}</div>
    </div>
  );
}

function ResultRow({
  title,
  subtitle,
  tag,
  onClick,
}: {
  title: string;
  subtitle?: string;
  tag?: string;
  onClick?: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="w-full text-left border rounded-2xl p-3 hover:bg-muted/40 transition">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{title}</p>
          {subtitle ? <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{subtitle}</p> : null}
        </div>
        {tag ? (
          <Badge variant="secondary" className="text-[10px]">
            {tag}
          </Badge>
        ) : null}
      </div>
    </button>
  );
}
