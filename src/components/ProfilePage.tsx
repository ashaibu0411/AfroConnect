// src/components/ProfilePage.tsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarDays, Image as ImageIcon, Plus, Pencil, MapPin } from "lucide-react";
import { toast } from "sonner";

type Props = { communityLabel?: string };

type ProfileData = {
  displayName: string;
  bio: string;
  interests: string;
  avatarUrl?: string;
};

type LocalEvent = {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  visibility: "public" | "private";
  description?: string;
};

const LS_PROFILE = "afroconnect.profile";
const LS_AVATAR_URL = "afroconnect.avatarUrl";
const LS_EVENTS = "afroconnect.events";

const PROFILE_UPDATED_EVENT = "afroconnect.profileUpdated";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readProfile(): ProfileData {
  const fallback: ProfileData = {
    displayName: "Guest",
    bio: "",
    interests: "",
    avatarUrl: localStorage.getItem(LS_AVATAR_URL) || undefined,
  };
  const p = safeParse<ProfileData>(localStorage.getItem(LS_PROFILE), fallback);
  return {
    ...fallback,
    ...p,
    avatarUrl: localStorage.getItem(LS_AVATAR_URL) || p.avatarUrl,
  };
}

function saveProfile(p: ProfileData) {
  localStorage.setItem(LS_PROFILE, JSON.stringify(p));
  if (p.avatarUrl) localStorage.setItem(LS_AVATAR_URL, p.avatarUrl);
  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
}

function readEvents(): LocalEvent[] {
  return safeParse<LocalEvent[]>(localStorage.getItem(LS_EVENTS), []);
}

function saveEvents(events: LocalEvent[]) {
  localStorage.setItem(LS_EVENTS, JSON.stringify(events));
}

