import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Globe, Lock, EyeOff, MapPin, Users, MessageCircle } from "lucide-react";

export type Visibility = "public" | "private" | "hidden";

export type Group = {
  id: string;
  name: string;
  description: string;
  visibility: Visibility;
  memberCount: number;
  city: string;
  state: string;
  country: string;
  tags?: string[];
  rules?: string[];
};

function visibilityBadge(v: Visibility) {
  if (v === "public")
    return (
      <Badge variant="outline" className="text-xs flex items-center gap-1">
        <Globe className="h-3 w-3" /> Public
      </Badge>
    );
  if (v === "private")
    return (
      <Badge variant="secondary" className="text-xs flex items-center gap-1">
        <Lock className="h-3 w-3" /> Private
      </Badge>
    );
  return (
    <Badge variant="secondary" className="text-xs flex items-center gap-1">
      <EyeOff className="h-3 w-3" /> Hidden
    </Badge>
  );
}

// This MUST match the MessagesSection parser format:
// "Group: <name> | <location> | <type>"
function groupThreadTitle(group: Group) {
  const location = `${group.city}, ${group.state} ${group.country}`;
  const type = group.visibility; // public/private/hidden
  return `Group: ${group.name} | ${location} | ${type}`;
}

export default function GroupDetails({
  group,
  isJoined,
  onJoinToggle,
  onStartChat,
}: {
  group: Group;
  isJoined: boolean;
  onJoinToggle: () => void;
  onStartChat?: (title: string) => void;
}) {
  const canOpenThread = !!onStartChat;

  return (
    <div className="h-full p-4">
      <Card className="h-full">
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-xl font-bold truncate">
                {group.name}
              </CardTitle>

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {visibilityBadge(group.visibility)}

                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Users className="h-3 w-3" /> {group.memberCount} members
                </Badge>

                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {group.city}, {group.state}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={onJoinToggle}
                variant={isJoined ? "outline" : "default"}
              >
                {isJoined ? "Leave" : "Join"}
              </Button>

              <Button
                variant="outline"
                className="gap-2"
                disabled={!canOpenThread}
                onClick={() => onStartChat?.(groupThreadTitle(group))}
                title="Open the group thread in Messages"
              >
                <MessageCircle className="h-4 w-4" />
                Thread
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{group.description}</p>

          {group.tags && group.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {group.tags.map((t) => (
                <Badge key={t} variant="secondary" className="text-xs">
                  {t}
                </Badge>
              ))}
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-semibold">Group rules</p>
            {group.rules && group.rules.length > 0 ? (
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                {group.rules.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No rules added yet.</p>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-semibold">Next step</p>
            <p className="text-sm text-muted-foreground">
              Next: add Events inside each group and then a Calendar view (with privacy controls).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
