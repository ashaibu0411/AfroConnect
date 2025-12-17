import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search } from "lucide-react";
import { Community, COMMUNITIES, searchCommunities } from "@/lib/communities";

type Props = {
  value: Community;
  onChange: (c: Community) => void;
};

export default function CommunitySelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");

  const results = useMemo(() => searchCommunities(term), [term]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="px-2 gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">{value.name}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Select your community</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search city or community..."
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>

        <ScrollArea className="h-[320px] pr-2">
          <div className="space-y-2">
            {results.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                }}
                className="w-full text-left border rounded-lg px-3 py-2 hover:bg-muted/60 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.city}{c.state ? `, ${c.state}` : ""} · {c.country}
                    </p>
                  </div>
                  {c.id === value.id && (
                    <Badge variant="outline" className="text-xs">Selected</Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>

        <div className="text-xs text-muted-foreground">
          Tip: You can switch communities anytime from the top-left.
        </div>
      </DialogContent>
    </Dialog>
  );
}
