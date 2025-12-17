// src/components/LocationOnboarding.tsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, ShieldCheck } from "lucide-react";
import { detectCityFromIP, saveUserLocation, UserLocation } from "@/lib/userLocation";

type Props = {
  onConfirmed: (loc: UserLocation) => void;
};

const COUNTRIES = ["USA", "Canada", "UK", "Ghana", "Nigeria", "South Africa", "Kenya", "Other"];

// Keep this lightweight; expand over time (or replace with backend lookup).
const CITY_AREAS: Record<string, string[]> = {
  Accra: [
    "Osu",
    "East Legon",
    "West Legon",
    "Airport",
    "Labone",
    "Cantonments",
    "Nima",
    "Kanda",
    "Madina",
    "Dansoman",
    "Spintex",
    "Teshie",
    "Adenta",
    "Achimota",
  ],
  "Denver": ["Aurora", "Lakewood", "Englewood", "Littleton", "Thornton", "Arvada"],
};

const CITY_SUGGESTIONS = [
  "Accra",
  "Kumasi",
  "Takoradi",
  "Tema",
  "Lagos",
  "Abuja",
  "Nairobi",
  "Johannesburg",
  "Cape Town",
  "London",
  "Toronto",
  "Vancouver",
  "Denver",
  "Aurora",
  "Atlanta",
  "Houston",
  "New York",
  "Dallas",
];

export default function LocationOnboarding({ onConfirmed }: Props) {
  const [country, setCountry] = useState<string>("USA");
  const [city, setCity] = useState<string>("");
  const [area, setArea] = useState<string>("");

  const [detected, setDetected] = useState<{ country?: string; city?: string } | null>(null);
  const [detecting, setDetecting] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setDetecting(true);
      const guess = await detectCityFromIP();
      if (cancelled) return;
      setDetected(guess);
      // Prefill only if empty
      if (guess?.country && !country) setCountry(guess.country);
      if (guess?.city && !city) setCity(guess.city);
      setDetecting(false);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normalizedCity = useMemo(() => city.trim(), [city]);
  const normalizedArea = useMemo(() => area.trim(), [area]);

  const areaOptions = useMemo(() => {
    if (!normalizedCity) return [];
    return CITY_AREAS[normalizedCity] ?? [];
  }, [normalizedCity]);

  const canContinue = !!country && !!normalizedCity;

  const handleContinue = () => {
    if (!canContinue) return;

    const saved = saveUserLocation({
      country: country === "Other" ? "Other" : country,
      city: normalizedCity,
      area: normalizedArea ? normalizedArea : null,
      source: detected?.city || detected?.country ? "ip" : "manual",
    });

    onConfirmed(saved);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-xl space-y-4">
        <Card>
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <CardTitle>Confirm your location</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              AfroConnect uses your <span className="font-medium">City</span> (and optional{" "}
              <span className="font-medium">Area</span>) to show nearby posts, businesses,
              groups, and help requests.
            </p>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs inline-flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                We do not save your street address.
              </Badge>

              {detecting ? (
                <Badge variant="secondary" className="text-xs">
                  Detecting city…
                </Badge>
              ) : detected?.city ? (
                <Badge variant="secondary" className="text-xs">
                  Detected: {detected.city}
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  City detection unavailable (select manually)
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Country */}
            <div className="space-y-2">
              <Label>Country (required)</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                We store country only for regional sorting. Primary filtering is by City.
              </p>
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label>City (required)</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Start typing… e.g. Accra, Denver, Toronto"
                list="afroconnect-city-suggestions"
              />
              <datalist id="afroconnect-city-suggestions">
                {CITY_SUGGESTIONS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <p className="text-xs text-muted-foreground">
                City-level only. No precise address is collected.
              </p>
            </div>

            {/* Area (Optional) */}
            <div className="space-y-2">
              <Label>Area / Neighborhood (optional)</Label>
              <Input
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder={
                  normalizedCity
                    ? `Optional… e.g. ${areaOptions[0] ?? "Neighborhood"}`
                    : "Select a city first"
                }
                disabled={!normalizedCity}
                list="afroconnect-area-suggestions"
              />
              <datalist id="afroconnect-area-suggestions">
                {areaOptions.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>

              <p className="text-xs text-muted-foreground">
                Recommended for big cities (e.g., Accra: Nima, Kanda, Osu). This only helps
                prioritize nearby updates inside the same city.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button className="sm:flex-1" disabled={!canContinue} onClick={handleContinue}>
                Continue
              </Button>

              <Button
                className="sm:flex-1"
                variant="outline"
                disabled={!canContinue}
                onClick={() => {
                  setArea("");
                  handleContinue();
                }}
              >
                Skip area
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              You can change your city later (Settings will be added).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
