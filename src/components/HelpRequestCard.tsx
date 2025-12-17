// src/components/HelpRequestCard.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, AlertTriangle } from "lucide-react";
import type { HelpRequest } from "@/lib/helpRequests";
import { HELP_TYPE_LABEL, timeAgo } from "@/lib/helpRequests";
import type { Community } from "@/lib/communities";

export default function HelpRequestCard({
  request,
  community,
}: {
  request: HelpRequest;
  community: Community;
}) {
  const areaName =
    request.areaId && request.areaId !== "all"
      ? community.areas?.find((a) => a.id === request.areaId)?.name
      : null;

  return (
    <Card className="border border-primary/10">
      <CardContent className="pt-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{request.title}</p>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {community.name}
              {areaName ? ` · ${areaName}` : ""}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {request.createdBy} · {timeAgo(request.createdAtIso)}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            {request.urgency === "urgent" ? (
              <Badge variant="destructive" className="text-[10px]">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Urgent
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px]">
                Normal
              </Badge>
            )}

            <Badge variant="outline" className="text-[10px]">
              {HELP_TYPE_LABEL[request.type]}
            </Badge>
          </div>
        </div>

        <p className="text-xs text-muted-foreground whitespace-pre-line">
          {request.details}
        </p>
      </CardContent>
    </Card>
  );
}
