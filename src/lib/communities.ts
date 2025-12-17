// src/lib/communities.ts

export type Area = {
  id: string;      // e.g. "accra-nima"
  name: string;    // e.g. "Nima"
};

export type Community = {
  id: string;      // unique key, e.g. "denver-co"
  name: string;    // label shown in UI, e.g. "Denver, CO"
  country: string; // e.g. "USA", "Ghana"
  city: string;    // e.g. "Denver", "Accra"
  slug?: string;   // optional
  areas?: Area[];  // optional sub-areas (for Accra etc.)
};

// Default community if nothing is saved yet
export const DEFAULT_COMMUNITY_ID = "denver-co";

// Seed communities – you can expand this over time
export const COMMUNITIES: Community[] = [
  // USA
  {
    id: "denver-co",
    name: "Denver, CO",
    country: "USA",
    city: "Denver",
  },
  {
    id: "aurora-co",
    name: "Aurora, CO",
    country: "USA",
    city: "Aurora",
  },
  {
    id: "atlanta-ga",
    name: "Atlanta, GA",
    country: "USA",
    city: "Atlanta",
  },
  {
    id: "houston-tx",
    name: "Houston, TX",
    country: "USA",
    city: "Houston",
  },

  // Ghana (with sub-areas for Accra)
  {
    id: "accra-gh",
    name: "Accra, Ghana",
    country: "Ghana",
    city: "Accra",
    areas: [
      { id: "accra-nima", name: "Nima" },
      { id: "accra-kanda", name: "Kanda" },
      { id: "accra-osu", name: "Osu" },
      { id: "accra-east-legon", name: "East Legon" },
      { id: "accra-madina", name: "Madina" },
      { id: "accra-spintex", name: "Spintex" },
    ],
  },

  // Canada
  {
    id: "toronto-on",
    name: "Toronto, ON",
    country: "Canada",
    city: "Toronto",
  },
  {
    id: "calgary-ab",
    name: "Calgary, AB",
    country: "Canada",
    city: "Calgary",
  },

  // UK
  {
    id: "london-uk",
    name: "London, UK",
    country: "UK",
    city: "London",
  },
];

// Simple helper used by CommunitySelector search box
export function searchCommunities(query: string): Community[] {
  const q = query.trim().toLowerCase();
  if (!q) return COMMUNITIES;

  return COMMUNITIES.filter((c) => {
    return (
      c.name.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q) ||
      (c.slug ?? "").toLowerCase().includes(q)
    );
  });
}

// Optional helper: get a community by id
export function getCommunityById(id: string): Community | undefined {
  return COMMUNITIES.find((c) => c.id === id);
}
