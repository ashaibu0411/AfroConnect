import { useMemo, useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  Users,
  Search,
  MessageCircle,
  MapPin,
  Lock,
  Globe2,
  Plus,
} from "lucide-react";

/* ---------------- Shared Chat Payload ----------------
   Keep this local so GroupsSection does NOT depend on StudentsHub.
------------------------------------------------------ */

export type StartChatPayload = {
  threadType: "business" | "person" | "student-group" | "student-help" | "group";
  title: string;
  subtitle?: string;
  context?: any;
};

/* ---------------- Types ---------------- */

type GroupType = "church" | "community" | "professional" | "students";

type Group = {
  id: string;
  name: string;
  description: string;
  type: GroupType;
  privacy: "public" | "private";
  members: number;

  city?: string;
  state?: string;
  country?: string;
  tags?: string[];
};

/* ---------------- Mock Data ---------------- */

const GROUPS: Group[] = [
  {
    id: "g1",
    name: "Shanah City Young Adults",
    description:
      "A vibrant young adults community for worship, fellowship, and real-life growth.",
    type: "church",
    privacy: "public",
    members: 186,
    city: "Aurora",
    state: "CO",
    country: "USA",
    tags: ["Worship", "Community", "Growth"],
  },
  {
    id: "g2",
    name: "Denver African Professionals",
    description:
      "Networking, mentorship, and opportunities for African professionals in Denver.",
    type: "professional",
    privacy: "public",
    members: 312,
    city: "Denver",
    state: "CO",
    country: "USA",
    tags: ["Career", "Networking", "Mentorship"],
  },
  {
    id: "g3",
    name: "Colorado New Immigrants Help Desk",
    description:
      "Practical help for newcomers: housing tips, school systems, DMV, and local resources.",
    type: "community",
    privacy: "public",
    members: 420,
    city: "Aurora",
    state: "CO",
    country: "USA",
    tags: ["Housing", "Resources", "Support"],
  },
  {
    id: "g4",
    name: "Private Leaders Circle",
    description:
      "A private leadership group for organizers and community builders (invite-only).",
    type: "community",
    privacy: "private",
    members: 38,
    city: "Denver",
    state: "CO",
    country: "USA",
    tags: ["Leadership", "Strategy"],
  },
];

/* ---------------- Helpers ---------------- */

const GROUP_TYPE_LABEL: Record<GroupType, string> = {
  church: "Church",
  community: "Community",
  professional: "Professional",
  students: "Students",
};

