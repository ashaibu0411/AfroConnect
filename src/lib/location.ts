// src/lib/location.ts
const LS_LOCATION = "afroconnect.location.v1";
const LS_COMMUNITY = "afroconnect.community.v1";

export type StoredLocation = {
  country: string;
  region: string; // state/region/city equivalent
};

export function normalizeLabel(country: string, region: string, city?: string) {
  const c = (country || "").trim();
  const r = (region || "").trim();
  const cityClean = (city || "").trim();

  // If you ever want "City, Region, Country" later:
  const parts = [cityClean, r, c].filter(Boolean);

  if (parts.length === 0) return "Colorado, United States";
  if (parts.length === 1) return parts[0];
  // For now your UI mostly expects "Region, Country"
  // so if city is present, it will become "City, Region, Country".
  return parts.join(", ");
}

export function getLocation(): StoredLocation {
  try {
    const raw = localStorage.getItem(LS_LOCATION);
    if (!raw) return { country: "United States", region: "Colorado" };
    const parsed = JSON.parse(raw) as Partial<StoredLocation>;
    return {
      country: (parsed.country || "United States").trim() || "United States",
      region: (parsed.region || "Colorado").trim() || "Colorado",
    };
  } catch {
    return { country: "United States", region: "Colorado" };
  }
}

export function setLocation(loc: StoredLocation) {
  localStorage.setItem(
    LS_LOCATION,
    JSON.stringify({
      country: (loc.country || "").trim(),
      region: (loc.region || "").trim(),
    })
  );

  // Optional: keep LS_COMMUNITY in sync as "Region, Country"
  const label = normalizeLabel(loc.country, loc.region);
  localStorage.setItem(LS_COMMUNITY, label);

  window.dispatchEvent(new Event("afroconnect.communityChanged"));
}

export function setCommunityFromParts(country: string, region: string, city?: string) {
  // This is what WelcomeGate expects
  const label = normalizeLabel(country, region, city);
  localStorage.setItem(LS_COMMUNITY, label);

  // Optional: also keep LS_LOCATION in sync
  setLocation({ country, region });

  window.dispatchEvent(new Event("afroconnect.communityChanged"));
}

export function getCommunityLabel(): string {
  // Prefer explicit community label if stored
  const fromCommunity = (localStorage.getItem(LS_COMMUNITY) || "").trim();
  if (fromCommunity) return fromCommunity;

  // Fallback to LS_LOCATION
  const loc = getLocation();
  return normalizeLabel(loc.country, loc.region);
}
