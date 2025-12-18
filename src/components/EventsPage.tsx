import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CalendarPlus,
  Users,
  Image as ImageIcon,
  MessageCircle,
  Share2,
  X,
  LogIn,
} from "lucide-react";

type Props = {
  communityLabel: string;
  isLoggedIn: boolean;
  onLogin: () => void;
};

type RSVP = "going" | "interested" | null;

type EventComment = {
  id: string;
  author: string;
  text: string;
  createdAt: number;
};

type EventItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  flyer?: string;
  comments: EventComment[];
  rsvp: {
    going: number;
    interested: number;
    mine: RSVP;
  };
};

const LS_EVENTS = "afroconnect.events.v1";
const LS_PROFILE = "afroconnect.profile";

function uid() {
  return crypto.randomUUID();
}

function readName() {
  try {
    return JSON.parse(localStorage.getItem(LS_PROFILE) || "{}").displayName || "User";
  } catch {
    return "User";
  }
}

export default function EventsPage({ communityLabel, isLoggedIn, onLogin }: Props) {
  const [events, setEvents] = useState<EventItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_EVENTS) || "[]");
    } catch {
      return [];
    }
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeEvent, setActiveEvent] = useState<EventItem | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [flyer, setFlyer] = useState<string | undefined>();
  const flyerRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    localStorage.setItem(LS_EVENTS, JSON.stringify(events));
  }, [events]);

  function createEvent() {
    if (!isLoggedIn) {
      onLogin();
      return;
    }

    if (!title || !date) {
      toast.error("Event title and date are required");
      return;
    }

    const ev: EventItem = {
      id: uid(),
      title,
      description,
      date,
      location,
      flyer,
      comments: [],
      rsvp: { going: 0, interested: 0, mine: null },
    };

    setEvents((p) => [ev, ...p]);
    setTitle("");
    setDescription("");
    setDate("");
    setLocation("");
    setFlyer(undefined);

    toast.success("Event created");
  }

  function rsvp(eventId: string, type: RSVP) {
    if (!isLoggedIn) {
      onLogin();
      return;
    }

    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== eventId) return e;
        const mine = e.rsvp.mine;
        return {
          ...e,
          rsvp: {
            going: e.rsvp.going + (type === "going" && mine !== "going" ? 1 : mine === "going" ? -1 : 0),
            interested:
              e.rsvp.interested +
              (type === "interested" && mine !== "interested" ? 1 : mine === "interested" ? -1 : 0),
            mine: mine === type ? null : type,
          },
        };
      })
    );
  }

  function addComment(eventId: string, text: string) {
    if (!isLoggedIn) {
      onLogin();
      return;
    }

    if (!text.trim()) return;

    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              comments: [
                ...e.comments,
                { id: uid(), author: readName(), text, createdAt: Date.now() },
              ],
            }
          : e
      )
    );
  }

  function addToCalendar(e: EventItem) {
    const ics = `
BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:${e.title}
DTSTART:${e.date.replace(/-/g, "")}
DESCRIPTION:${e.description}
LOCATION:${e.location}
END:VEVENT
END:VCALENDAR
    `.trim();

    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${e.title}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="container max-w-5xl py-8 space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Community Events</h1>
        {!isLoggedIn && (
          <Button onClick={onLogin}>
            <LogIn className="h-4 w-4 mr-2" /> Login
          </Button>
        )}
      </div>

      {/* CREATE EVENT */}
      <Card className="rounded-2xl">
        <CardHeader>Create Event</CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Event title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
          <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />

          <input
            ref={flyerRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => setFlyer(String(reader.result));
              reader.readAsDataURL(file);
            }}
          />

          <Button variant="outline" onClick={() => flyerRef.current?.click()}>
            <ImageIcon className="h-4 w-4 mr-2" /> Upload Flyer
          </Button>

          <Button onClick={createEvent}>Create Event</Button>
        </CardContent>
      </Card>

      {/* EVENTS LIST */}
      {events.map((e) => (
        <Card key={e.id} className="rounded-2xl">
          <CardContent className="p-5 space-y-3">
            {e.flyer && <img src={e.flyer} className="rounded-xl max-h-64 w-full object-cover" />}
            <h3 className="text-lg font-semibold">{e.title}</h3>
            <p className="text-sm text-muted-foreground">{e.date} · {e.location}</p>

            {/* RSVP */}
            <div className="flex gap-2">
              <Button size="sm" variant={e.rsvp.mine === "going" ? "default" : "outline"} onClick={() => rsvp(e.id, "going")}>
                Going ({e.rsvp.going})
              </Button>
              <Button
                size="sm"
                variant={e.rsvp.mine === "interested" ? "default" : "outline"}
                onClick={() => rsvp(e.id, "interested")}
              >
                Interested ({e.rsvp.interested})
              </Button>
            </div>

            {/* COMMENTS PREVIEW */}
            {e.comments.slice(-2).map((c) => (
              <p key={c.id} className="text-sm">
                <strong>{c.author}:</strong> {c.text}
              </p>
            ))}

            {/* ACTIONS */}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { setActiveEvent(e); setDrawerOpen(true); }}>
                <MessageCircle className="h-4 w-4 mr-2" /> View
              </Button>
              <Button size="sm" variant="outline" onClick={() => addToCalendar(e)}>
                <CalendarPlus className="h-4 w-4 mr-2" /> Calendar
              </Button>
              <Button size="sm" variant="outline">
                <Share2 className="h-4 w-4 mr-2" /> Invite
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* DRAWER */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>{activeEvent?.title}</SheetTitle>
          </SheetHeader>

          {activeEvent && (
            <div className="space-y-4 mt-4">
              <p>{activeEvent.description}</p>

              <Textarea
                placeholder="Write a comment…"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addComment(activeEvent.id, (e.target as HTMLTextAreaElement).value);
                    (e.target as HTMLTextAreaElement).value = "";
                  }
                }}
              />

              {activeEvent.comments.map((c) => (
                <div key={c.id} className="border rounded-xl p-3">
                  <strong>{c.author}</strong>
                  <p>{c.text}</p>
                </div>
              ))}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