export default function ProfilePage({ communityLabel }: Props) {
  const label = communityLabel || "Your community";

  const [profile, setProfile] = useState<ProfileData>(() => readProfile());
  const [editing, setEditing] = useState(false);

  const [events, setEvents] = useState<LocalEvent[]>(() => readEvents());
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  const [newEvent, setNewEvent] = useState<LocalEvent>(() => ({
    id: crypto?.randomUUID?.() ?? String(Date.now()),
    title: "",
    date: "",
    time: "",
    location: label,
    visibility: "public",
    description: "",
  }));

  useEffect(() => {
    const avatarUrl = localStorage.getItem(LS_AVATAR_URL) || undefined;
    setProfile((p) => ({ ...p, avatarUrl }));
  }, []);

  const profileProgress = useMemo(() => {
    let score = 0;
    if (profile.displayName && profile.displayName !== "Guest") score += 1;
    if (profile.avatarUrl) score += 1;
    if (profile.bio?.trim()) score += 1;
    if (profile.interests?.trim()) score += 1;
    const pct = Math.round((score / 4) * 100);
    return { score, pct };
  }, [profile]);

  const myPostsMock = useMemo(
    () => [
      {
        id: "p1",
        content: "Needing a little concrete job in front of my house. Any recommendations?",
        timeAgo: "1w",
        stats: { likes: 1, comments: 15 },
      },
      {
        id: "p2",
        content: "Anyone available to check out sensor issue in my garage later this afternoon?",
        timeAgo: "4w",
        stats: { likes: 0, comments: 2 },
      },
    ],
    []
  );

  const onPickAvatar = async (file: File | null) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      localStorage.setItem(LS_AVATAR_URL, dataUrl);

      const nextProfile: ProfileData = { ...profile, avatarUrl: dataUrl };
      saveProfile(nextProfile);
      setProfile(nextProfile);

      toast.success("Profile photo updated.");
    };
    reader.onerror = () => toast.error("Failed to read the image. Try a different file.");
    reader.readAsDataURL(file);
  };

  const onSaveProfile = () => {
    const clean: ProfileData = {
      displayName: profile.displayName.trim() || "Guest",
      bio: profile.bio,
      interests: profile.interests,
      avatarUrl: profile.avatarUrl,
    };

    saveProfile(clean);
    setProfile(clean);
    setEditing(false);

    toast.success("Profile saved.");
  };

  const onCreateEvent = () => {
    if (!newEvent.title.trim() || !newEvent.date.trim()) {
      toast.error("Event Title and Date are required.");
      return;
    }

    const eventToSave: LocalEvent = {
      ...newEvent,
      id: crypto?.randomUUID?.() ?? String(Date.now()),
      title: newEvent.title.trim(),
      location: newEvent.location?.trim() || label,
      description: newEvent.description?.trim() || "",
    };

    const next = [eventToSave, ...events];
    setEvents(next);
    saveEvents(next);

    setShowCreateEvent(false);
    setNewEvent({
      id: crypto?.randomUUID?.() ?? String(Date.now()),
      title: "",
      date: "",
      time: "",
      location: label,
      visibility: "public",
      description: "",
    });

    toast.success("Event created (local). Next: wire to backend + visibility rules.");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container max-w-4xl py-6 space-y-6">
        <Card className="border">
          <CardContent className="p-6">
            <div className="flex items-start gap-5">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  {profile.avatarUrl ? <AvatarImage src={profile.avatarUrl} /> : null}
                  <AvatarFallback className="text-lg">{initials(profile.displayName)}</AvatarFallback>
                </Avatar>

                <label className="mt-3 inline-flex items-center gap-2 text-xs cursor-pointer select-none">
                  <span className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-background hover:bg-muted/60 transition">
                    <ImageIcon className="h-4 w-4" />
                    Upload photo
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onPickAvatar(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="text-2xl font-bold truncate">{profile.displayName}</h1>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{label}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setEditing((v) => !v)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      {editing ? "Cancel" : "Edit profile"}
                    </Button>

                    <Button variant="outline" onClick={() => toast.info("Business pages: next step.")}>
                      Add business page
                    </Button>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Profile Progress</span>
                    <span className="text-muted-foreground">{profileProgress.pct}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-2 bg-primary" style={{ width: `${profileProgress.pct}%` }} />
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                      Add your interests
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toast.info("Already available: upload photo button.")}>
                      Upload a profile photo
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                      Add a bio
                    </Button>
                  </div>
                </div>

                {editing ? (
                  <div className="mt-5 grid gap-4">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Display name</label>
                      <Input
                        value={profile.displayName}
                        onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
                        placeholder="Your name"
                      />
                    </div>

                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Bio</label>
                      <Textarea
                        value={profile.bio}
                        onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                        placeholder="Tell people about you..."
                      />
                    </div>

                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Interests (comma-separated)</label>
                      <Input
                        value={profile.interests}
                        onChange={(e) => setProfile((p) => ({ ...p, interests: e.target.value }))}
                        placeholder="e.g. Jobs, Housing, Church, Soccer, Networking"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setEditing(false)}>
                        Cancel
                      </Button>
                      <Button onClick={onSaveProfile}>Save</Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Dashboard</CardTitle>
          </CardHeader>

          <CardContent className="pt-0">
            <Tabs defaultValue="posts">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="posts">Posts</TabsTrigger>
                <TabsTrigger value="events">Events</TabsTrigger>
                <TabsTrigger value="about">About</TabsTrigger>
              </TabsList>

              <TabsContent value="posts" className="mt-4">
                <ScrollArea className="h-[420px] pr-3">
                  <div className="space-y-4">
                    {myPostsMock.map((p) => (
                      <Card key={p.id} className="border">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                {profile.avatarUrl ? <AvatarImage src={profile.avatarUrl} /> : null}
                                <AvatarFallback>{initials(profile.displayName)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-semibold">{profile.displayName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {label} · {p.timeAgo}
                                </p>
                              </div>
                            </div>

                            <Button variant="ghost" size="sm" onClick={() => toast.info("Post actions: next step.")}>
                              •••
                            </Button>
                          </div>

                          <p className="text-sm">{p.content}</p>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>♥️ {p.stats.likes}</span>
                            <span>💬 {p.stats.comments}</span>
                          </div>

                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => toast.info("Like: wire to backend.")}>
                              Like
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => toast.info("Comment: wire to backend.")}>
                              Comment
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="events" className="mt-4">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    <span>Events you created / signed up for (local for now)</span>
                  </div>

                  <Button onClick={() => setShowCreateEvent(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create event
                  </Button>
                </div>

                {showCreateEvent ? (
                  <Card className="border mb-4">
                    <CardContent className="p-4 space-y-3">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Event title *</label>
                        <Input
                          value={newEvent.title}
                          onChange={(e) => setNewEvent((ev) => ({ ...ev, title: e.target.value }))}
                          placeholder="e.g. AfroConnect Hangout"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <label className="text-sm font-medium">Date *</label>
                          <Input
                            type="date"
                            value={newEvent.date}
                            onChange={(e) => setNewEvent((ev) => ({ ...ev, date: e.target.value }))}
                          />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-sm font-medium">Time</label>
                          <Input
                            type="time"
                            value={newEvent.time || ""}
                            onChange={(e) => setNewEvent((ev) => ({ ...ev, time: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Location</label>
                        <Input
                          value={newEvent.location || ""}
                          onChange={(e) => setNewEvent((ev) => ({ ...ev, location: e.target.value }))}
                          placeholder={label}
                        />
                      </div>

                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Visibility</label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={newEvent.visibility === "public" ? "default" : "outline"}
                            onClick={() => setNewEvent((ev) => ({ ...ev, visibility: "public" }))}
                          >
                            Public
                          </Button>
                          <Button
                            type="button"
                            variant={newEvent.visibility === "private" ? "default" : "outline"}
                            onClick={() => setNewEvent((ev) => ({ ...ev, visibility: "private" }))}
                          >
                            Private
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                          value={newEvent.description || ""}
                          onChange={(e) => setNewEvent((ev) => ({ ...ev, description: e.target.value }))}
                          placeholder="Add details..."
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowCreateEvent(false)}>
                          Cancel
                        </Button>
                        <Button onClick={onCreateEvent}>Create</Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                <div className="space-y-3">
                  {events.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No events yet. Create one to get started.</p>
                  ) : (
                    events.map((ev) => (
                      <Card key={ev.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold">{ev.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {ev.date}
                                {ev.time ? ` · ${ev.time}` : ""} · {ev.location || label}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">Visibility: {ev.visibility}</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => toast.info("Event details page: next step.")}>
                              View
                            </Button>
                          </div>

                          {ev.description ? <p className="text-sm mt-3">{ev.description}</p> : null}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="about" className="mt-4">
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Bio:</span>{" "}
                    <span className="text-muted-foreground">{profile.bio || "—"}</span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Interests:</span>{" "}
                    <span className="text-muted-foreground">{profile.interests || "—"}</span>
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground py-8">
          ©️ {new Date().getFullYear()} AfroConnect. Built with ❤️ for the African diaspora.
        </div>
      </div>
    </div>
  );
}
