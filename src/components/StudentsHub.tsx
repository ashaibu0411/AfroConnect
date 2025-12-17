// src/components/StudentsHub.tsx
import { useState, useMemo, useEffect } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectSeparator,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

import {
  GraduationCap,
  Plane,
  Home,
  Users,
  MapPin,
  MessageCircle,
  Globe2,
  Phone,
  Mail,
  Search,
  Inbox,
} from "lucide-react";

import CommunitySelector from "./CommunitySelector";
import AreaSelector from "./AreaSelector";
import LocationConfirmModal from "./LocationConfirmModal";
import { COMMUNITIES, DEFAULT_COMMUNITY_ID, Community } from "@/lib/communities";
import { toast } from "sonner";

// ----- Props -----
type StudentsHubProps = {
  onStartChat?: (title: string) => void;
};

// ----- Location keys (shared) -----
const LS_COMMUNITY_KEY = "afroconnect.communityId";
const LS_AREA_KEY_PREFIX = "afroconnect.areaId."; // + communityId
const LS_LOCATION_CONFIRMED = "afroconnect.locationConfirmed";

function getCommunityById(id: string): Community {
  return (
    COMMUNITIES.find((c) => c.id === id) ??
    COMMUNITIES.find((c) => c.id === DEFAULT_COMMUNITY_ID)!
  );
}

function getSavedAreaForCommunity(communityId: string) {
  return localStorage.getItem(`${LS_AREA_KEY_PREFIX}${communityId}`) || "all";
}

function isLocationConfirmed(): boolean {
  return localStorage.getItem(LS_LOCATION_CONFIRMED) === "true";
}

// ----- Mock Data Types -----
type StudentGroupType = "general" | "university" | "church" | "professional";

interface StudentGroup {
  id: string;
  name: string;
  city: string;
  country: string;
  type: StudentGroupType;
  members: number;
  description: string;
  tags: string[];
  areaId?: string; // NEW (optional for Accra areas, etc.)
}

interface HelpRequest {
  id: string;
  type: "housing" | "airport" | "orientation" | "mentorship" | "other";
  title: string;
  city: string;
  country: string;
  createdBy: string;
  createdAgo: string;
  details: string;
  urgent?: boolean;
  areaId?: string; // NEW
}

interface ResourceItem {
  id: string;
  category: "housing" | "jobs" | "transport" | "legal" | "finance";
  title: string;
  description: string;
  link?: string;
}

// ----- Mock Data -----
const STUDENT_GROUPS: StudentGroup[] = [
  {
    id: "1",
    name: "Denver Student Connect",
    city: "Denver",
    country: "USA",
    type: "university",
    members: 84,
    description: "Helping new and current students in Denver find housing, jobs, churches, and community.",
    tags: ["Denver", "New Students"],
  },
  {
    id: "2",
    name: "Atlanta African Students",
    city: "Atlanta",
    country: "USA",
    type: "university",
    members: 132,
    description: "Students around Atlanta connecting for support and opportunities.",
    tags: ["Atlanta", "Support"],
  },
  {
    id: "3",
    name: "Accra Student Welcome Team",
    city: "Accra",
    country: "Ghana",
    type: "church",
    members: 57,
    description: "Faith-based student community for prayer, fellowship, and practical help in Accra.",
    tags: ["Faith", "Accra", "Prayer"],
  },
  {
    id: "4",
    name: "Accra Tech Students (Osu)",
    city: "Accra",
    country: "Ghana",
    type: "professional",
    members: 46,
    description: "Students in tech connecting for mentorship, study groups, and opportunities.",
    tags: ["Tech", "Career"],
    areaId: "accra-osu",
  },
];

