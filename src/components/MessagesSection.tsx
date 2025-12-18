// src/components/MessagesSection.tsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

import {
  MessageCircle,
  Store,
  Users,
  GraduationCap,
  LifeBuoy,
  MapPin,
  Plus,
  Send,
} from "lucide-react";

import CommunitySelector from "./CommunitySelector";
import AreaSelector from "./AreaSelector";
import LocationConfirmModal from "./LocationConfirmModal";

import { COMMUNITIES, DEFAULT_COMMUNITY_ID, Community } from "@/lib/communities";

// ----------------------------------
// Location Keys (shared across app)
// ----------------------------------
const LS_COMMUNITY_KEY = "afroconnect.communityId";
const LS_AREA_KEY_PREFIX = "afroconnect.areaId.";
const LS_LOCATION_CONFIRMED = "afroconnect.locationConfirmed";

// ----------------------------------
// Local MVP storage for message bodies
// ----------------------------------
const LS_MESSAGE_THREADS = "afroconnect.messageThreads.v1";
const LS_PROFILE = "afroconnect.profile";

// ----------------------------------
// Types
// ----------------------------------
type ThreadType = "direct" | "business" | "group" | "students" | "help";

type MessageThread = {
  id: string;
  title: string;
  type: ThreadType;

  communityId: string;
  areaId?: string;

  lastMessage: string;
  updatedAgo: string;

  businessProfile?: {
    hours?: string;
    address?: string;
    hasInventory?: boolean;
  };
};

type MessageItem = {
  id: string;
  author: string;
  createdAt: number;
  text: string;
};

type StoredThread = {
  id: string;
  messages: MessageItem[];
};

type Props = {
  initialConversationTitle?: string;
};