function initialsFromTitle(title: string) {
  return title
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function locationLabel(g: Group) {
  return [g.city, g.state, g.country].filter(Boolean).join(", ");
}

/* ---------------- Component ---------------- */

export default function GroupsSection({
  onStartChat,
}: {
  onStartChat?: (payload: StartChatPayload) => void;
}) {
  const { login, loginStatus, identity } = useInternetIdentity();

  const [activeTab, setActiveTab] = useState<
    "all" | "church" | "community" | "professional" | "students"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");

  const isLoggedIn = !!identity && loginStatus === "success";
  const isLoggingIn = loginStatus === "logging-in";

  const filteredGroups = useMemo(() => {
    return GROUPS.filter((g) => {
      if (activeTab !== "all" && g.type !== activeTab) return false;
      if (!searchTerm.trim()) return true;

      const t = searchTerm.toLowerCase();
      return (
        g.name.toLowerCase().includes(t) ||
        g.description.toLowerCase().includes(t) ||
        (g.tags ?? []).some((x) => x.toLowerCase().includes(t)) ||
        locationLabel(g).toLowerCase().includes(t)
      );
    });
  }, [activeTab, searchTerm]);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-6xl mx-auto py-6 space-y-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Users className="h-4 w-4" />
              <span>Groups · Community & Interest</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Find and message groups in separate threads.
            </h1>

            <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
              Group chats open as their own thread type in Messages so everything stays organized.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2">
            {!isLoggedIn ? (
              <>
                <Button
                  onClick={login}
                  disabled={isLoggingIn}
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
                >
                  {isLoggingIn ? "Connecting..." : "Login to Join Groups"}
                </Button>
                <p className="text-xs text-muted-foreground max-w-xs text-left md:text-right">
                  Browse is public. Login is required to join and message groups.
                </p>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant="outline">Logged in</Badge>
                <Button size="sm" variant="outline" disabled>
                  <Plus className="h-4 w-4 mr-2" />
                  Create group (coming soon)
                </Button>
              </div>
            )}
          </div>
        </header>

        {/* Search + Tabs */}
        <Card>
          <CardHeader className="space-y-3">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Find a group
            </CardTitle>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="w-full grid grid-cols-2 md:grid-cols-5">
                <TabsTrigger value="all" className="text-xs">
                  All
                </TabsTrigger>
                <TabsTrigger value="church" className="text-xs">
                  Church
                </TabsTrigger>
                <TabsTrigger value="community" className="text-xs">
                  Community
                </TabsTrigger>
                <TabsTrigger value="professional" className="text-xs">
                  Professional
                </TabsTrigger>
                <TabsTrigger value="students" className="text-xs">
                  Students
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Search by name, city, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>

          <CardContent>
            {filteredGroups.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No groups found. Try different keywords.
              </div>
            ) : (
              <ScrollArea className="h-[480px] pr-2">
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredGroups.map((g) => (
                    <GroupCard
                      key={g.id}
                      group={g}
                      isLoggedIn={isLoggedIn}
                      onStartChat={onStartChat}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ---------------- Subcomponent ---------------- */

function GroupCard({
  group,
  isLoggedIn,
  onStartChat,
}: {
  group: Group;
  isLoggedIn: boolean;
  onStartChat?: (payload: StartChatPayload) => void;
}) {
  const isPrivate = group.privacy === "private";
  const loc = locationLabel(group);

  return (
    <Card className="border border-primary/10">
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/assets/generated/default-avatar.dim_100x100.png" />
              <AvatarFallback className="text-xs">
                {initialsFromTitle(group.name)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <p className="font-semibold truncate">{group.name}</p>

              <div className="flex items-center gap-2 flex-wrap mt-1">
                <Badge variant="outline" className="text-[10px]">
                  {GROUP_TYPE_LABEL[group.type]}
                </Badge>

                {isPrivate ? (
                  <Badge
                    variant="secondary"
                    className="text-[10px] inline-flex items-center gap-1"
                  >
                    <Lock className="h-3 w-3" />
                    Private
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="text-[10px] inline-flex items-center gap-1"
                  >
                    <Globe2 className="h-3 w-3" />
                    Public
                  </Badge>
                )}

                <span className="text-[11px] text-muted-foreground">
                  {group.members} members
                </span>
              </div>

              {!!loc && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {loc}
                </p>
              )}
            </div>
          </div>

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            title="Open group thread"
            disabled={!isLoggedIn}
            onClick={() => {
              if (!isLoggedIn) return;

              onStartChat?.({
                threadType: "group",
                title: `Group: ${group.name}`,
                subtitle: loc
                  ? `${GROUP_TYPE_LABEL[group.type]} · ${loc}`
                  : `${GROUP_TYPE_LABEL[group.type]} · AfroConnect`,
                context: {
                  group: {
                    id: group.id,
                    name: group.name,
                    description: group.description,
                    type: group.type,
                    privacy: group.privacy,
                    members: group.members,
                    city: group.city,
                    state: group.state,
                    country: group.country,
                    tags: group.tags ?? [],
                  },
                },
              });
            }}
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">{group.description}</p>

        {!!group.tags?.length && (
          <div className="flex flex-wrap gap-1">
            {group.tags.slice(0, 6).map((t) => (
              <Badge key={t} variant="outline" className="text-[10px]">
                {t}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <Button size="sm" className="text-xs" disabled={!isLoggedIn}>
            {isLoggedIn ? "View & Join (coming soon)" : "Login to join"}
          </Button>

          <span className="text-[11px] text-muted-foreground">
            {isPrivate ? "Invite-only" : "Open"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
