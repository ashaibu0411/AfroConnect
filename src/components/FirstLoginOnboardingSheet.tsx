// src/components/FirstLoginOnboardingSheet.tsx
import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const LS_AVATAR_URL = "afroconnect.avatarUrl";
const PROFILE_UPDATED_EVENT = "afroconnect.profileUpdated";

function onboardingKey(userId: string) {
  return `afroconnect.onboarding.done.${userId}`;
}

function safeUserFirstName(displayName?: string | null) {
  const n = (displayName || "").trim();
  if (!n) return "there";
  return n.split(" ")[0] || "there";
}

export default function FirstLoginOnboardingSheet({
  open,
  onOpenChange,
  communityLabel,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  communityLabel: string;
}) {
  const { user } = useAuth();

  const [displayName, setDisplayName] = useState<string>("User");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    // For MVP: get name from local profile storage if present
    try {
      const raw = localStorage.getItem("afroconnect.profile");
      if (raw) {
        const p = JSON.parse(raw) as { displayName?: string };
        if (p.displayName?.trim()) setDisplayName(p.displayName.trim());
      }
    } catch {
      // ignore
    }

    const lsAvatar = localStorage.getItem(LS_AVATAR_URL);
    if (lsAvatar) setAvatarPreview(lsAvatar);
  }, [open]);

  const firstName = useMemo(() => safeUserFirstName(displayName), [displayName]);

  async function onPickAvatar(file: File | null) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || "");
      localStorage.setItem(LS_AVATAR_URL, url);
      window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
      setAvatarPreview(url);
      toast.success("Profile photo saved.");
    };
    reader.onerror = () => toast.error("Could not read that file.");
    reader.readAsDataURL(file);
  }

  function markDoneAndClose() {
    if (user?.id) localStorage.setItem(onboardingKey(user.id), "1");
    onOpenChange(false);
  }

  function introduceYourself() {
    const prefill = `Hi everyone! I’m ${displayName || "new here"}.\nI’m in ${communityLabel}.\n\nExcited to connect with the AfroConnect community.`;

    window.dispatchEvent(
      new CustomEvent("afroconnect.openComposer", {
        detail: { kind: "post", prefill },
      })
    );

    // Mark done so it doesn’t show every time
    if (user?.id) localStorage.setItem(onboardingKey(user.id), "1");
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="p-0 sm:max-w-none">
        <div className="p-4 border-b">
          <div className="text-lg font-semibold">Welcome, {firstName}</div>
          <div className="text-xs text-muted-foreground mt-1">
            AfroConnect works best when people recognize each other. Add a photo and introduce yourself.
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="rounded-2xl border p-4 space-y-3 bg-muted/20">
            <div className="text-sm font-semibold">Step 1 (optional): Add a profile photo</div>

            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-muted border overflow-hidden flex items-center justify-center text-sm font-semibold">
                {avatarPreview ? (
                  <img src={avatarPreview} className="h-12 w-12 object-cover" alt="Avatar" />
                ) : (
                  (displayName || "U")
                    .split(" ")
                    .filter(Boolean)
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
                )}
              </div>

              <div className="flex-1">
                <Input type="file" accept="image/*" onChange={(e) => onPickAvatar(e.target.files?.[0] ?? null)} />
                <div className="text-xs text-muted-foreground mt-1">Saved locally for now (MVP).</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border p-4 space-y-3">
            <div className="text-sm font-semibold">Step 2: Introduce yourself</div>
            <div className="text-xs text-muted-foreground">
              A short post helps people connect with you quickly.
            </div>

            <Button className="w-full" onClick={introduceYourself}>
              Introduce yourself
            </Button>

            <Button variant="outline" className="w-full" onClick={markDoneAndClose}>
              Skip for now
            </Button>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end">
          <Button variant="outline" onClick={markDoneAndClose}>
            Done
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
