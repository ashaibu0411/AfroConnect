import { useMemo, useState } from "react";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type NotificationItem = {
  id: string;
  title: string;
  subtitle?: string;
  timeAgo: string;
  avatarText: string;
  imageUrl?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityName: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function NotificationRow({ item }: { item: NotificationItem }) {
  return (
    <button
      type="button"
      className="w-full text-left px-3 py-3 flex items-center gap-3 hover:bg-muted/60 transition rounded-md"
      onClick={() => {
        // later: navigate to the post/thread
        console.log("Open notification:", item.id);
      }}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src="/assets/generated/default-avatar.dim_100x100.png" />
        <AvatarFallback>{initials(item.avatarText)}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.title}</p>
        {item.subtitle ? (
          <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {item.timeAgo}
        </span>

        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            className="h-10 w-10 rounded-md object-cover border"
          />
        ) : null}
      </div>
    </button>
  );
}

export default function NotificationsSheet({ open, onOpenChange, communityName }: Props) {
  const [tab, setTab] = useState<"neighborhood" | "activity" | "alerts">("neighborhood");

  // Mock lists (replace with real data later)
  const neighborhood = useMemo<NotificationItem[]>(
    () => [
      {
        id: "n1",
        title: "Ashraf Azeem just posted: ECCV – East Cherry Creek Valley Water…",
        timeAgo: "3h",
        avatarText: "Ashraf Azeem",
      },
      {
        id: "n2",
        title: "Valerie Boswell’s post is trending",
        subtitle: "Well, this happened last night so…",
        timeAgo: "4h",
        avatarText: "Valerie Boswell",
        imageUrl: "/assets/generated/default-avatar.dim_100x100.png",
      },
      {
        id: "n3",
        title: "Catherine S.’s post is trending",
        subtitle: "UPS says our package was delive…",
        timeAgo: "10h",
        avatarText: "Catherine S.",
        imageUrl: "/assets/generated/default-avatar.dim_100x100.png",
      },
    ],
    []
  );

  const activity = useMemo<NotificationItem[]>(
    () => [
      {
        id: "a1",
        title: "Someone liked your post",
        subtitle: "“Looking for housing near Aurora…”",
        timeAgo: "2h",
        avatarText: "AfroConnect",
      },
      {
        id: "a2",
        title: "New comment on your post",
        subtitle: "“Check RTD routes from DIA…”",
        timeAgo: "7h",
        avatarText: "AfroConnect",
      },
    ],
    []
  );

  const alerts = useMemo<NotificationItem[]>(
    () => [
      {
        id: "al1",
        title: "Weather alert in your area",
        subtitle: "Expect snow later tonight.",
        timeAgo: "1h",
        avatarText: "Alert",
      },
    ],
    []
  );

  const list = tab === "neighborhood" ? neighborhood : tab === "activity" ? activity : alerts;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[420px] sm:w-[520px] p-0">
        <SheetHeader className="px-4 py-4 border-b">
          <SheetTitle className="text-base">Notifications</SheetTitle>
          <p className="text-xs text-muted-foreground mt-1">{communityName}</p>
        </SheetHeader>

        <div className="px-4 pt-3">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="neighborhood" className="text-xs">
                Neighborhood
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-xs">
                My activity
              </TabsTrigger>
              <TabsTrigger value="alerts" className="text-xs">
                Alerts
              </TabsTrigger>
            </TabsList>

            <TabsContent value={tab} className="mt-3">
              <ScrollArea className="h-[calc(100vh-160px)] pr-3">
                <div className="space-y-1">
                  <div className="px-1 pb-2">
                    <p className="text-xs font-semibold text-muted-foreground">Today</p>
                  </div>

                  {list.map((item) => (
                    <NotificationRow key={item.id} item={item} />
                  ))}

                  <div className="px-1 pt-5 pb-2">
                    <p className="text-xs font-semibold text-muted-foreground">Last 7 days</p>
                  </div>

                  {list.map((item) => (
                    <NotificationRow
                      key={`${item.id}-old`}
                      item={{ ...item, id: `${item.id}-old`, timeAgo: "1d" }}
                    />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