// ----------------------------------
// Helpers
// ----------------------------------
function uid() {
  return (crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`) as string;
}

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

function getCommunityById(id: string): Community {
  return (
    COMMUNITIES.find((c) => c.id === id) ??
    COMMUNITIES.find((c) => c.id === DEFAULT_COMMUNITY_ID)!
  );
}

function getSavedAreaForCommunity(communityId: string) {
  return localStorage.getItem(`${LS_AREA_KEY_PREFIX}${communityId}`) || "all";
}

function isLocationConfirmed() {
  return localStorage.getItem(LS_LOCATION_CONFIRMED) === "true";
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function loadStoredThreads(): Record<string, StoredThread> {
  return safeParse<Record<string, StoredThread>>(localStorage.getItem(LS_MESSAGE_THREADS), {});
}

function saveStoredThreads(map: Record<string, StoredThread>) {
  localStorage.setItem(LS_MESSAGE_THREADS, JSON.stringify(map));
}

function ensureThreadStorage(threadId: string, seedText?: string) {
  const map = loadStoredThreads();
  if (!map[threadId]) {
    map[threadId] = {
      id: threadId,
      messages: seedText
        ? [
            {
              id: uid(),
              author: "System",
              createdAt: Date.now() - 60 * 60 * 1000,
              text: seedText,
            },
          ]
        : [],
    };
    saveStoredThreads(map);
  }
}

// ----------------------------------
// Mock Threads
// ----------------------------------
const THREADS: MessageThread[] = [
  {
    id: "t1",
    title: "Ama (Direct)",
    type: "direct",
    communityId: "accra-gh",
    lastMessage: "See you later today",
    updatedAgo: "5m ago",
  },
  {
    id: "t2",
    title: "Osu Mini Mart",
    type: "business",
    communityId: "accra-gh",
    areaId: "accra-osu",
    lastMessage: "Yes, rice is back in stock",
    updatedAgo: "12m ago",
    businessProfile: {
      hours: "8am – 9pm",
      address: "Oxford Street, Osu",
      hasInventory: true,
    },
  },
  {
    id: "t3",
    title: "Nima Community Group",
    type: "group",
    communityId: "accra-gh",
    areaId: "accra-nima",
    lastMessage: "Meeting is on Sunday",
    updatedAgo: "1h ago",
  },
  {
    id: "t4",
    title: "Accra Student Help",
    type: "students",
    communityId: "accra-gh",
    lastMessage: "Who can help with housing?",
    updatedAgo: "2h ago",
  },
  {
    id: "t5",
    title: "Airport Pickup Request",
    type: "help",
    communityId: "denver-co",
    lastMessage: "Flight lands at 4pm",
    updatedAgo: "1d ago",
  },
];

// ----------------------------------
// Component
// ----------------------------------
export default function MessagesSection({ initialConversationTitle }: Props) {
  // Location
  const [communityId, setCommunityId] = useState(
    () => localStorage.getItem(LS_COMMUNITY_KEY) || DEFAULT_COMMUNITY_ID
  );
  const community = useMemo(() => getCommunityById(communityId), [communityId]);

  const [areaId, setAreaId] = useState(() => getSavedAreaForCommunity(communityId));
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  // Filters
  const [threadType, setThreadType] = useState<ThreadType | "all">("all");
  const [search, setSearch] = useState("");

  const showAreaUI = (community.areas ?? []).length > 0;

  // Thread drawer
  const [threadOpen, setThreadOpen] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  // New message drawer
  const [newOpen, setNewOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<ThreadType>("direct");

  // message composer
  const [draft, setDraft] = useState("");

  // Init modal
  useEffect(() => {
    setLocationModalOpen(!isLocationConfirmed());
  }, []);

  // Persist location
  useEffect(() => {
    localStorage.setItem(LS_COMMUNITY_KEY, communityId);
  }, [communityId]);

  useEffect(() => {
    setAreaId(getSavedAreaForCommunity(communityId));
  }, [communityId]);

  useEffect(() => {
    localStorage.setItem(`${LS_AREA_KEY_PREFIX}${communityId}`, areaId);
  }, [communityId, areaId]);

  const confirmLocation = () => {
    localStorage.setItem(LS_LOCATION_CONFIRMED, "true");
    setLocationModalOpen(false);
  };

  const skipLocation = () => {
    localStorage.setItem(LS_LOCATION_CONFIRMED, "true");
    setLocationModalOpen(false);
  };

  // Open thread from Marketplace/StudentsHub click (optional)
  useEffect(() => {
    if (!initialConversationTitle) return;
    const match = THREADS.find((t) => t.title.toLowerCase().includes(initialConversationTitle.toLowerCase()));
    if (match) {
      openThread(match.id, match.lastMessage);
    } else {
      // if not found, open "New" prefilled
      setNewTitle(initialConversationTitle);
      setNewType("direct");
      setNewOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConversationTitle]);

  // Filtered Threads
  const filteredThreads = useMemo(() => {
    return THREADS.filter((t) => {
      if (t.communityId !== communityId) return false;

      if (showAreaUI && areaId !== "all") {
        if (t.areaId !== areaId) return false;
      }

      if (threadType !== "all" && t.type !== threadType) return false;

      if (!search.trim()) return true;
      return t.title.toLowerCase().includes(search.toLowerCase());
    });
  }, [communityId, areaId, threadType, search, showAreaUI]);

  const activeThreadMeta = useMemo(() => {
    if (!activeThreadId) return null;
    return THREADS.find((t) => t.id === activeThreadId) ?? null;
  }, [activeThreadId]);

  const activeMessages = useMemo(() => {
    if (!activeThreadId) return [];
    const map = loadStoredThreads();
    return map[activeThreadId]?.messages ?? [];
  }, [activeThreadId, threadOpen]);

  function openThread(threadId: string, seedLastMessage?: string) {
    ensureThreadStorage(threadId, seedLastMessage);
    setActiveThreadId(threadId);
    setDraft("");
    setThreadOpen(true);
  }

  function sendMessage() {
    if (!activeThreadId) return;
    const txt = draft.trim();
    if (!txt) return;

    const map = loadStoredThreads();
    ensureThreadStorage(activeThreadId);

    const msg: MessageItem = {
      id: uid(),
      author: readDisplayName(),
      createdAt: Date.now(),
      text: txt,
    };

    map[activeThreadId] = {
      id: activeThreadId,
      messages: [...(map[activeThreadId]?.messages ?? []), msg],
    };

    saveStoredThreads(map);
    setDraft("");
  }

  function startNew() {
    setNewOpen(true);
    setNewTitle("");
    setNewType("direct");
  }

  function createNewThread() {
    const title = newTitle.trim();
    if (!title) return;

    const id = uid();
    const map = loadStoredThreads();
    map[id] = { id, messages: [] };
    saveStoredThreads(map);

    toast.success("New message thread created (local MVP).");
    setNewOpen(false);

    setActiveThreadId(id);
    setThreadOpen(true);
    setDraft("");
  }

  const drawerTitle = useMemo(() => {
    if (activeThreadMeta?.title) return activeThreadMeta.title;
    return newTitle.trim() ? newTitle.trim() : "New conversation";
  }, [activeThreadMeta?.title, newTitle]);

  const drawerType = useMemo(() => {
    if (activeThreadMeta?.type) return activeThreadMeta.type;
    return newType;
  }, [activeThreadMeta?.type, newType]);

  return (
    <div className="w-full h-full flex flex-col">
      <LocationConfirmModal
        open={locationModalOpen}
        community={community}
        areaId={areaId}
        onChangeCommunity={setCommunityId}
        onChangeArea={setAreaId}
        onConfirm={confirmLocation}
        onSkip={skipLocation}
      />

      <Card className="h-full">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Messages
            </CardTitle>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setLocationModalOpen(true)}>
                <MapPin className="h-4 w-4 mr-1" />
                Location
              </Button>

              <Button size="sm" onClick={startNew}>
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </div>
          </div>

          <CommunitySelector value={community} onChange={(c) => setCommunityId(c.id)} />

          {showAreaUI && <AreaSelector community={community} value={areaId} onChange={setAreaId} />}

          <Input placeholder="Search messages…" value={search} onChange={(e) => setSearch(e.target.value)} />

          <Tabs value={threadType} onValueChange={(v) => setThreadType(v as any)}>
            <TabsList className="grid grid-cols-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="direct">
                <MessageCircle className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="business">
                <Store className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="group">
                <Users className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="students">
                <GraduationCap className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="help">
                <LifeBuoy className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-260px)]">
            {filteredThreads.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-10">No messages for this location.</div>
            ) : (
              filteredThreads.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="w-full text-left border-b px-4 py-3 hover:bg-muted/50"
                  onClick={() => openThread(t.id, t.lastMessage)}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">{t.title}</p>
                    <span className="text-xs text-muted-foreground">{t.updatedAgo}</span>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-1">{t.lastMessage}</p>

                  {t.type === "business" && t.businessProfile && (
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px]">
                        {t.businessProfile.hours}
                      </Badge>
                      {t.businessProfile.hasInventory && (
                        <Badge variant="secondary" className="text-[10px]">
                          Inventory
                        </Badge>
                      )}
                    </div>
                  )}
                </button>
              ))
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* THREAD DRAWER */}
      <Sheet open={threadOpen} onOpenChange={setThreadOpen}>
        <SheetContent side="bottom" className="p-0 sm:max-w-none">
          <div className="p-4 border-b">
            <SheetHeader>
              <SheetTitle>{drawerTitle}</SheetTitle>
            </SheetHeader>
            <p className="text-xs text-muted-foreground mt-1">
              {community.name}
              {showAreaUI && areaId !== "all" ? ` · ${community.areas?.find((a) => a.id === areaId)?.name ?? ""}` : ""}
              {" · "}
              {drawerType}
            </p>
          </div>

          <div className="p-4 space-y-3 max-h-[65vh] overflow-auto">
            {activeMessages.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-10">No messages yet.</div>
            ) : (
              activeMessages.map((m) => (
                <div key={m.id} className="border rounded-xl p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{m.author}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(m.createdAt)}</p>
                  </div>
                  <p className="text-sm mt-2 whitespace-pre-wrap leading-relaxed">{m.text}</p>
                </div>
              ))
            )}
          </div>

          <Separator />

          <div className="p-4 flex gap-2 items-center">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a message…"
              className="min-h-[44px]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button onClick={sendMessage} disabled={!draft.trim()}>
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* NEW MESSAGE DRAWER */}
      <Sheet open={newOpen} onOpenChange={setNewOpen}>
        <SheetContent side="bottom" className="p-0 sm:max-w-none">
          <div className="p-4 border-b">
            <SheetHeader>
              <SheetTitle>New message</SheetTitle>
            </SheetHeader>
            <p className="text-xs text-muted-foreground mt-1">Local MVP: creates a new conversation thread on this device.</p>
          </div>

          <div className="p-4 space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">To (name / group / business)</label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g., Kwame / Biz Owners" />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Type</label>
              <div className="flex flex-wrap gap-2">
                {(["direct", "business", "group", "students", "help"] as ThreadType[]).map((t) => (
                  <Button
                    key={t}
                    type="button"
                    size="sm"
                    variant={newType === t ? "default" : "outline"}
                    onClick={() => setNewType(t)}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 border-t flex justify-end gap-2">
            <Button variant="outline" onClick={() => setNewOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createNewThread} disabled={!newTitle.trim()}>
              Create
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
