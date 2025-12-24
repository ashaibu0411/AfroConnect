// src/lib/location.ts
type CommunitySelection = {
  country: string;
  region: string; // state/province/region
  city: string;
};

// LocalStorage keys
const LS_COMMUNITY = "afroconnect.community.v1";

// Default (you can change)
const DEFAULT_COMMUNITY: CommunitySelection = {
  country: "United States",
  region: "Colorado",
  city: "Denver",
};

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getCommunitySelection(): CommunitySelection {
  return safeParse<CommunitySelection>(localStorage.getItem(LS_COMMUNITY), DEFAULT_COMMUNITY);
}

export function setCommunitySelection(next: CommunitySelection) {
  localStorage.setItem(LS_COMMUNITY, JSON.stringify(next));
  // broadcast so HomeFeed updates immediately
  window.dispatchEvent(new Event("afroconnect.communityChanged"));
}

export function getCommunityLabel() {
  const c = getCommunitySelection();
  // Matches your UI style: "Denver, Colorado, United States"
  return `${c.city}, ${c.region}, ${c.country}`;
}

// A stable key for filtering (lowercase slug)
export function getCommunityKey() {
  const c = getCommunitySelection();
  return `${c.city}-${c.region}-${c.country}`.toLowerCase().replace(/\s+/g, "-");
}
