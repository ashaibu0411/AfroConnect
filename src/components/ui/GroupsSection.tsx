// src/components/GroupsSection.tsx
import { useMemo, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, Plus, Lock, EyeOff, Globe, MapPin } from "lucide-react";

import GroupDetails, { Group } from "./GroupDetails";

import CommunitySelector from "./CommunitySelector";
import AreaSelector from "./AreaSelector";
import LocationConfirmModal from "./LocationConfirmModal";
import { COMMUNITIES, DEFAULT_COMMUNITY_ID, Community } from "@/lib/communities";
import { toast } from "sonner";

type Visibility = "public" | "private" | "hidden";

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

const SAMPLE_GROUPS: (Group & { areaId?: string })[] = [
  {
    id: "g1",
    name: "Denver African Professionals",
    description: "Networking, job leads, meetups, and collaboration for African professionals in Colorado.",
    visibility: "public",
    memberCount: 128,
    city: "Denver",
    state: "CO",
    country: "USA",
    tags: ["Jobs", "Networking", "Meetups"],
    rules: ["Be respectful.", "No spam or scams.", "Job posts must include location + role."],
  },
  {
    id: "g2",
    name: "Aurora Home-Based Business Circle",
    description: "For home-based businesses: sell locally, share inventory updates, and collaborate.",
    visibility: "private",
    memberCount: 64,
    city: "Aurora",
    state: "CO",
    country: "USA",
    tags: ["Marketplace", "Vendors", "Inventory"],
    rules: ["Only verified sellers can post inventory.", "No harassment.", "Keep conversations local and helpful."],
  },
  {
    id: "g3",
    name: "International Students — Texas",
    description: "Support for new students: housing tips, rides, campus resources, and community.",
    visibility: "public",
    memberCount: 211,
    city: "Dallas",
    state: "TX",
    country: "USA",
    tags: ["Students", "Housing", "Help"],
    rules: ["No sharing private student data publicly.", "Use the Resources posts for common FAQs."],
  },
  {
    id: "g4",
    name: "Faith & Fellowship — Denver",
    description: "Faith groups, prayer meetups, and local church connections.",
    visibility: "hidden",
    memberCount: 32,
    city: "Denver",
    state: "CO",
    country: "USA",
    tags: ["Faith", "Prayer", "Community"],
    rules: ["Invite-only. Keep it safe and respectful."],
  },

  // Accra examples (with areaId)
  {
    id: "g5",
    name: "Accra Young Professionals",
    description: "Meetups, business networking, and career connections in Accra.",
    visibility: "public",
    memberCount: 89,
    city: "Accra",
    state: "Greater Accra",
    country: "Ghana",
    tags: ["Networking", "Career"],
    rules: ["Be respectful.", "No scams."],
  },
  {
    id: "g6",
    name: "Nima Community Connect",
    description: "Local updates, help requests, and community support around Nima.",
    visibility: "public",
    memberCount: 54,
    city: "Accra",
    state: "Greater Accra",
    country: "Ghana",
    areaId: "accra-nima",
    tags: ["Community", "Help"],
    rules: ["Be respectful.", "No harassment."],
  },
  {
    id: "g7",
    name: "Osu Entrepreneurs Circle",
    description: "Business owners and startups around Osu sharing opportunities.",
    visibility: "public",
    memberCount: 41,
    city: "Accra",
    state: "Greater Accra",
    country: "Ghana",
    areaId: "accra-osu",
    tags: ["Business", "Startups"],
    rules: ["No spam.", "Keep it relevant to Osu area."],
  },
];

function visibilityBadge(v: Visibility) {
  if (v === "public")
    return (
      <Badge variant="outline" className="text-xs flex items-center gap-1">
        <Globe className="h-3 w-3" /> Public
      </Badge>
    );
  if (v === "private")
    return (
      <Badge variant="secondary" className="text-xs flex items-center gap-1">
        <Lock className="h-3 w-3" /> Private
      </Badge>
    );
  return (
    <Badge variant="secondary" className="text-xs flex items-center gap-1">
      <EyeOff className="h-3 w-3" /> Hidden
    </Badge>
  );
}

