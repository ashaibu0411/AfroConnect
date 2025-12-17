// src/components/FirstLoginLocationModal.tsx
import { useEffect, useMemo, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import CommunitySelector from "./CommunitySelector";
import AreaSelector from "./AreaSelector";
import { Community } from "@/lib/communities";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  community: Community;
  onChangeCommunity: (c: Community) => void;

  areaId: string;
  onChangeArea: (areaId: string) => void;

  onConfirm: () => void;
};

export default function FirstLoginLocationModal({
  open,
  onOpenChange,
  community,
  onChangeCommunity,
  areaId,
  onChangeArea,
  onConfirm,
}: Props) {
  const hasAreas = (community.areas ?? []).length > 0;

  const selectedAreaName = useMemo(() => {
    if (!hasAreas) return null;
    if (areaId === "all") return "All areas";
    return community.areas?.find((a) => a.id === areaId)?.name ?? null;
  }, [community, areaId, hasAreas]);

  // Reset area to "all" when switching to a city without areas
  useEffect(() => {
    if (!hasAreas) onChangeArea("all");
  }, [hasAreas, onChangeArea]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader className="space-y-2">
          <DialogTitle>Confirm your community</DialogTitle>
          <DialogDescription>
            AfroConnect organizes the feed, groups, and help requests by city.
            For some cities (like Accra), you can also choose a neighborhood.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* City */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">City</p>
              <Badge variant="outline" className="text-[11px]">
                Required
              </Badge>
            </div>

            <CommunitySelector value={community} onChange={onChangeCommunity} />

            <p className="text-xs text-muted-foreground">
              Current selection:{" "}
              <span className="font-medium">{community.name}</span>
            </p>
          </div>

          {/* Area (optional; only if city has areas) */}
          {hasAreas && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Area (optional)</p>
                <Badge variant="secondary" className="text-[11px]">
                  Optional
                </Badge>
              </div>

              <AreaSelector
                community={community}
                value={areaId}
                onChange={onChangeArea}
              />

              <p className="text-xs text-muted-foreground">
                Current selection:{" "}
                <span className="font-medium">
                  {selectedAreaName ?? "All areas"}
                </span>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                // Keep open if you want to force a decision.
                // If you want it dismissible, uncomment the next line:
                // onOpenChange(false);
                onConfirm();
              }}
            >
              Confirm
            </Button>

            <Button
              onClick={() => {
                onConfirm();
              }}
            >
              Continue
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground">
            You can change this later from the feed selector.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
