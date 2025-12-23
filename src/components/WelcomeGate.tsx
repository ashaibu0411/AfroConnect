// src/components/WelcomeGate.tsx
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { setCommunityFromParts, normalizeLabel } from "@/lib/location";
import { getPrioritizedCountries, getRegionsForCountry } from "@/lib/locations";

type PreviewPost = {
  id: string;
  authorName?: string;
  content: string;
  communityLabel: string;
  createdAt: number;
};

export default function WelcomeGate({
  previewPosts,
  onLogin,
}: {
  previewPosts: PreviewPost[];
  onLogin: () => void;
}) {
  const prioritizedCountries = useMemo(() => getPrioritizedCountries(), []);
  const [country, setCountry] = useState("United States");
  const regions = useMemo(() => getRegionsForCountry(country) || [], [country]);
  const [region, setRegion] = useState("Colorado");

  const selectedLabel = useMemo(() => normalizeLabel(country, region), [country, region]);

  const filteredPreview = useMemo(() => {
    const a = selectedLabel.trim().toLowerCase();
    return (previewPosts || [])
      .filter((p) => (p.communityLabel || "").trim().toLowerCase() === a)
      .sort((x, y) => y.createdAt - x.createdAt)
      .slice(0, 8);
  }, [previewPosts, selectedLabel]);

  function applyLocation() {
    setCommunityFromParts(country, region);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-background p-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Welcome to AfroConnect</h1>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            A vibrant social platform connecting Africans globally through community, culture, and business.
            Choose your location to preview the community feed, then log in to participate.
          </p>
        </div>

        <div className="mt-6">
          <Card className="rounded-2xl">
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Country</div>
                  <Select value={country} onValueChange={(v) => { setCountry(v); setRegion(""); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {prioritizedCountries
                        .filter((x) => x !== "---separator---")
                        .map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">State / Region / City</div>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {(regions.length ? regions : ["Colorado"]).map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 justify-center pt-2">
                <Button className="rounded-xl" onClick={applyLocation}>
                  Apply location
                </Button>
                <Button className="rounded-xl" variant="outline" onClick={onLogin}>
                  Log in / Create account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview feed (read-only) */}
      <Card className="rounded-2xl border">
        <CardContent className="p-5 space-y-4">
          <div>
            <div className="text-lg font-semibold">Preview from {selectedLabel}</div>
            <div className="text-sm text-muted-foreground">Log in to post, like, comment, and message.</div>
          </div>

          {filteredPreview.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No preview posts yet for this community.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPreview.map((p) => (
                <div key={p.id} className="rounded-2xl border bg-background/60 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{p.authorName || "Member"}</div>
                      <div className="text-xs text-muted-foreground">{p.communityLabel}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(p.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="mt-3 text-sm">{p.content}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
