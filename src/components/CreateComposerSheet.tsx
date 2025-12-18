import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { toast } from "sonner";
import { X, Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import type { CreateKind } from "./CreateMenuSheet";

type MediaItem = {
  id: string;
  kind: "image" | "video";
  url: string;
  name: string;
  persistent: boolean;
};

export type ComposerPayload = {
  kind: CreateKind;
  text: string;
  media: MediaItem[];
  // Optional fields for Sell/Event (MVP: kept minimal)
  title?: string;
  price?: string;
  when?: string;
  where?: string;
};

function uid() {
  return (crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`) as string;
}

function violatesPolicy(text: string) {
  const s = (text || "").toLowerCase();
  const blocked = [
    "porn",
    "nude",
    "sex",
    "sexual",
    "xxx",
    "onlyfans",
    "rape",
    "kill",
    "murder",
    "shoot",
    "gun down",
    "terrorist",
    "behead",
  ];
  return blocked.some((w) => s.includes(w));
}

export default function CreateComposerSheet({
  open,
  onOpenChange,
  kind,
  communityLabel,
  canInteract,
  onRequireLogin,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  kind: CreateKind;
  communityLabel: string;
  canInteract: boolean;
  onRequireLogin: () => void;
  onSubmit: (payload: ComposerPayload) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [when, setWhen] = useState("");
  const [where, setWhere] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);

  const headline = useMemo(() => {
    if (kind === "ask") return "Ask";
    if (kind === "sell") return "Sell";
    if (kind === "event") return "Event";
    return "Post";
  }, [kind]);

  const placeholder = useMemo(() => {
    switch (kind) {
      case "ask":
        return `Ask your neighbors in ${communityLabel}… (be specific)`;
      case "sell":
        return `Describe what you’re selling in ${communityLabel}…`;
      case "event":
        return `Describe your event in ${communityLabel}…`;
      default:
        return `What’s happening in ${communityLabel}?`;
    }
  }, [kind, communityLabel]);

  const canPost = useMemo(() => {
    if (!canInteract) return false;
    const hasCore = text.trim().length > 0 || media.length > 0;
    return hasCore;
  }, [canInteract, text, media.length]);

  async function handlePickFiles(files: FileList | null) {
    if (!canInteract) {
      onRequireLogin();
      return;
    }
    if (!files || files.length === 0) return;

    const next: MediaItem[] = [];
    const picked = Array.from(files).slice(0, 6);

    for (const file of picked) {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      if (!isImage && !isVideo) continue;

      if (isImage) {
        const dataUrl = await readAsDataUrl(file);
        next.push({ id: uid(), kind: "image", url: dataUrl, name: file.name, persistent: true });
      } else {
        const blobUrl = URL.createObjectURL(file);
        next.push({ id: uid(), kind: "video", url: blobUrl, name: file.name, persistent: false });
      }
    }

    setMedia((prev) => [...prev, ...next]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeMedia(id: string) {
    setMedia((prev) => {
      const item = prev.find((m) => m.id === id);
      if (item && !item.persistent && item.url.startsWith("blob:")) URL.revokeObjectURL(item.url);
      return prev.filter((m) => m.id !== id);
    });
  }

  function resetAndClose() {
    setText("");
    setTitle("");
    setPrice("");
    setWhen("");
    setWhere("");
    setMedia([]);
    onOpenChange(false);
  }

  function submit() {
    if (!canInteract) {
      onRequireLogin();
      return;
    }

    const proposed = text.trim();
    if (violatesPolicy(proposed)) {
      toast.error("This post appears to violate the content policy (sexual/violent content). Please edit and try again.");
      return;
    }

    onSubmit({
      kind,
      text: proposed,
      media,
      title: title.trim() || undefined,
      price: price.trim() || undefined,
      when: when.trim() || undefined,
      where: where.trim() || undefined,
    });

    toast.success("Posted.");
    resetAndClose();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* Full-screen feel on mobile */}
      <SheetContent side="right" className="w-full sm:max-w-[520px] p-0">
        <div className="h-screen flex flex-col">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-lg font-semibold">{headline}</div>
              <div className="text-xs text-muted-foreground truncate">{communityLabel}</div>
            </div>

            <Button variant="ghost" size="icon" onClick={resetAndClose} title="Close">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {/* Minimal extra fields for Sell/Event (MVP) */}
            {kind === "sell" && (
              <div className="grid grid-cols-1 gap-2">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Item title (optional)" />
                <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price (optional)" />
              </div>
            )}

            {kind === "event" && (
              <div className="grid grid-cols-1 gap-2">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title (optional)" />
                <Input value={when} onChange={(e) => setWhen(e.target.value)} placeholder="When (optional)" />
                <Input value={where} onChange={(e) => setWhere(e.target.value)} placeholder="Where (optional)" />
              </div>
            )}

            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={placeholder}
              className="min-h-[160px]"
              disabled={!canInteract}
            />

            {/* Media */}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={(e) => handlePickFiles(e.target.files)}
              />

              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={!canInteract}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Add media
              </Button>

              {!canInteract && (
                <Button variant="outline" onClick={onRequireLogin}>
                  Login
                </Button>
              )}
            </div>

            {media.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {media.map((m) => (
                  <div key={m.id} className="relative border rounded-xl overflow-hidden bg-background">
                    <button
                      type="button"
                      className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/90 border flex items-center justify-center hover:bg-muted"
                      onClick={() => removeMedia(m.id)}
                      title="Remove"
                    >
                      <X className="h-4 w-4" />
                    </button>

                    {m.kind === "image" ? (
                      <img src={m.url} alt={m.name} className="h-40 w-full object-cover" />
                    ) : (
                      <div className="h-40 w-full bg-black flex items-center justify-center">
                        <video src={m.url} controls className="h-40 w-full object-contain" />
                      </div>
                    )}

                    {!m.persistent && (
                      <div className="px-2 py-2 text-[11px] text-muted-foreground border-t">
                        <VideoIcon className="inline h-3 w-3 mr-1" />
                        Video preview (won’t persist after refresh yet)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="text-[11px] text-muted-foreground">
              By posting, you agree not to share sexual content, graphic violence, threats, or hate.
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t flex items-center justify-end gap-2">
            <Button variant="outline" onClick={resetAndClose}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={!canPost}>
              Publish
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
