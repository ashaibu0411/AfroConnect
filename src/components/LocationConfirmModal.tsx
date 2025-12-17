// src/components/LocationConfirmModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import CommunitySelector from "./CommunitySelector";
import AreaSelector from "./AreaSelector";
import type { Community } from "@/lib/communities";

type Props = {
  open: boolean;

  community: Community;
  areaId: string;

  onChangeCommunity: (communityId: string) => void;
  onChangeArea: (areaId: string) => void;

  onConfirm: () => void;
  onSkip: () => void;
};

export default function LocationConfirmModal({
  open,
  community,
  areaId,
  onChangeCommunity,
  onChangeArea,
  onConfirm,
  onSkip,
}: Props) {
  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-[520px]"
        // prevent closing by clicking outside
        onInteractOutside={(e) => e.preventDefault()}
        // prevent closing by ESC
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Confirm your community</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose your city so AfroConnect can show the right feed, groups, and help requests.
          </p>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">City</p>
            <CommunitySelector
              value={community}
              onChange={(c) => onChangeCommunity(c.id)}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Area (optional)
            </p>
            <AreaSelector
              community={community}
              value={areaId}
              onChange={onChangeArea}
            />
            <p className="text-[11px] text-muted-foreground">
              If your city supports areas (like Accra), you can narrow results. Otherwise, leave it as “All areas”.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onSkip}>
              Skip for now
            </Button>
            <Button onClick={onConfirm} className="min-w-[160px]">
              Confirm Location
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
