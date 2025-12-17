// src/components/MessagesSection.tsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

import {
  MessageCircle,
  Store,
  Users,
  GraduationCap,
  LifeBuoy,
  MapPin,
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
// Types
// ----------------------------------
type ThreadType =
  | "direct"
  | "business"
  | "group"
  | "students"
  | "help";

type MessageThread = {
  id: string;
  title: string;
  type: ThreadType;

  communityId: string;
  areaId?: string;

  lastMessage: string;
  updatedAgo: string;

  // Business-only preview info
  businessProfile?: {
    hours?: string;
    address?: string;
    hasInventory?: boolean;
  };
};

// ----------------------------------
// Helpers
// ----------------------------------
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
export default function MessagesSection() {
  // Location
  const [communityId, setCommunityId] = useState(
    () => localStorage.getItem(LS_COMMUNITY_KEY) || DEFAULT_COMMUNITY_ID
  );
  const community = useMemo(() => getCommunityById(communityId), [communityId]);

  const [areaId, setAreaId] = useState(() =>
    getSavedAreaForCommunity(communityId)
  );

  const [locationModalOpen, setLocationModalOpen] = useState(false);

  // Filters
  const [threadType, setThreadType] = useState<ThreadType | "all">("all");
  const [search, setSearch] = useState("");

  const showAreaUI = (community.areas ?? []).length > 0;

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

  // ----------------------------------
  // Filtered Threads
  // ----------------------------------
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

  // ----------------------------------
  // UI
  // ----------------------------------
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Messages
            </CardTitle>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setLocationModalOpen(true)}
            >
              <MapPin className="h-4 w-4 mr-1" />
              Location
            </Button>
          </div>

          <CommunitySelector
            value={community}
            onChange={(c) => setCommunityId(c.id)}
          />

          {showAreaUI && (
            <AreaSelector
              community={community}
              value={areaId}
              onChange={setAreaId}
            />
          )}

          <Input
            placeholder="Search messages…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Tabs
            value={threadType}
            onValueChange={(v) => setThreadType(v as any)}
          >
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
              <div className="text-sm text-muted-foreground text-center py-10">
                No messages for this location.
              </div>
            ) : (
              filteredThreads.map((t) => (
                <div
                  key={t.id}
                  className="border-b px-4 py-3 hover:bg-muted/50 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">{t.title}</p>
                    <span className="text-xs text-muted-foreground">
                      {t.updatedAgo}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {t.lastMessage}
                  </p>

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
                </div>
              ))
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
