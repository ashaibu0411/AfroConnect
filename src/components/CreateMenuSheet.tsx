import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { HelpCircle, ShoppingBag, CalendarDays, FileText } from "lucide-react";

export type CreateKind = "post" | "ask" | "sell" | "event";

export default function CreateMenuSheet({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPick: (k: CreateKind) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="p-0 sm:max-w-none">
        <div className="p-4 border-b">
          <SheetHeader>
            <SheetTitle>Create</SheetTitle>
          </SheetHeader>
          <p className="text-xs text-muted-foreground mt-1">
            Choose what you want to publish.
          </p>
        </div>

        <div className="p-4 space-y-2">
          <CreateRow
            title="Post"
            desc="Share an update with your community."
            icon={<FileText className="h-5 w-5" />}
            onClick={() => onPick("post")}
          />
          <CreateRow
            title="Ask"
            desc="Ask a question and get help fast."
            icon={<HelpCircle className="h-5 w-5" />}
            onClick={() => onPick("ask")}
          />
          <CreateRow
            title="Sell"
            desc="List something for sale or giveaway."
            icon={<ShoppingBag className="h-5 w-5" />}
            onClick={() => onPick("sell")}
          />
          <CreateRow
            title="Event"
            desc="Invite people to an event."
            icon={<CalendarDays className="h-5 w-5" />}
            onClick={() => onPick("event")}
          />
        </div>

        <div className="p-4 border-t flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CreateRow({
  title,
  desc,
  icon,
  onClick,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 border rounded-2xl px-4 py-3 hover:bg-muted/50 transition text-left"
    >
      <span className="h-10 w-10 rounded-2xl bg-muted flex items-center justify-center">
        {icon}
      </span>
      <span className="min-w-0">
        <div className="font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </span>
    </button>
  );
}
