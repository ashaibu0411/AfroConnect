// src/components/WelcomeGate.tsx
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useAuth } from "@/hooks/useAuth";
import { getCommunityLabel, getCommunitySelection, setCommunitySelection } from "@/lib/location";

import { Users, UsersRound, Building2, Store, MessageCircle, Check, ChevronsUpDown } from "lucide-react";

// ✅ Your cultural backgrounds
import bg1 from "@/assets/welcome/culture-1.jpg";
import bg2 from "@/assets/welcome/culture-2.jpg";
import bg3 from "@/assets/welcome/culture-3.jpg";
import bg4 from "@/assets/welcome/culture-4.jpg";

// ✅ Global locations (country/state/city)
import { Country, State, City } from "country-state-city";

// ✅ Searchable dropdown (shadcn/ui-style)
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type PostItem = {
  id: string;
  authorName?: string;
  content: string;
  communityLabel: string;
  createdAt: number;
  likes?: number;
  title?: string;
};

const LS_POSTS = "afroconnect.posts.v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readPosts(): PostItem[] {
  return safeParse<PostItem[]>(localStorage.getItem(LS_POSTS), []);
}

function seedPostsIfEmpty() {
  const existing = readPosts();
  if (existing.length) return;

  const now = Date.now();
  const seeded: PostItem[] = [
    {
      id: crypto?.randomUUID?.() ?? String(now),
      authorName: "AfroConnect",
      content:
        "Welcome to AfroConnect. Guests can preview community posts. Log in to post, like, comment, and message.",
      communityLabel: "Denver, Colorado, United States",
      createdAt: now - 1000 * 60 * 60 * 6,
      likes: 0,
    },
    {
      id: crypto?.randomUUID?.() ?? String(now + 1),
      authorName: "Zaq",
      content: "This is a preview post. Switch your location to see other communities.",
      communityLabel: "Accra, Greater Accra, Ghana",
      createdAt: now - 1000 * 60 * 60 * 24 * 3,
      likes: 2,
    },
  ];

  localStorage.setItem(LS_POSTS, JSON.stringify(seeded));
}

function findCountryCodeByName(name: string) {
  const n = (name || "").trim().toLowerCase();
  const match = Country.getAllCountries().find((c) => c.name.toLowerCase() === n);
  return match?.isoCode ?? "";
}

function findStateCodeByName(countryCode: string, stateName: string) {
  const n = (stateName || "").trim().toLowerCase();
  const match = State.getStatesOfCountry(countryCode).find((s) => s.name.toLowerCase() === n);
  return match?.isoCode ?? "";
}

