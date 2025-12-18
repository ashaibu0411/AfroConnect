import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

const LS_AUTH = "afroconnect.auth.v1";
const LS_PROFILE = "afroconnect.profile";

type Mode = "signup" | "signin";
type Method = "email" | "phone";

type StoredAuth = {
  method: Method;
  identifier: string; // email or phone
  createdAt: number;
};

export default function AuthSheet({
  open,
  onOpenChange,
  onAuthed,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAuthed: (identifier: string) => void; // tell App we’re “logged in”
}) {
  const [mode, setMode] = useState<Mode>("signup");
  const [method, setMethod] = useState<Method>("email");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const identifier = useMemo(() => {
    return method === "email" ? email.trim().toLowerCase() : phone.trim();
  }, [method, email, phone]);

  const valid = useMemo(() => {
    if (!identifier) return false;
    if (method === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    // basic phone validation; you can tighten later
    return identifier.replace(/[^\d+]/g, "").length >= 8;
  }, [identifier, method]);

  function saveAuth() {
    const payload: StoredAuth = {
      method,
      identifier,
      createdAt: Date.now(),
    };
    localStorage.setItem(LS_AUTH, JSON.stringify(payload));

    // Optional: set a default profile displayName if none
    try {
      const raw = localStorage.getItem(LS_PROFILE);
      const p = raw ? (JSON.parse(raw) as any) : {};
      if (!p.displayName) {
        const guess =
          method === "email"
            ? identifier.split("@")[0]
            : `User ${identifier.slice(-4)}`;
        localStorage.setItem(LS_PROFILE, JSON.stringify({ ...p, displayName: guess }));
      }
    } catch {
      // ignore
    }
  }

  function submit() {
    if (!valid) return;

    // MVP behavior (no backend yet):
    // - “Sign up” always creates local auth
    // - “Sign in” checks if local auth exists and matches
    const raw = localStorage.getItem(LS_AUTH);
    const existing = raw ? (JSON.parse(raw) as StoredAuth) : null;

    if (mode === "signin") {
      if (!existing) {
        toast.error("No account found on this device. Please create an account first.");
        return;
      }
      if (existing.identifier !== identifier || existing.method !== method) {
        toast.error("Account not found on this device. Please check your email/phone.");
        return;
      }
      toast.success("Signed in.");
      onAuthed(identifier);
      onOpenChange(false);
      return;
    }

    // signup
    saveAuth();
    toast.success("Account created.");
    onAuthed(identifier);
    onOpenChange(false);
  }

  function resetAndClose() {
    setEmail("");
    setPhone("");
    setMode("signup");
    setMethod("email");
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="p-0 sm:max-w-none">
        <div className="p-4 border-b">
          <SheetHeader>
            <SheetTitle>{mode === "signup" ? "Create your account" : "Sign in"}</SheetTitle>
          </SheetHeader>
          <p className="text-xs text-muted-foreground mt-1">
            Choose email or phone. We’ll connect this to the backend next.
          </p>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            <Button
              variant={mode === "signup" ? "default" : "outline"}
              onClick={() => setMode("signup")}
            >
              Create account
            </Button>
            <Button
              variant={mode === "signin" ? "default" : "outline"}
              onClick={() => setMode("signin")}
            >
              Sign in
            </Button>
          </div>

          <Tabs
            value={method}
            onValueChange={(v) => setMethod(v as Method)}
            className="w-full"
          >
            <TabsList className="w-full">
              <TabsTrigger className="flex-1" value="email">Email</TabsTrigger>
              <TabsTrigger className="flex-1" value="phone">Phone</TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="mt-3 space-y-2">
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                inputMode="email"
                autoCapitalize="none"
              />
              <p className="text-xs text-muted-foreground">
                We’ll add email verification/OTP when we connect the backend.
              </p>
            </TabsContent>

            <TabsContent value="phone" className="mt-3 space-y-2">
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 720 555 0123"
                inputMode="tel"
              />
              <p className="text-xs text-muted-foreground">
                We’ll add SMS OTP when we connect the backend.
              </p>
            </TabsContent>
          </Tabs>
        </div>

        <div className="p-4 border-t flex items-center justify-between gap-2">
          <Button variant="outline" onClick={resetAndClose}>Cancel</Button>
          <Button onClick={submit} disabled={!valid}>
            {mode === "signup" ? "Create account" : "Sign in"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