const HELP_REQUESTS: HelpRequest[] = [
  {
    id: "hr1",
    type: "housing",
    title: "Roommate needed near Aurora (student)",
    city: "Aurora",
    country: "USA",
    createdBy: "Akua (Ghana)",
    createdAgo: "2h ago",
    details: "Looking for a roommate to share a 2-bedroom apartment. Close to transport and groceries.",
    urgent: true,
  },
  {
    id: "hr2",
    type: "airport",
    title: "Airport pickup: Denver DIA – new student",
    city: "Denver",
    country: "USA",
    createdBy: "Tobi (Nigeria)",
    createdAgo: "6h ago",
    details: "Arriving at 3:40 PM. Need pickup or train/bus guidance.",
  },
  {
    id: "hr3",
    type: "mentorship",
    title: "Looking for cybersecurity mentor in Accra (Nima)",
    city: "Accra",
    country: "Ghana",
    createdBy: "Kwame (Ghana)",
    createdAgo: "1d ago",
    details: "Master’s student looking for guidance and career direction in cybersecurity.",
    areaId: "accra-nima",
  },
];

const RESOURCES: ResourceItem[] = [
  {
    id: "r1",
    category: "housing",
    title: "Student Housing Checklist",
    description: "What to check before signing a lease: safety, transport, utilities, roommates, and documents.",
  },
  {
    id: "r2",
    category: "jobs",
    title: "First Campus Job Guide",
    description: "How to find part-time jobs, write a simple resume, and follow your student work rules.",
  },
  {
    id: "r3",
    category: "transport",
    title: "Airport → City Transport Basics",
    description: "How to move from the airport to your city using train, bus, Uber, or shared rides.",
  },
  {
    id: "r4",
    category: "finance",
    title: "Opening a Bank Account",
    description: "Documents you need, common banks, and how to avoid unnecessary fees.",
  },
];

const GROUP_TYPE_LABEL: Record<StudentGroupType, string> = {
  general: "General",
  university: "University",
  church: "Church / Faith-based",
  professional: "Professional",
};

const HELP_TYPE_LABEL: Record<HelpRequest["type"], string> = {
  housing: "Housing & Roommates",
  airport: "Airport Pickup",
  orientation: "Orientation",
  mentorship: "Mentorship",
  other: "Other",
};

