import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

const DEFAULT_INTERESTS = [
  "Faith & Spirituality",
  "Business & Entrepreneurship",
  "Jobs",
  "Housing",
  "Events",
  "Food",
  "Culture",
  "Sports",
  "Music",
  "Afro-Caribbean",
  "Networking",
  "Health",
  "Parenting",
  "Immigration",
];

export default function OnboardingInterests({ onDone }: { onDone: () => void }) {
  const { upsertMyProfile, getMyProfile } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);
  const canContinue = useMemo(() => selected.length >= 3, [selected.length]);

  function toggle(v: string) {
    setSelected((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  }

  async function save() {
    const prof = await getMyProfile();
    if (!prof) return;

    await upsertMyProfile({
      firstName: (prof as any).first_name || "",
      lastName: (prof as any).last_name || "",
      handle: (prof as any).handle || prof.display_name || "",
      interests: selected,
      onboardingComplete: true,
    });

    onDone();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Card className="rounded-2xl border">
        <CardContent className="p-6">
          <div className="text-2xl font-bold">Pick your interests</div>
          <div className="text-sm text-muted-foreground mt-1">
            Choose at least 3. This helps AfroConnect personalize your feed, groups, and businesses.
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {DEFAULT_INTERESTS.map((i) => {
              const active = selected.includes(i);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggle(i)}
                  className={[
                    "px-4 py-2 rounded-full border text-sm transition",
                    active ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted/50",
                  ].join(" ")}
                >
                  {i}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={onDone}>
              Skip for now
            </Button>
            <Button onClick={save} disabled={!canContinue}>
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
