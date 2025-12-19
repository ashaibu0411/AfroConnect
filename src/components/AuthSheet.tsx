// src/components/AuthSheet.tsx
import { useMemo, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

type Mode = "login" | "signup";
type Method = "email" | "phone";

export default function AuthSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { status, signInWithEmail, signUpWithEmail, signInWithPhoneOtp, verifyPhoneOtp } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [method, setMethod] = useState<Method>("email");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [phone, setPhone] = useState(""); // E.164: +13035551234
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const loading = status === "loading";

  const title = useMemo(() => {
    if (mode === "signup") return "Create your AfroConnect account";
    return "Log in to AfroConnect";
  }, [mode]);

  async function doEmail() {
    try {
      const e = email.trim();
      const p = password.trim();

      if (!e) return toast.error("Enter your email.");
      if (!p) return toast.error("Enter your password.");

      if (mode === "signup") {
        await signUpWithEmail(e, p);
        toast.success("Account created. If email confirmation is enabled, check your inbox.");
      } else {
        await signInWithEmail(e, p);
        toast.success("Logged in.");
      }

      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Auth failed.");
    }
  }

  async function sendOtp() {
    try {
      const p = phone.trim();
      if (!p.startsWith("+")) {
        return toast.error("Phone must be in E.164 format, e.g. +13035551234");
      }

      await signInWithPhoneOtp(p);
      setOtpSent(true);
      toast.success("OTP sent by SMS.");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to send OTP.");
    }
  }

  async function confirmOtp() {
    try {
      const p = phone.trim();
      const code = otp.trim();

      if (!code) return toast.error("Enter the OTP code.");
      if (!p.startsWith("+")) return toast.error("Phone must start with + (E.164).");

      await verifyPhoneOtp(p, code);
      toast.success("Logged in.");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message ?? "OTP verification failed.");
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="p-0 sm:max-w-none">
        <div className="p-4 border-b">
          <div className="text-lg font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Choose email or phone. This will create a real account and enable backend features.
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={[
                "px-4 py-2 rounded-full text-sm border transition",
                mode === "login" ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted/50",
              ].join(" ")}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={[
                "px-4 py-2 rounded-full text-sm border transition",
                mode === "signup" ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted/50",
              ].join(" ")}
            >
              Create account
            </button>
          </div>

          {/* Method toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setMethod("email");
                setOtpSent(false);
                setOtp("");
              }}
              className={[
                "px-4 py-2 rounded-full text-sm border transition",
                method === "email" ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted/50",
              ].join(" ")}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod("phone");
                setPassword("");
              }}
              className={[
                "px-4 py-2 rounded-full text-sm border transition",
                method === "phone" ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted/50",
              ].join(" ")}
            >
              Phone
            </button>
          </div>

          {method === "email" ? (
            <div className="space-y-3">
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                type="password"
              />

              <Button onClick={doEmail} disabled={loading} className="w-full">
                {loading ? "Working..." : mode === "signup" ? "Create account" : "Login"}
              </Button>

              {mode === "signup" && (
                <div className="text-xs text-muted-foreground">
                  If email confirmation is enabled in Supabase, you must confirm your email to fully sign in.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone (E.164) e.g. +13035551234"
              />

              {!otpSent ? (
                <Button onClick={sendOtp} disabled={loading} className="w-full">
                  {loading ? "Working..." : "Send OTP"}
                </Button>
              ) : (
                <>
                  <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP code" />
                  <Button onClick={confirmOtp} disabled={loading} className="w-full">
                    {loading ? "Working..." : "Confirm & Login"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                    }}
                    className="w-full"
                  >
                    Resend / Change phone
                  </Button>
                </>
              )}

              <div className="text-xs text-muted-foreground">
                Phone login requires enabling Phone provider in Supabase Auth settings.
              </div>
            </div>
          )}
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
