// src/components/EventsPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  CalendarDays,
  MapPin,
  Clock,
  Plus,
  Image as ImageIcon,
  Send,
  UserPlus,
  Download,
  MessageCircle,
  X,
  CheckCircle2,
  Sparkles,
  PartyPopper,
} from "lucide-react";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";

type RSVPStatus = "none" | "rsvp" | "interested" | "going";

type EventComment = {
  id: string;
  authorName: string;
  text: string;
  createdAt: number;
};

type EventPhoto = {
  id: string;
  url: string; // data URL
  name: string;
  createdAt: number;
};

type EventItem = {
  id: string;
  communityLabel: string;

  title: string;
  description: string;
  category: string;

  location: string;
  startAt: number; // ms
  endAt: number; // ms

  flyerUrl?: string; // data URL (optional)

  comments: EventComment[];
  photos: EventPhoto[];

  // RSVP map: userKey -> status
  rsvpByUser?: Record<string, RSVPStatus>;

  createdAt: number;
};

type Props = {
  communityLabel: string;
};

const LS_EVENTS = "afroconnect.events.v1";
const LS_PROFILE = "afroconnect.profile";

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

function readEvents(): EventItem[] {
  return safeParse<EventItem[]>(localStorage.getItem(LS_EVENTS), []);
}

function saveEvents(events: EventItem[]) {
  localStorage.setItem(LS_EVENTS, JSON.stringify(events));
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = () => reject(new Error("Failed to read file"));
    r.readAsDataURL(file);
  });
}

function formatDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function toLocalDateInput(ts: number) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildICS(e: EventItem) {
  const dt = (ms: number) => {
    const d = new Date(ms);
    const pad = (n: number) => `${n}`.padStart(2, "0");
    return (
      d.getUTCFullYear().toString() +
      pad(d.getUTCMonth() + 1) +
      pad(d.getUTCDate()) +
      "T" +
      pad(d.getUTCHours()) +
      pad(d.getUTCMinutes()) +
      pad(d.getUTCSeconds()) +
      "Z"
    );
  };

  const escape = (s: string) =>
    (s || "")
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AfroConnect//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.id}@afroconnect`,
    `DTSTAMP:${dt(Date.now())}`,
    `DTSTART:${dt(e.startAt)}`,
    `DTEND:${dt(e.endAt)}`,
    `SUMMARY:${escape(e.title)}`,
    `DESCRIPTION:${escape(e.description)}`,
    `LOCATION:${escape(e.location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function seedEventsIfEmpty(communityLabel: string): EventItem[] {
  const existing = readEvents();
  if (existing.length > 0) return existing;

  const now = Date.now();
  const inDays = (d: number) => now + d * 24 * 60 * 60 * 1000;

  const samples: EventItem[] = [
    {
      id: uid(),
      communityLabel,
      title: "AfroConnect Community Mixer",
      description:
        "Meet new people, share your story, and connect with local businesses and groups. Light refreshments and networking.",
      category: "Community",
      location: "Aurora Public Library (Meeting Room A)",
      startAt: inDays(3) + 18 * 60 * 60 * 1000,
      endAt: inDays(3) + 20 * 60 * 60 * 1000,
      flyerUrl: undefined,
      comments: [
        { id: uid(), authorName: "Ama", text: "I’m bringing two friends!", createdAt: now - 60 * 60 * 1000 },
        { id: uid(), authorName: "Kojo", text: "Is there parking available?", createdAt: now - 30 * 60 * 1000 },
      ],
      photos: [],
      rsvpByUser: {},
      createdAt: now - 2 * 60 * 60 * 1000,
    },
    {
      id: uid(),
      communityLabel,
      title: "African Food Pop-Up + Marketplace",
      description:
        "Taste authentic dishes, discover vendors, and support small businesses. Bring cash/card — vendors may vary.",
      category: "Marketplace",
      location: "380 S Potomac St, Aurora, CO",
      startAt: inDays(7) + 12 * 60 * 60 * 1000,
      endAt: inDays(7) + 16 * 60 * 60 * 1000,
      flyerUrl: undefined,
      comments: [{ id: uid(), authorName: "Zaq", text: "I will be there.", createdAt: now - 10 * 60 * 1000 }],
      photos: [],
      rsvpByUser: {},
      createdAt: now - 4 * 60 * 60 * 1000,
    },
  ];

  saveEvents(samples);
  return samples;
}

export default function EventsPage({ communityLabel }: Props) {
  const { identity, login, loginStatus } = useInternetIdentity();
  const isLoggedIn = !!identity && loginStatus === "success";

  // Stable per-user key (best effort):
  const userKey = useMemo(() => {
    if (!isLoggedIn) return "guest";
    try {
      const principal = identity?.getPrincipal?.().toString?.();
      if (principal) return `principal:${principal}`;
    } catch {
      // ignore
    }
    const name = readDisplayName();
    return `name:${name || "User"}`;
  }, [isLoggedIn, identity]);

  const [events, setEvents] = useState<EventItem[]>(() => seedEventsIfEmpty(communityLabel));

  // Create Event modal
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("Community");
  const [newLocation, setNewLocation] = useState("");
  const [newDate, setNewDate] = useState(() => toLocalDateInput(Date.now() + 3 * 24 * 60 * 60 * 1000));
  const [newStartTime, setNewStartTime] = useState("18:00");
  const [newEndTime, setNewEndTime] = useState("20:00");
  const [newFlyerUrl, setNewFlyerUrl] = useState<string>("");
  const flyerInputRef = useRef<HTMLInputElement | null>(null);

  // Drawer / details
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeEvent = useMemo(() => events.find((e) => e.id === activeId) || null, [events, activeId]);

  // New comment + photo in drawer
  const [commentText, setCommentText] = useState("");
  const photosInputRef = useRef<HTMLInputElement | null>(null);

  // Persist events
  useEffect(() => {
    saveEvents(events);
  }, [events]);

  // Keep seed in sync if community label changes (MVP)
  useEffect(() => {
    const existing = readEvents();
    if (existing.length === 0) setEvents(seedEventsIfEmpty(communityLabel));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityLabel]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return events
      .filter((e) => e.communityLabel === communityLabel)
      .sort((a, b) => a.startAt - b.startAt)
      .filter((e) => e.endAt >= now);
  }, [events, communityLabel]);

  function openDetails(id: string) {
    setActiveId(id);
    setDetailsOpen(true);
  }

  function closeDetails() {
    setDetailsOpen(false);
    setActiveId(null);
    setCommentText("");
  }

  function handleCreateEventOpen() {
    if (!isLoggedIn) {
      login();
      return;
    }
    setCreateOpen(true);
  }

  function closeCreate() {
    setCreateOpen(false);
    setNewTitle("");
    setNewDesc("");
    setNewCategory("Community");
    setNewLocation("");
    setNewDate(toLocalDateInput(Date.now() + 3 * 24 * 60 * 60 * 1000));
    setNewStartTime("18:00");
    setNewEndTime("20:00");
    setNewFlyerUrl("");
    if (flyerInputRef.current) flyerInputRef.current.value = "";
  }

  function parseStartEnd(): { startAt: number; endAt: number } | null {
    const [sy, sm, sd] = newDate.split("-").map((x) => parseInt(x, 10));
    const [sh, smin] = newStartTime.split(":").map((x) => parseInt(x, 10));
    const [eh, emin] = newEndTime.split(":").map((x) => parseInt(x, 10));
    if (!sy || !sm || !sd || Number.isNaN(sh) || Number.isNaN(smin) || Number.isNaN(eh) || Number.isNaN(emin))
      return null;

    const start = new Date(sy, sm - 1, sd, sh, smin, 0, 0).getTime();
    const end = new Date(sy, sm - 1, sd, eh, emin, 0, 0).getTime();
    return { startAt: start, endAt: end };
  }

  function createEvent() {
    if (!isLoggedIn) {
      login();
      return;
    }
    const title = newTitle.trim();
    if (!title) {
      toast.error("Please add an event title.");
      return;
    }
    const times = parseStartEnd();
    if (!times) {
      toast.error("Please enter a valid date/time.");
      return;
    }
    if (times.endAt <= times.startAt) {
      toast.error("End time must be after start time.");
      return;
    }
    const loc = newLocation.trim() || communityLabel;

    const e: EventItem = {
      id: uid(),
      communityLabel,
      title,
      description: newDesc.trim(),
      category: newCategory,
      location: loc,
      startAt: times.startAt,
      endAt: times.endAt,
      flyerUrl: newFlyerUrl || undefined,
      comments: [],
      photos: [],
      rsvpByUser: {},
      createdAt: Date.now(),
    };

    setEvents((prev) => [e, ...prev]);
    toast.success("Event created.");
    closeCreate();
  }

  function getMyRSVP(e: EventItem): RSVPStatus {
    const map = e.rsvpByUser || {};
    return map[userKey] || "none";
  }

  function countRSVP(e: EventItem, status: RSVPStatus) {
    const map = e.rsvpByUser || {};
    return Object.values(map).filter((s) => s === status).length;
  }

  function setRSVP(eventId: string, status: RSVPStatus) {
    if (!isLoggedIn) {
      login();
      return;
    }
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== eventId) return e;
        const next = { ...(e.rsvpByUser || {}) };
        const current = next[userKey] || "none";

        // Toggle off if clicking same status
        if (current === status) {
          delete next[userKey];
        } else {
          next[userKey] = status;
        }

        return { ...e, rsvpByUser: next };
      })
    );

    const msg =
      status === "going"
        ? "Marked as Going."
        : status === "interested"
        ? "Marked as Interested."
        : "RSVP saved.";
    toast.success(msg);
  }

  async function inviteFriends(e: EventItem) {
    const msg = `AfroConnect Event Invite: ${e.title}\n${formatDate(e.startAt)} · ${formatTime(e.startAt)}\n${e.location}\nCommunity: ${e.communityLabel}`;
    const ok = await copyToClipboard(msg);
    if (ok) toast.success("Invite copied. Paste it to friends.");
    else toast.info("Copy this invite message manually:\n" + msg);
  }

  async function shareEvent(e: EventItem) {
    const msg = `AfroConnect Event: ${e.title}\n${formatDate(e.startAt)} · ${formatTime(e.startAt)}\n${e.location}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav: any = navigator;
    if (nav?.share) {
      try {
        await nav.share({ title: e.title, text: msg });
        toast.success("Shared.");
        return;
      } catch {
        // fallthrough
      }
    }
    const ok = await copyToClipboard(msg);
    if (ok) toast.success("Share text copied.");
    else toast.info(msg);
  }

  function downloadICS(e: EventItem) {
    const ics = buildICS(e);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${e.title.replace(/[^\w\- ]+/g, "").slice(0, 60) || "event"}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
    toast.success("Calendar file downloaded (.ics).");
  }

  function addComment(eventId: string) {
    if (!isLoggedIn) {
      login();
      return;
    }
    const t = commentText.trim();
    if (!t) return;

    const c: EventComment = {
      id: uid(),
      authorName: readDisplayName(),
      text: t,
      createdAt: Date.now(),
    };

    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, comments: [...e.comments, c] } : e))
    );
    setCommentText("");
    toast.success("Comment posted.");
  }

  async function addPhotos(eventId: string, files: FileList | null) {
    if (!isLoggedIn) {
      login();
      return;
    }
    if (!files || files.length === 0) return;

    const picked = Array.from(files).slice(0, 8);
    const next: EventPhoto[] = [];

    for (const f of picked) {
      if (!f.type.startsWith("image/")) continue;
      const url = await readAsDataUrl(f);
      next.push({ id: uid(), url, name: f.name, createdAt: Date.now() });
    }

    if (next.length === 0) return;

    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, photos: [...e.photos, ...next] } : e))
    );

    if (photosInputRef.current) photosInputRef.current.value = "";
    toast.success("Photos added.");
  }

  async function pickFlyer(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Flyer must be an image.");
      return;
    }
    const url = await readAsDataUrl(file);
    setNewFlyerUrl(url);
    if (flyerInputRef.current) flyerInputRef.current.value = "";
  }

  return (
    <div className="container max-w-5xl py-7 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Events</h1>
          <p className="text-sm text-muted-foreground mt-1">
            What’s happening in <span className="font-semibold">{communityLabel}</span>
          </p>
        </div>

        <Button className="rounded-2xl" onClick={handleCreateEventOpen}>
          <Plus className="h-4 w-4 mr-2" />
          Create event
        </Button>
      </div>

      {/* List */}
      {upcoming.length === 0 ? (
        <Card className="border rounded-2xl">
          <CardContent className="p-8 text-center space-y-3">
            <p className="text-lg font-semibold">No upcoming events yet</p>
            <p className="text-sm text-muted-foreground">
              Create the first event for <strong>{communityLabel}</strong>.
            </p>
            <Button className="rounded-2xl" onClick={handleCreateEventOpen}>
              <Plus className="h-4 w-4 mr-2" />
              Create event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {upcoming.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              myStatus={getMyRSVP(e)}
              rsvpCount={countRSVP(e, "rsvp")}
              interestedCount={countRSVP(e, "interested")}
              goingCount={countRSVP(e, "going")}
              onOpen={() => openDetails(e.id)}
              onSetStatus={(s) => setRSVP(e.id, s)}
            />
          ))}
        </div>
      )}

      {/* ========================= */}
      {/* CREATE EVENT (MVP MODAL) */}
      {/* ========================= */}
      {createOpen && (
        <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
          <div className="w-full max-w-2xl bg-background border rounded-3xl shadow-xl overflow-hidden">
            <div className="p-5 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-lg font-semibold">Create Event</p>
                <p className="text-xs text-muted-foreground">Visible to your community for now (local MVP).</p>
              </div>

              <Button variant="outline" size="icon" className="rounded-2xl" onClick={closeCreate}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Separator />

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Title</label>
                  <Input
                    value={newTitle}
                    onChange={(ev) => setNewTitle(ev.target.value)}
                    placeholder="e.g., AfroConnect Prayer Night"
                    className="rounded-2xl"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Category</label>
                  <select
                    value={newCategory}
                    onChange={(ev) => setNewCategory(ev.target.value)}
                    className="w-full h-10 px-3 rounded-2xl border bg-background text-sm"
                  >
                    <option value="Community">Community</option>
                    <option value="Faith">Faith</option>
                    <option value="Business">Business</option>
                    <option value="Marketplace">Marketplace</option>
                    <option value="Students">Students</option>
                    <option value="Sports">Sports</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Description</label>
                <Textarea
                  value={newDesc}
                  onChange={(ev) => setNewDesc(ev.target.value)}
                  placeholder="Add details (optional): agenda, dress code, ticket info, etc."
                  className="rounded-2xl min-h-[110px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Location</label>
                  <Input
                    value={newLocation}
                    onChange={(ev) => setNewLocation(ev.target.value)}
                    placeholder={`e.g., 380 S Potomac St (defaults to ${communityLabel})`}
                    className="rounded-2xl"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Date</label>
                  <Input
                    type="date"
                    value={newDate}
                    onChange={(ev) => setNewDate(ev.target.value)}
                    className="rounded-2xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Start time</label>
                  <Input
                    type="time"
                    value={newStartTime}
                    onChange={(ev) => setNewStartTime(ev.target.value)}
                    className="rounded-2xl"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">End time</label>
                  <Input
                    type="time"
                    value={newEndTime}
                    onChange={(ev) => setNewEndTime(ev.target.value)}
                    className="rounded-2xl"
                  />
                </div>
              </div>

              {/* Flyer upload */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Event flyer (optional)</label>

                <input
                  ref={flyerInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => pickFlyer(e.target.files?.[0])}
                />

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl"
                    onClick={() => flyerInputRef.current?.click()}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Upload flyer
                  </Button>

                  {newFlyerUrl && (
                    <Button type="button" variant="outline" className="rounded-2xl" onClick={() => setNewFlyerUrl("")}>
                      Remove
                    </Button>
                  )}
                </div>

                {newFlyerUrl && (
                  <div className="border rounded-3xl overflow-hidden">
                    <img src={newFlyerUrl} alt="Event flyer" className="w-full max-h-[260px] object-cover" />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" className="rounded-2xl" onClick={closeCreate}>
                  Cancel
                </Button>
                <Button className="rounded-2xl" onClick={createEvent}>
                  Create event
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================= */}
      {/* DETAILS DRAWER (SHEET)   */}
      {/* ========================= */}
      <Sheet open={detailsOpen} onOpenChange={(o) => (o ? null : closeDetails())}>
        <SheetContent side="right" className="w-full sm:max-w-[640px] p-0">
          {activeEvent ? (
            <div className="h-full flex flex-col">
              {/* Drawer header */}
              <div className="p-5 flex items-start justify-between gap-3 border-b">
                <div className="min-w-0">
                  <p className="text-lg font-semibold truncate">{activeEvent.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activeEvent.category} · {activeEvent.communityLabel}
                  </p>
                </div>
                <Button variant="outline" size="icon" className="rounded-2xl" onClick={closeDetails}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-auto p-5 space-y-4">
                {/* RSVP row */}
                <Card className="border rounded-3xl">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">RSVP</p>
                      <span className="text-xs text-muted-foreground">
                        RSVP {countRSVP(activeEvent, "rsvp")} · Interested {countRSVP(activeEvent, "interested")} · Going{" "}
                        {countRSVP(activeEvent, "going")}
                      </span>
                    </div>

                    <RSVPButtons
                      myStatus={getMyRSVP(activeEvent)}
                      disabled={!isLoggedIn}
                      onPick={(s) => setRSVP(activeEvent.id, s)}
                    />

                    {!isLoggedIn && (
                      <Button variant="outline" className="rounded-2xl w-full" onClick={login}>
                        Login to RSVP
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Flyer */}
                {activeEvent.flyerUrl ? (
                  <Card className="border rounded-3xl">
                    <CardContent className="p-4 space-y-3">
                      <p className="text-sm font-semibold">Flyer</p>
                      <img
                        src={activeEvent.flyerUrl}
                        alt="Event flyer"
                        className="w-full max-h-[420px] object-cover rounded-3xl border"
                      />
                    </CardContent>
                  </Card>
                ) : null}

                {/* Details */}
                <Card className="border rounded-3xl">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        {formatDate(activeEvent.startAt)}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {formatTime(activeEvent.startAt)} – {formatTime(activeEvent.endAt)}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {activeEvent.location}
                      </span>
                    </div>

                    {activeEvent.description ? (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{activeEvent.description}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">No description provided.</p>
                    )}

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button variant="outline" className="rounded-2xl" onClick={() => inviteFriends(activeEvent)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite friends
                      </Button>

                      <Button variant="outline" className="rounded-2xl" onClick={() => downloadICS(activeEvent)}>
                        <Download className="h-4 w-4 mr-2" />
                        Add to calendar (.ics)
                      </Button>

                      <Button variant="outline" className="rounded-2xl" onClick={() => shareEvent(activeEvent)}>
                        <Send className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Photos */}
                <Card className="border rounded-3xl">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-base font-semibold">Event photos</p>

                      <div className="flex items-center gap-2">
                        <input
                          ref={photosInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => addPhotos(activeEvent.id, e.target.files)}
                        />
                        <Button
                          variant="outline"
                          className="rounded-2xl"
                          onClick={() => {
                            if (!isLoggedIn) {
                              login();
                              return;
                            }
                            photosInputRef.current?.click();
                          }}
                        >
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Add photos
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-0">
                    {activeEvent.photos.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No photos yet.</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {activeEvent.photos
                          .slice()
                          .sort((a, b) => b.createdAt - a.createdAt)
                          .map((p) => (
                            <img
                              key={p.id}
                              src={p.url}
                              alt={p.name}
                              className="w-full h-24 object-cover rounded-2xl border"
                            />
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Comments */}
                <Card className="border rounded-3xl">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <p className="text-base font-semibold">Comments</p>
                      <span className="text-xs text-muted-foreground">{activeEvent.comments.length} total</span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-0 space-y-4">
                    <div className="flex items-start gap-2">
                      <Input
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder={isLoggedIn ? "Write a comment…" : "Login to comment…"}
                        className="rounded-2xl"
                        disabled={!isLoggedIn}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            addComment(activeEvent.id);
                          }
                        }}
                      />
                      <Button
                        className="rounded-2xl"
                        onClick={() => addComment(activeEvent.id)}
                        disabled={!isLoggedIn || commentText.trim().length === 0}
                      >
                        Post
                      </Button>
                    </div>

                    {activeEvent.comments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No comments yet. Be the first.</p>
                    ) : (
                      <div className="space-y-3">
                        {activeEvent.comments
                          .slice()
                          .sort((a, b) => b.createdAt - a.createdAt)
                          .map((c) => (
                            <div key={c.id} className="border rounded-3xl p-4">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold">{c.authorName}</p>
                                <p className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}</p>
                              </div>
                              <p className="text-sm mt-2 whitespace-pre-wrap leading-relaxed">{c.text}</p>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {!isLoggedIn && (
                  <Card className="border rounded-3xl">
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">Login to participate</p>
                        <p className="text-xs text-muted-foreground">
                          RSVP, add photos, comment, invite friends, and save events to your calendar.
                        </p>
                      </div>
                      <Button className="rounded-2xl" onClick={login}>
                        Login
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );

  function EventCard({
    event,
    myStatus,
    rsvpCount,
    interestedCount,
    goingCount,
    onOpen,
    onSetStatus,
  }: {
    event: EventItem;
    myStatus: RSVPStatus;
    rsvpCount: number;
    interestedCount: number;
    goingCount: number;
    onOpen: () => void;
    onSetStatus: (s: RSVPStatus) => void;
  }) {
    const latestComments = event.comments
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 2)
      .reverse();

    const photoThumbs = event.photos
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 3);

    return (
      <Card className="border rounded-3xl shadow-sm overflow-hidden">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <button type="button" onClick={onOpen} className="text-left">
                <p className="text-lg font-semibold leading-tight hover:underline">{event.title}</p>
              </button>
              <p className="text-xs text-muted-foreground mt-1">
                {event.category} · {event.communityLabel}
              </p>
            </div>

            <Button variant="outline" className="rounded-2xl" onClick={onOpen}>
              View
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {formatDate(event.startAt)}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {formatTime(event.startAt)}
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {event.location}
            </span>
          </div>

          {/* RSVP Preview */}
          <div className="border rounded-3xl p-4 bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">RSVP</p>
              <span className="text-xs text-muted-foreground">
                RSVP {rsvpCount} · Interested {interestedCount} · Going {goingCount}
              </span>
            </div>

            <RSVPButtons myStatus={myStatus} disabled={!isLoggedIn} onPick={onSetStatus} />

            {!isLoggedIn && (
              <Button variant="outline" className="rounded-2xl w-full" onClick={login}>
                Login to RSVP
              </Button>
            )}
          </div>

          {event.flyerUrl ? (
            <button type="button" onClick={onOpen} className="w-full text-left">
              <img
                src={event.flyerUrl}
                alt="Event flyer"
                className="w-full max-h-[240px] object-cover rounded-3xl border hover:opacity-95 transition"
              />
            </button>
          ) : null}

          {event.description ? (
            <p className="text-sm leading-relaxed line-clamp-3 whitespace-pre-wrap">{event.description}</p>
          ) : null}

          {(latestComments.length > 0 || photoThumbs.length > 0) && (
            <div className="border rounded-3xl p-4 space-y-3 bg-muted/20">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Updates</p>
                <span className="text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5" /> {event.comments.length}
                  </span>
                  {event.photos.length > 0 ? (
                    <span className="ml-3 inline-flex items-center gap-1">
                      <ImageIcon className="h-3.5 w-3.5" /> {event.photos.length}
                    </span>
                  ) : null}
                </span>
              </div>

              {latestComments.length > 0 && (
                <div className="space-y-2">
                  {latestComments.map((c) => (
                    <div key={c.id} className="text-sm">
                      <span className="font-semibold">{c.authorName}</span>{" "}
                      <span className="text-muted-foreground">· {c.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {photoThumbs.length > 0 && (
                <div className="flex gap-2">
                  {photoThumbs.map((p) => (
                    <img key={p.id} src={p.url} alt={p.name} className="h-16 w-16 object-cover rounded-2xl border" />
                  ))}
                </div>
              )}

              <Button variant="outline" className="rounded-2xl w-full" onClick={onOpen}>
                Open full thread & gallery
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-2xl" onClick={() => inviteFriends(event)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite friends
            </Button>

            <Button variant="outline" className="rounded-2xl" onClick={() => downloadICS(event)}>
              <Download className="h-4 w-4 mr-2" />
              Add to calendar
            </Button>

            <Button variant="outline" className="rounded-2xl" onClick={() => shareEvent(event)}>
              <Send className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
}

function RSVPButtons({
  myStatus,
  disabled,
  onPick,
}: {
  myStatus: RSVPStatus;
  disabled?: boolean;
  onPick: (s: RSVPStatus) => void;
}) {
  const activeClass = "bg-muted/70 border-primary/40";
  return (
    <div className="grid grid-cols-3 gap-2">
      <Button
        type="button"
        variant="outline"
        className={`rounded-2xl justify-start ${myStatus === "rsvp" ? activeClass : ""}`}
        disabled={disabled}
        onClick={() => onPick("rsvp")}
        title="RSVP"
      >
        <CheckCircle2 className="h-4 w-4 mr-2" />
        RSVP
      </Button>

      <Button
        type="button"
        variant="outline"
        className={`rounded-2xl justify-start ${myStatus === "interested" ? activeClass : ""}`}
        disabled={disabled}
        onClick={() => onPick("interested")}
        title="Interested"
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Interested
      </Button>

      <Button
        type="button"
        variant="outline"
        className={`rounded-2xl justify-start ${myStatus === "going" ? activeClass : ""}`}
        disabled={disabled}
        onClick={() => onPick("going")}
        title="Going"
      >
        <PartyPopper className="h-4 w-4 mr-2" />
        Going
      </Button>
    </div>
  );
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}
