// src/lib/areas.ts

export type AreaOption = {
  id: string;      // stable key (used for storage)
  label: string;   // what user sees
};

export type AreaConfig = {
  enabled: boolean;
  options: AreaOption[];
};

// NOTE:
// We do NOT make this global for every city in the world.
// We only enable areas for communities we explicitly configure (e.g., Accra).
export const AREA_BY_COMMUNITY_ID: Record<string, AreaConfig> = {
  // Example: if your communities.ts has an Accra community with id "accra"
  // keep this key in sync with that id.
  accra: {
    enabled: true,
    options: [
      { id: "nima", label: "Nima" },
      { id: "kanda", label: "Kanda" },
      { id: "osu", label: "Osu" },
      { id: "east-legon", label: "East Legon" },
      { id: "madina", label: "Madina" },
      { id: "achimota", label: "Achimota" },
      { id: "dansoman", label: "Dansoman" },
      { id: "teshie", label: "Teshie" },
      { id: "labadi", label: "Labadi" },
    ],
  },

  // All other communities: areas are off by default.
};