export default function GroupsSection() {
  // location state (shared keys with HomeFeed)
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

  // existing UI state
  const [search, setSearch] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<Visibility | "all">("all");
  const [selectedGroupId, setSelectedGroupId] = useState<string>(SAMPLE_GROUPS[0]?.id ?? "");
  const [myGroups, setMyGroups] = useState<Set<string>>(new Set());

  // Create Group modal state (mock)
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newVisibility, setNewVisibility] = useState<Visibility>("public");
  const [newCity, setNewCity] = useState(community.city);
  const [newState, setNewState] = useState("N/A");
  const [newCountry, setNewCountry] = useState(community.country);

  // keep create form aligned with selected community
  useEffect(() => {
    setNewCity(community.city);
    setNewCountry(community.country);
  }, [community.city, community.country]);

  const showAreaUI = (community.areas ?? []).length > 0;

  const groups = useMemo(() => {
    return SAMPLE_GROUPS.filter((g) => {
      // 1) community filter (city + country)
      const matchesCommunity =
        g.city.toLowerCase() === community.city.toLowerCase() &&
        g.country.toLowerCase() === community.country.toLowerCase();
      if (!matchesCommunity) return false;

      // 2) area filter (only when community has areas)
      if (showAreaUI && areaId !== "all") {
        // Only show groups explicitly tagged to that area
        return (g as any).areaId === areaId;
      }

      // 3) visibility filter
      if (visibilityFilter !== "all" && g.visibility !== visibilityFilter) return false;

      // 4) search filter
      if (!search.trim()) return true;
      const term = search.toLowerCase();
      return (
        g.name.toLowerCase().includes(term) ||
        g.description.toLowerCase().includes(term) ||
        (g.tags ?? []).some((t) => t.toLowerCase().includes(term)) ||
        `${g.city} ${g.state} ${g.country}`.toLowerCase().includes(term)
      );
    });
  }, [search, visibilityFilter, community.city, community.country, showAreaUI, areaId]);

  const selected = groups.find((g) => g.id === selectedGroupId) ?? groups[0];

  useEffect(() => {
    if (!selected && groups.length > 0) setSelectedGroupId(groups[0].id);
  }, [groups, selected]);

  const toggleJoin = (groupId: string) => {
    setMyGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const handleCreateGroupMock = () => {
    setNewName("");
    setNewDesc("");
    setNewVisibility("public");
    setNewCity(community.city);
    setNewState("N/A");
    setNewCountry(community.country);
    alert("Mock: Group created. Next step is wiring this to the backend.");
  };

  return (
    <div className="w-full h-full flex flex-col bg-background">
      <LocationConfirmModal
        open={locationModalOpen}
        community={community}
        areaId={areaId}
        onChangeCommunity={(id) => setCommunityId(id)}
        onChangeArea={(id) => setAreaId(id)}
        onConfirm={confirmLocation}
        onSkip={skipLocation}
      />

      <div className="grid h-[calc(100vh-120px)] md:h-[650px] grid-cols-1 md:grid-cols-[360px,1fr] border rounded-lg overflow-hidden">
        {/* LEFT: Group list */}
        <div className="border-r bg-muted/40 flex flex-col">
          <div className="px-4 py-3 border-b flex flex-col gap-3">
            {/* Location row */}
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold">Interest Groups</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {community.name}
                  {showAreaUI && areaId !== "all"
                    ? ` · ${community.areas?.find((a) => a.id === areaId)?.name ?? "Area"}`
                    : ""}
                </p>
              </div>

              <Button variant="outline" size="sm" onClick={() => setLocationModalOpen(true)}>
                <MapPin className="h-4 w-4 mr-1" />
                Location
              </Button>
            </div>

            {/* Inline selectors (clean + optional) */}
            <div className="flex flex-col gap-2">
              <CommunitySelector value={community} onChange={(c) => setCommunityId(c.id)} />
              <AreaSelector community={community} value={areaId} onChange={setAreaId} />
            </div>

            {/* Create group button */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <p className="text-[11px] text-muted-foreground">Find people by location & interest</p>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1">
                    <Plus className="h-4 w-4" />
                    Create
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create a Group (Mock)</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Group name</Label>
                      <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Accra Students Connect" />
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="What is this group for?" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Visibility</Label>
                        <Select value={newVisibility} onValueChange={(v) => setNewVisibility(v as Visibility)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                            <SelectItem value="hidden">Hidden</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Country</Label>
                        <Input value={newCountry} onChange={(e) => setNewCountry(e.target.value)} />
                      </div>

                      <div className="space-y-2">
                        <Label>State</Label>
                        <Input value={newState} onChange={(e) => setNewState(e.target.value)} />
                      </div>

                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input value={newCity} onChange={(e) => setNewCity(e.target.value)} />
                      </div>
                    </div>

                    <Button
                      onClick={handleCreateGroupMock}
                      disabled={!newName.trim() || !newDesc.trim()}
                      className="w-full"
                    >
                      Create Group
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8 h-9 text-sm"
                placeholder="Search groups..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Visibility filter */}
            <Select value={visibilityFilter} onValueChange={(v) => setVisibilityFilter(v as any)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="flex-1">
            <div className="py-2">
              {groups.length === 0 ? (
                <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                  No groups found for this location.
                  {showAreaUI && areaId !== "all" ? " Try switching to “All areas”." : ""}
                </div>
              ) : (
                groups.map((g) => {
                  const isSelected = g.id === selectedGroupId;
                  const joined = myGroups.has(g.id);

                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setSelectedGroupId(g.id)}
                      className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-muted/80 transition ${
                        isSelected ? "bg-muted" : ""
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold truncate">{g.name}</p>
                          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                            {g.memberCount} members
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {visibilityBadge(g.visibility)}
                          <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {g.city}, {g.state}
                          </span>
                          {joined && (
                            <Badge variant="outline" className="text-[11px] ml-auto">
                              Joined
                            </Badge>
                          )}
                        </div>

                        <p className="text-[12px] text-muted-foreground mt-1 line-clamp-2">
                          {g.description}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* RIGHT: Group details */}
        <div className="flex flex-col">
          {selected ? (
            <GroupDetails
              group={selected}
              isJoined={myGroups.has(selected.id)}
              onJoinToggle={() => toggleJoin(selected.id)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground">
              <Users className="h-10 w-10 mb-2 text-primary/70" />
              <p>Select a group to view details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
