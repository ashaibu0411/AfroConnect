// src/components/AreaSelector.tsx
import { MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";
import type { Community } from "@/lib/communities";

type Props = {
  community: Community;
  value: string; // "all" | areaId
  onChange: (areaId: string) => void;
};

export default function AreaSelector({ community, value, onChange }: Props) {
  const areas = community.areas ?? [];
  if (!areas.length) return null;

  return (
    <div className="flex items-center gap-2">
      <MapPin className="h-4 w-4 text-muted-foreground" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-[200px]">
          <SelectValue placeholder="All areas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All areas</SelectItem>
          <SelectSeparator />
          {areas.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
