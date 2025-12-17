// src/lib/userLocation.ts

export type UserLocation = {
  country: string; // e.g. "USA", "Ghana"
  city: string; // e.g. "Denver", "Accra"
  area?: string | null; // e.g. "Nima" | null
  confirmedAt: string; // ISO timestamp
  source: "ip" | "manual";
};

const STORAGE_KEY = "afroconnect:userLocation:v1";

export function loadUserLocation(): UserLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserLocation;
    if (!parsed?.country || !parsed?.city || !parsed?.confirmedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveUserLocation(loc: Omit<UserLocation, "confirmedAt">): UserLocation {
  const full: UserLocation = {
    ...loc,
    confirmedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
  return full;
}

export function clearUserLocation() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Best-effort city detection (IP-based). If it fails, return null.
 * Note: some IP geo providers may rate-limit or fail in dev; UI still works.
 */
export async function detectCityFromIP(): Promise<
  { country?: string; city?: string } | null
> {
  try {
    // ipapi.co supports simple JSON and usually works with CORS
    const res = await fetch("https://ipapi.co/json/");
    if (!res.ok) return null;
    const data = await res.json();

    // Normalize
    const city = typeof data?.city === "string" ? data.city : undefined;
    const country =
      typeof data?.country_name === "string"
        ? data.country_name
        : typeof data?.country === "string"
        ? data.country
        : undefined;

    if (!city && !country) return null;
    return { city, country };
  } catch {
    return null;
  }
}