export default function StudentsHub({ onStartChat }: StudentsHubProps) {
  const { login, loginStatus, identity } = useInternetIdentity();

  // location (shared with HomeFeed/Groups)
  const [communityId, setCommunityId] = useState(() => {
    const saved = localStorage.getItem(LS_COMMUNITY_KEY);
    return saved || DEFAULT_COMMUNITY_ID;
  });
  const community = useMemo(() => getCommunityById(communityId), [communityId]);

  const [areaId, setAreaId] = useState<string>(() => getSavedAreaForCommunity(communityId));
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  useEffect(() => {
    setLocationModalOpen(!isLocationConfirmed());
  }, []);

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
    toast.success("Location saved.");
  };

  const skipLocation = () => {
    localStorage.setItem(LS_LOCATION_CONFIRMED, "true");
    setLocationModalOpen(false);
    toast.message("You can change your city anytime.");
  };

  // other state
  const [searchTerm, setSearchTerm] = useState("");
  const [helpTypeFilter, setHelpTypeFilter] = useState<HelpRequest["type"] | "all">("all");

  const isLoggedIn = !!identity && loginStatus === "success";
  const isLoggingIn = loginStatus === "logging-in";

  const showAreaUI = (community.areas ?? []).length > 0;

  // Filter groups by community + search + optional area
  const filteredGroups = useMemo(() => {
    return STUDENT_GROUPS.filter((group) => {
      const matchesCommunity =
        group.country.toLowerCase() === community.country.toLowerCase() &&
        group.city.toLowerCase() === community.city.toLowerCase();
      if (!matchesCommunity) return false;

      if (showAreaUI && areaId !== "all") {
        // only area-tagged groups appear in specific area feeds
        if (group.areaId !== areaId) return false;
      }

      const term = searchTerm.trim().toLowerCase();
      if (!term) return true;

      return (
        group.name.toLowerCase().includes(term) ||
        group.city.toLowerCase().includes(term) ||
        group.tags.some((tag) => tag.toLowerCase().includes(term))
      );
    });
  }, [community.city, community.country, searchTerm, showAreaUI, areaId]);

  const filteredHelpRequests = useMemo(() => {
    return HELP_REQUESTS.filter((hr) => {
      const matchesCommunity =
        hr.country.toLowerCase() === community.country.toLowerCase() &&
        hr.city.toLowerCase() === community.city.toLowerCase();
      if (!matchesCommunity) return false;

      if (showAreaUI && areaId !== "all") {
        if (hr.areaId !== areaId) return false;
      }

      const matchesType = helpTypeFilter === "all" ? true : hr.type === helpTypeFilter;
      return matchesType;
    });
  }, [community.city, community.country, helpTypeFilter, showAreaUI, areaId]);

  return (
    <div className="w-full min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      <LocationConfirmModal
        open={locationModalOpen}
        community={community}
        areaId={areaId}
        onChangeCommunity={(id) => setCommunityId(id)}
        onChangeArea={(id) => setAreaId(id)}
        onConfirm={confirmLocation}
        onSkip={skipLocation}
      />

      <div className="container py-6 space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <GraduationCap className="h-4 w-4" />
              <span>Students Hub</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Find help, housing, and community.
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
              Your feed is filtered by your selected city (and optional area where available).
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 md:items-end">
            {!isLoggedIn ? (
              <>
                <Button onClick={login} disabled={isLoggingIn} className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                  {isLoggingIn ? "Connecting..." : "Login to Join Student Groups"}
                </Button>
                <p className="text-xs text-muted-foreground max-w-xs text-left md:text-right">
                  You can browse, but login is needed to join groups, request help, or message.
                </p>
              </>
            ) : (
              <div className="flex flex-col items-start md:items-end">
                <Badge variant="outline" className="mb-1">
                  Logged in
                </Badge>
                <Button variant="outline" size="sm" onClick={() => setLocationModalOpen(true)}>
                  <MapPin className="h-4 w-4 mr-2" />
                  Change location
                </Button>
              </div>
            )}
          </div>
        </header>

        {/* Location + Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <MapPin className="h-5 w-5 text-primary" />
              Your location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1 md:col-span-1">
                <Label>City</Label>
                <CommunitySelector value={community} onChange={(c) => setCommunityId(c.id)} />
              </div>

              <div className="space-y-1 md:col-span-1">
                <Label>Area (optional)</Label>
                <AreaSelector community={community} value={areaId} onChange={setAreaId} />
              </div>

              <div className="space-y-1 md:col-span-1">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="Search groups, tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <p className="text-xs md:text-sm text-muted-foreground">
              Showing results for{" "}
              <span className="font-medium">
                {community.name}
                {showAreaUI && areaId !== "all"
                  ? ` · ${community.areas?.find((a) => a.id === areaId)?.name ?? "Area"}`
                  : ""}
              </span>
              .
            </p>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs defaultValue="new" className="w-full">
          <TabsList className="w-full grid grid-cols-1 md:grid-cols-3 mb-4">
            <TabsTrigger value="new" className="flex items-center gap-2">
              <Plane className="h-4 w-4" />
              <span className="hidden sm:inline">New & Incoming Students</span>
              <span className="sm:hidden">New</span>
            </TabsTrigger>
            <TabsTrigger value="current" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Current Students</span>
              <span className="sm:hidden">Current</span>
            </TabsTrigger>
            <TabsTrigger value="mentors" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <span>Mentors</span>
            </TabsTrigger>
          </TabsList>

          {/* New / Incoming */}
          <TabsContent value="new" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Plane className="h-5 w-5 text-primary" />
                    When you first land
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    Start with these steps to avoid confusion in your first week.
                  </p>
                  <ul className="space-y-2 text-xs md:text-sm">
                    <li className="flex gap-2"><span className="mt-0.5 text-primary">•</span> Join a student group in your city.</li>
                    <li className="flex gap-2"><span className="mt-0.5 text-primary">•</span> Introduce yourself and arrival date.</li>
                    <li className="flex gap-2"><span className="mt-0.5 text-primary">•</span> Ask early about housing and transport.</li>
                  </ul>

                  <Button
                    className="w-full mt-2"
                    variant={isLoggedIn ? "default" : "outline"}
                    onClick={!isLoggedIn ? login : undefined}
                  >
                    {isLoggedIn ? "Start by joining a group" : "Login to join a group"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Student groups near you
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredGroups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-sm text-muted-foreground">
                      <Inbox className="h-8 w-8 mb-2 opacity-50" />
                      <p>No groups found for this location.</p>
                      <p className="text-xs mt-1">
                        {showAreaUI && areaId !== "all" ? "Try switching to “All areas”." : "You can be the first to start one later."}
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[260px] pr-2">
                      <div className="space-y-3">
                        {filteredGroups.map((group) => (
                          <StudentGroupCard
                            key={group.id}
                            group={group}
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

            {/* Help Requests */}
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    Help requests near you
                  </CardTitle>

                  <div className="flex items-center gap-3">
                    <Select value={helpTypeFilter} onValueChange={(v) => setHelpTypeFilter(v as HelpRequest["type"] | "all")}>
                      <SelectTrigger className="h-8 w-[190px]">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        <SelectItem value="housing">Housing & Roommates</SelectItem>
                        <SelectItem value="airport">Airport Pickup</SelectItem>
                        <SelectItem value="orientation">Orientation</SelectItem>
                        <SelectItem value="mentorship">Mentorship</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>

                    {isLoggedIn && (
                      <Button size="sm" variant="outline">
                        Post a help request (coming soon)
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {filteredHelpRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-sm text-muted-foreground">
                    <Inbox className="h-8 w-8 mb-2 opacity-50" />
                    <p>No help requests found for this location.</p>
                    <p className="text-xs mt-1">
                      {showAreaUI && areaId !== "all" ? "Try switching to “All areas”." : "Once posting is enabled, you can create the first one."}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {filteredHelpRequests.map((req) => (
                      <HelpRequestCard key={req.id} request={req} onStartChat={onStartChat} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Current Students */}
          <TabsContent value="current" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe2 className="h-5 w-5 text-primary" />
                    Everyday student life
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Find part-time work, events, and practical advice in your city.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex gap-2"><span className="mt-0.5 text-primary">•</span> Share housing tips and warn others about scams.</li>
                    <li className="flex gap-2"><span className="mt-0.5 text-primary">•</span> Promote your home-based business to students nearby.</li>
                    <li className="flex gap-2"><span className="mt-0.5 text-primary">•</span> Invite new students to your church or community group.</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Home className="h-5 w-5 text-primary" />
                    Practical resources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[220px] pr-2">
                    <div className="space-y-3">
                      {RESOURCES.map((res) => (
                        <ResourceCard key={res.id} resource={res} />
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Ask the community a question
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1 md:col-span-1">
                    <Label>Your question title</Label>
                    <Input placeholder="Example: Best phone plan for new students?" />
                  </div>
                  <div className="space-y-1 md:col-span-1">
                    <Label>Topic</Label>
                    <Select defaultValue="general">
                      <SelectTrigger><SelectValue placeholder="Select topic" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="housing">Housing</SelectItem>
                        <SelectItem value="jobs">Jobs & Careers</SelectItem>
                        <SelectItem value="faith">Church & Faith</SelectItem>
                        <SelectItem value="immigration">Immigration / Legal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 md:col-span-1">
                    <Label>Preferred contact method</Label>
                    <Select defaultValue="in-app">
                      <SelectTrigger><SelectValue placeholder="Contact" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in-app">In-app messages</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Details</Label>
                  <Textarea rows={4} placeholder="Share a bit more so others can give specific advice..." />
                </div>

                <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Posting will be enabled soon. This is a preview of how it will look.
                  </p>
                  <Button disabled={!isLoggedIn} variant={isLoggedIn ? "default" : "outline"}>
                    {isLoggedIn ? "Preview post (coming soon)" : "Login to post questions"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mentors */}
          <TabsContent value="mentors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  Become a mentor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  If you’ve already survived culture shock and housing issues, you can help someone else.
                </p>
                <ul className="space-y-2">
                  <li className="flex gap-2"><span className="mt-0.5 text-primary">•</span> Offer 1–2 hours a month.</li>
                  <li className="flex gap-2"><span className="mt-0.5 text-primary">•</span> Help someone avoid expensive mistakes.</li>
                  <li className="flex gap-2"><span className="mt-0.5 text-primary">•</span> Build your network across cities.</li>
                </ul>

                <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mt-2">
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Mentor matching will be added soon.
                  </p>
                  <Button disabled={!isLoggedIn}>
                    {isLoggedIn ? "Register as a mentor (coming soon)" : "Login to become a mentor"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  Emergency & support contacts
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3 text-sm">
                <div className="space-y-1">
                  <p className="font-semibold flex items-center gap-2">
                    <Globe2 className="h-4 w-4 text-primary" />
                    Campus Emergency
                  </p>
                  <p className="text-muted-foreground">
                    Save your university emergency number in your favorites.
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    International Office
                  </p>
                  <p className="text-muted-foreground">
                    They can clarify visa questions and student work rules.
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold flex items-center gap-2">
                    <Home className="h-4 w-4 text-primary" />
                    Local Community
                  </p>
                  <p className="text-muted-foreground">
                    Use AfroConnect to find churches and local support near you.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-xs md:text-sm text-muted-foreground text-center pb-6">
          Students Hub is in early beta. We’ll add direct messaging, group chats, and verified mentor matching.
        </div>
      </div>
    </div>
  );
}

// ----- Subcomponents -----

function StudentGroupCard({
  group,
  isLoggedIn,
  onStartChat,
}: {
  group: StudentGroup;
  isLoggedIn: boolean;
  onStartChat?: (title: string) => void;
}) {
  const chatTitle = `Student Group: ${group.name}`;

  return (
    <Card className="border border-primary/10">
      <CardContent className="pt-4 space-y-3 text-sm">
        <div>
          <p className="font-semibold">{group.name}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3" />
            {group.city} · {group.country}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {GROUP_TYPE_LABEL[group.type]} · {group.members} members
          </p>
        </div>

        <p className="text-xs text-muted-foreground">{group.description}</p>

        <div className="flex flex-wrap gap-1">
          {group.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between pt-1">
          <Button size="sm" className="text-xs" disabled={!isLoggedIn}>
            {isLoggedIn ? "View & Join Group (coming soon)" : "Login to join"}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            title="Message this group"
            onClick={() => onStartChat?.(chatTitle)}
          >
            <MessageCircle className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function HelpRequestCard({
  request,
  onStartChat,
}: {
  request: HelpRequest;
  onStartChat?: (title: string) => void;
}) {
  const chatTitle = `Help Request: ${request.title}`;

  return (
    <Card className="border border-accent/20">
      <CardContent className="pt-4 space-y-3 text-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold">{request.title}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" />
              {request.city} · {request.country}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {request.createdBy} · {request.createdAgo}
            </p>
          </div>

          <Badge variant={request.urgent ? "destructive" : "outline"} className="text-[10px]">
            {HELP_TYPE_LABEL[request.type]}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground">{request.details}</p>

        <div className="flex items-center justify-between pt-1">
          <Button size="sm" className="text-xs">
            Offer help (coming soon)
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            title="Message about this request"
            onClick={() => onStartChat?.(chatTitle)}
          >
            <MessageCircle className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ResourceCard({ resource }: { resource: ResourceItem }) {
  const labelMap: Record<ResourceItem["category"], string> = {
    housing: "Housing",
    jobs: "Jobs & Career",
    transport: "Transport",
    legal: "Immigration & Legal",
    finance: "Money & Banking",
  };

  return (
    <div className="border border-border rounded-lg p-3 text-xs md:text-sm space-y-1">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">{resource.title}</p>
        <Badge variant="outline" className="text-[10px]">
          {labelMap[resource.category]}
        </Badge>
      </div>
      <p className="text-muted-foreground text-xs">{resource.description}</p>
    </div>
  );
}
