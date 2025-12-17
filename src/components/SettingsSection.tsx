// src/components/SettingsSection.tsx
import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserProfile } from "@/contexts/UserProfileContext";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function SettingsSection() {
  const { profile, setDisplayName, setAvatarDataUrl, clearAvatar } = useUserProfile();

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [nameDraft, setNameDraft] = useState(profile.displayName);

  const onPickFile = () => fileRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      e.target.value = "";
      return;
    }
    // Keep it small to avoid huge localStorage entries (adjust as you like)
    const maxMb = 3;
    if (file.size > maxMb * 1024 * 1024) {
      alert(`Image too large. Please choose a photo under ${maxMb}MB.`);
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      setAvatarDataUrl(dataUrl);
    };
    reader.readAsDataURL(file);

    // reset input so selecting same file again still triggers change
    e.target.value = "";
  };

  const saveName = () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) return;
    setDisplayName(trimmed);
  };

  return (
    <div className="container py-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Profile */}
          <div className="space-y-3">
            <p className="text-sm font-semibold">Profile</p>

            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {profile.avatarDataUrl ? <AvatarImage src={profile.avatarDataUrl} /> : null}
                <AvatarFallback>{initials(profile.displayName)}</AvatarFallback>
              </Avatar>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Button onClick={onPickFile} variant="outline">
                    Upload photo
                  </Button>
                  <Button
                    onClick={clearAvatar}
                    variant="ghost"
                    disabled={!profile.avatarDataUrl}
                  >
                    Remove
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  This is saved locally for now. Later we’ll store it in your account.
                </p>

                {/* Hidden file input */}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onFileChange}
                />
              </div>
            </div>

            <div className="grid gap-2 max-w-sm">
              <Label>Display name</Label>
              <Input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} />
              <div className="flex justify-end">
                <Button onClick={saveName} disabled={!nameDraft.trim()}>
                  Save
                </Button>
              </div>
            </div>
          </div>

          {/* Placeholders */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">Next</p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>Store profile in backend</li>
              <li>Community/area change inside settings</li>
              <li>Notification preferences</li>
              <li>Privacy controls</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
