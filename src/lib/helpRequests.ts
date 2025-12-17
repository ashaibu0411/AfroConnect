// src/lib/helpRequests.ts

export type HelpRequestType =
  | "housing"
  | "airport"
  | "orientation"
  | "mentorship"
  | "jobs"
  | "legal"
  | "other";

export type HelpUrgency = "normal" | "urgent";

export type HelpRequest = {
  id: string;
  communityId: string; // city/community
  areaId?: string; // optional sub-area within the city
  type: HelpRequestType;
  urgency: HelpUrgency;
  title: string;
  details: string;
  createdBy: string;
  createdAtIso: string;
};

export const HELP_TYPE_LABEL: Record<HelpRequestType, string> = {
  housing: "Housing & Roommates",
  airport: "Airport Pickup",
  orientation: "Orientation",
  mentorship: "Mentorship",
  jobs: "Jobs & Work",
  legal: "Immigration / Legal",
  other: "Other",
};

export function timeAgo(iso: string) {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diff = Math.max(0, now - t);

  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;

  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function safeId(prefix = "hr") {
  // Works in browsers with/without crypto.randomUUID
  // @ts-ignore
  const uuid = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  return `${prefix}-${uuid}`;
}

export function createHelpRequest(input: Omit<HelpRequest, "id" | "createdAtIso">): HelpRequest {
  return {
    ...input,
    id: safeId("hr"),
    createdAtIso: new Date().toISOString(),
  };
}

// Mock seed (adjust communityId to match your COMMUNITIES ids)
export const MOCK_HELP_REQUESTS: HelpRequest[] = [
  {
    id: "hr-1",
    communityId: "accra", // must match COMMUNITIES id
    areaId: "nima",
    type: "jobs",
    urgency: "urgent",
    title: "Need mechanic work in Nima today",
    details: "My car won’t start. Looking for someone reliable near Nima. I can pay today.",
    createdBy: "Jason P.",
    createdAtIso: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "hr-2",
    communityId: "accra",
    areaId: "osu",
    type: "housing",
    urgency: "normal",
    title: "Roommate needed (female) around Osu",
    details: "Looking for a clean roommate to share a 2-bedroom in Osu. Budget friendly.",
    createdBy: "Akua (Ghana)",
    createdAtIso: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "hr-3",
    communityId: "denver",
    type: "airport",
    urgency: "normal",
    title: "Airport pickup DIA – new student arriving",
    details: "Arriving at 3:40 PM. Need pickup or help with train/bus to Aurora.",
    createdBy: "Tobi (Nigeria)",
    createdAtIso: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
];