export default function WelcomeGate({ onLogin }: { onLogin: () => void }) {
  const { user, status } = useAuth();
  const isLoggedIn = !!user && status === "authenticated";

  // ✅ Background rotation
  const backgrounds = [bg1, bg2, bg3, bg4];
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setBgIndex((i) => (i + 1) % backgrounds.length), 8000);
    return () => window.clearInterval(id);
  }, [backgrounds.length]);

  const [communityLabel, setCommunityLabelState] = useState(() => getCommunityLabel());

  // ✅ Load stored selection (country/region/city names)
  const initial = getCommunitySelection();

  // ✅ Build global lists
  const allCountries = useMemo(() => Country.getAllCountries(), []);
  const countryItems = useMemo(
    () => allCountries.map((c) => ({ label: c.name, value: c.isoCode })),
    [allCountries]
  );

  // ✅ Resolve stored selection -> ISO codes (fallback to US)
  const initialCountryCode = useMemo(() => {
    const byName = findCountryCodeByName(initial.country);
    return byName || "US";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [countryCode, setCountryCode] = useState<string>(initialCountryCode);

  const statesForCountry = useMemo(() => {
    if (!countryCode) return [];
    return State.getStatesOfCountry(countryCode);
  }, [countryCode]);

  const stateItems = useMemo(
    () => statesForCountry.map((s) => ({ label: s.name, value: s.isoCode })),
    [statesForCountry]
  );

  const initialStateCode = useMemo(() => {
    if (!countryCode) return "";
    const byName = findStateCodeByName(countryCode, initial.region);
    return byName || (statesForCountry[0]?.isoCode ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCode]);

  const [stateCode, setStateCode] = useState<string>(initialStateCode);

  const citiesForState = useMemo(() => {
    if (!countryCode || !stateCode) return [];
    return City.getCitiesOfState(countryCode, stateCode);
  }, [countryCode, stateCode]);

  const cityItems = useMemo(
    () => citiesForState.map((c) => ({ label: c.name, value: c.name })),
    [citiesForState]
  );

  const initialCity = useMemo(() => {
    const desired = (initial.city || "").trim().toLowerCase();
    if (!desired) return cityItems[0]?.value ?? "";
    const found = cityItems.find((c) => c.value.toLowerCase() === desired);
    return found?.value ?? (cityItems[0]?.value ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCode, stateCode]);

  const [city, setCity] = useState<string>(initialCity);

  const [query, setQuery] = useState("");

  useEffect(() => {
    seedPostsIfEmpty();
  }, []);

  // Keep label in sync if something else changes it
  useEffect(() => {
    const handler = () => setCommunityLabelState(getCommunityLabel());
    window.addEventListener("afroconnect.communityChanged", handler);
    return () => window.removeEventListener("afroconnect.communityChanged", handler);
  }, []);

  // ✅ When country changes, reset state + city to valid values
  useEffect(() => {
    const nextState = State.getStatesOfCountry(countryCode)[0]?.isoCode ?? "";
    setStateCode((prev) => {
      const stillValid = !!State.getStateByCodeAndCountry(prev, countryCode);
      return stillValid ? prev : nextState;
    });
  }, [countryCode]);

  // ✅ When state changes, reset city to first available if invalid
  useEffect(() => {
    const nextCities = countryCode && stateCode ? City.getCitiesOfState(countryCode, stateCode) : [];
    const nextCity = nextCities[0]?.name ?? "";
    setCity((prev) => {
      const stillValid = nextCities.some((c) => c.name === prev);
      return stillValid ? prev : nextCity;
    });
  }, [countryCode, stateCode]);

  function applyCommunity() {
    const countryName = Country.getCountryByCode(countryCode)?.name ?? "";
    const stateName = State.getStateByCodeAndCountry(stateCode, countryCode)?.name ?? "";

    setCommunitySelection({
      country: countryName || "United States",
      region: stateName || "Colorado",
      city: city || "Denver",
    });

    setCommunityLabelState(getCommunityLabel());
  }

  const previewPosts = useMemo(() => {
    const posts = readPosts();
    const active = (communityLabel || "").toLowerCase();
    const q = query.trim().toLowerCase();

    return posts
      .filter((p) => {
        if ((p.communityLabel || "").toLowerCase() !== active) return false;

        if (!q) return true;
        const content = (p.content || "").toLowerCase();
        const author = (p.authorName || "").toLowerCase();
        const title = (p.title || "").toLowerCase();
        return content.includes(q) || author.includes(q) || title.includes(q);
      })
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 8);
  }, [communityLabel, query]);

  return (
    <div className="relative min-h-[calc(100vh-48px)]">
      {/* ✅ Cultural background (rotating) */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0 bg-center bg-cover transition-opacity duration-700"
          style={{ backgroundImage: `url(${backgrounds[bgIndex]})` }}
        />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-amber-950/20 to-black/45" />
      </div>

      <div className="space-y-6">
        <Card className="rounded-2xl border bg-white/85 backdrop-blur-md shadow-xl overflow-hidden">
          <CardContent className="p-6 relative">
            <AfricaWatermark />

            <div className="text-center relative">
              <div className="text-3xl font-bold">Welcome to AfroConnect</div>
              <div className="mt-2 text-sm text-muted-foreground max-w-2xl mx-auto">
                A vibrant social platform connecting Africans globally through community, culture and business.
                Explore public posts from different regions or login to unlock full access.
              </div>

              <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm">
                <Feature icon={<Users className="h-5 w-5" />} label="Community Feeds" />
                <Feature icon={<UsersRound className="h-5 w-5" />} label="Interest Groups" />
                <Feature icon={<Building2 className="h-5 w-5" />} label="Business Directory" />
                <Feature icon={<Store className="h-5 w-5" />} label="Marketplace" />
                <Feature icon={<MessageCircle className="h-5 w-5" />} label="Direct Messages" />
              </div>

              <div className="mt-6 text-xs text-muted-foreground">
                Current community: <span className="font-medium text-foreground">{communityLabel}</span>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Button className="rounded-xl" onClick={onLogin}>
                  Login to post
                </Button>
                <Button
                  className="rounded-xl"
                  variant="outline"
                  onClick={() => document.getElementById("welcome-preview")?.scrollIntoView({ behavior: "smooth" })}
                >
                  Preview feed
                </Button>
              </div>
            </div>

            {/* ✅ Searchable + scrollable location selector (GLOBAL) */}
            <div className="mt-8 max-w-3xl mx-auto relative">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <SearchableSelect
                  label="Country"
                  value={countryCode}
                  onValueChange={(v) => setCountryCode(v)}
                  items={countryItems}
                  placeholder="Search country..."
                  emptyText="No countries found."
                />

                <SearchableSelect
                  label="State/Region"
                  value={stateCode}
                  onValueChange={(v) => setStateCode(v)}
                  items={stateItems}
                  placeholder={stateItems.length ? "Search state/region..." : "No states"}
                  emptyText="No states found."
                  disabled={!countryCode || stateItems.length === 0}
                />

                <SearchableSelect
                  label="City"
                  value={city}
                  onValueChange={(v) => setCity(v)}
                  items={cityItems}
                  placeholder={cityItems.length ? "Search city..." : "No cities"}
                  emptyText="No cities found."
                  disabled={!countryCode || !stateCode || cityItems.length === 0}
                />
              </div>

              <div className="mt-3 flex items-center justify-center gap-2">
                <Button className="rounded-xl" variant="outline" onClick={applyCommunity}>
                  Apply location
                </Button>
                <div className="text-xs text-muted-foreground">
                  Guests can browse posts by location. Posting requires login.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview feed */}
        <Card id="welcome-preview" className="rounded-2xl border bg-white/85 backdrop-blur-md shadow-lg">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold">Community Feed</div>
                <div className="text-xs text-muted-foreground">{communityLabel}</div>
              </div>

              {!isLoggedIn ? (
                <Button className="rounded-xl" onClick={onLogin}>
                  Log in / Create account
                </Button>
              ) : (
                <Button className="rounded-xl" variant="outline">
                  You’re logged in
                </Button>
              )}
            </div>

            <Input
              className="rounded-xl max-w-md"
              placeholder="Search local posts..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            {previewPosts.length === 0 ? (
              <div className="py-10 text-center">
                <div className="text-base font-semibold">No posts found</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Try another city/state/country and click “Apply location”.
                </div>

                <div className="mt-4">
                  <Button className="rounded-xl" onClick={onLogin}>
                    Login to Post
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {previewPosts.map((p) => (
                  <div key={p.id} className="rounded-2xl border bg-background/60 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{p.authorName || "Guest"}</div>
                        <div className="text-xs text-muted-foreground">{p.communityLabel}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleString()}</div>
                    </div>

                    <div className="mt-3 text-base">{p.content}</div>

                    <div className="mt-4 flex gap-2">
                      <Button className="rounded-xl" variant="outline" onClick={onLogin}>
                        Like {p.likes || 0}
                      </Button>
                      <Button className="rounded-xl" variant="outline" onClick={onLogin}>
                        Comment
                      </Button>
                      <Button className="rounded-xl" variant="outline" onClick={onLogin}>
                        Share
                      </Button>
                    </div>

                    <div className="mt-2 text-[11px] text-muted-foreground">Guest preview — log in to interact.</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** ✅ Searchable + scrollable dropdown (combobox) */
function SearchableSelect({
  label,
  value,
  onValueChange,
  items,
  placeholder,
  emptyText,
  disabled,
}: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  items: { label: string; value: string }[];
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const selectedLabel = useMemo(() => {
    const hit = items.find((i) => i.value === value);
    return hit?.label ?? "";
  }, [items, value]);

  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={[
              "w-full h-10 px-3 rounded-xl border bg-background",
              "flex items-center justify-between gap-2 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-primary/30",
              disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-muted/30",
            ].join(" ")}
          >
            <span className={selectedLabel ? "text-foreground" : "text-muted-foreground"}>
              {selectedLabel || `Select ${label.toLowerCase()}`}
            </span>
            <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
          </button>
        </PopoverTrigger>

        <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
          <Command>
            <CommandInput placeholder={placeholder ?? `Search ${label.toLowerCase()}...`} />
            <CommandList className="max-h-56 overflow-auto">
              <CommandEmpty>{emptyText ?? "No results found."}</CommandEmpty>

              <CommandGroup>
                {items.map((it) => (
                  <CommandItem
                    key={it.value}
                    value={it.label}
                    onSelect={() => {
                      onValueChange(it.value);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between"
                  >
                    <span>{it.label}</span>
                    {it.value === value ? <Check className="h-4 w-4" /> : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function Feature({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">{icon}</span>
      <span className="font-medium">{label}</span>
    </div>
  );
}

function AfricaWatermark() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <svg viewBox="0 0 512 512" className="w-[460px] max-w-[90%] opacity-[0.08] text-amber-900" aria-hidden="true">
        <path
          fill="currentColor"
          d="M318 36c-20 6-36 24-40 46-2 10-9 22-16 28-9 7-15 18-15 28 0 11-5 24-12 31-9 10-11 20-7 34 4 13 0 27-10 38-10 12-15 27-12 41 3 13-1 30-9 38-9 9-14 25-12 38 3 13-2 29-10 36-9 8-16 24-16 35 0 11-6 26-14 33-9 8-14 22-12 32 4 20-6 40-26 52-20 13-29 35-20 50 8 14 37 10 63-10 12-9 27-14 34-12 7 3 18-1 25-9 9-10 20-14 35-12 15 2 28-2 36-12 8-9 20-14 27-12 20 5 44-6 55-25 5-9 18-20 28-23 22-7 38-30 34-50-2-8 4-22 13-31 10-10 15-23 13-36-3-13 2-30 10-38 9-9 14-24 12-35-3-12 3-30 13-40 11-11 16-25 14-38-3-14 3-32 14-42 12-12 17-26 15-40-2-14 4-32 15-43 13-13 18-29 15-46-3-16 2-35 13-48 13-15 16-34 7-49-11-18-37-26-62-19z"
        />
      </svg>
    </div>
  );
}
