// src/lib/locations.ts

export const PRIORITY_COUNTRIES = [
  "United States",
  "Ghana",
  "Nigeria",
  "United Kingdom",
  "Canada"
] as const;

const REGIONS: Record<string, string[]> = {
  "United States": ["Colorado", "Texas", "New York", "California", "Georgia"],
  Ghana: ["Greater Accra", "Ashanti", "Central", "Eastern"],
  Nigeria: ["Lagos", "Abuja (FCT)", "Rivers", "Kano"],
  "United Kingdom": ["England", "Scotland", "Wales", "Northern Ireland"],
  Canada: ["Ontario", "Alberta", "British Columbia", "Quebec"]
};

export function getPrioritizedCountries() {
  return [...PRIORITY_COUNTRIES];
}

export function getRegionsForCountry(country: string) {
  return REGIONS[country] ?? [];
}
