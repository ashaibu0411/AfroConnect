// src/components/AuthSheet.tsx
import { useMemo, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff } from "lucide-react";

type Mode = "login" | "signup";
type Method = "email" | "phone";

function friendlyAuthError(message?: string) {
  const m = (message || "").toLowerCase();

  // Supabase common messages
  if (m.includes("invalid login credentials")) return "Wrong email or password.";
  if (m.includes("invalid") && m.includes("password")) return "Wrong email or password.";
  if (m.includes("user already registered")) return "An account already exists. Try logging in instead.";
  if (m.includes("rate limit")) return "Too many attempts. Please wait a moment and try again.";
  return message || "Authentication failed.";
}

export default function AuthSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const {
    status,
    signInWithEmail,
    signUpWithEmail,
    signInWithPhoneOtp,
    verifyPhoneOtp,
    upsertMyProfile,
  } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [method, setMethod] = useState<Method>("email");

  // NEW: required names (for signup)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [phone, setPhone] = useState(""); // E.164: +13035551234
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const loading = status === "loading";

  const title = useMemo(() => {
    if (mode === "signup") return "Create your AfroConnect account";
    return "Log in to AfroConnect";
  }, [mode]);

  function requireNamesIfSignup() {
    if (mode !== "signup") return true;
    if (!firstName.trim()) {
      toast.error("Enter your first name.");
      return false;
    }
    if (!lastName.trim()) {
      toast.error("Enter your last name.");
      return false;
    }
    return true;
  }

  function resetClose() {
    setEmail("");
    setPassword("");
    setShowPw(false);
    setPhone("");
    setOtp("");
    setOtpSent(false);
    // keep names (optional), but you can reset them too if you want:
    // setFirstName(""); setLastName("");
    onOpenChange(false);
  }

  async function doEmail() {
    try {
      if (!email.trim()) return toast.error("Enter your email.");
      if (!password.trim()) return toast.error("Enter your password.");
      if (!requireNamesIfSignup()) return;

      if (mode === "signup") {
        await signUpWithEmail(email.trim(), password);
        // If email confirmation is enabled, session might not exist immediately.
        // If session exists, profile upsert will work now. If not, user will do confirm then login.
        try {
          await upsertMyProfile({ firstName, lastName });
        } catch {
          // If no session yet (email confirm flow), do not hard-fail.
        }
        toast.success("Account created. If email confirmation is enabled, check your inbox, then log in.");
      } else {
        await signInWithEmail(email.trim(), password);
        toast.success("Logged in.");
      }

      resetClose();
    } catch (e: any) {
      toast.error(friendlyAuthError(e?.message));
    }
  }

  async function sendOtp() {
    try {
      if (!requireNamesIfSignup()) return;

      if (!phone.trim().startsWith("+")) {
        return toast.error("Phone must be in E.164 format, e.g. +13035551234");
      }

      await signInWithPhoneOtp(phone.trim());
      setOtpSent(true);
      toast.success("OTP sent by SMS.");
    } catch (e: any) {
      toast.error(friendlyAuthError(e?.message));
    }
  }

  async function confirmOtp() {
    try {
      if (!otp.trim()) return toast.error("Enter the OTP code.");
      await verifyPhoneOtp(phone.trim(), otp.trim());

      // After OTP verification, user is authenticated → profile can be saved
      if (mode === "signup") {
        await upsertMyProfile({ firstName, lastName });
      }

      toast.success("Logged in.");
      resetClose();
    } catch (e: any) {
      toast.error(friendlyAuthError(e?.message));
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="p-0 sm:max-w-none">
        <div className="p-4 border-b">
          <div className="text-lg font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground mt-1">
            AfroConnect uses real names to keep communities safe and trustworthy.
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setOtpSent(false);
              }}
              className={[
                "px-4 py-2 rounded-full text-sm border transition",
                mode === "login" ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted/50",
              ].join(" ")}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setOtpSent(false);
              }}
              className={[
                "px-4 py-2 rounded-full text-sm border transition",
                mode === "signup" ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted/50",
              ].join(" ")}
            >
              Create account
            </button>
          </div>

          {/* Name (required for signup) */}
          {mode === "signup" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
              <div className="sm:col-span-2 text-xs text-muted-foreground">
                Use the name you want your community to see.
              </div>
            </div>
          )}

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
                setShowPw(false);
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

              <div className="relative">
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  type={showPw ? "text" : "password"}
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-muted"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <Button onClick={doEmail} disabled={loading} className="w-full">
                {loading ? "Working..." : mode === "signup" ? "Create account" : "Login"}
              </Button>

              {mode === "signup" && (
                <div className="text-xs text-muted-foreground">
                  If email confirmation is enabled in Supabase, you may need to confirm your email before logging in.
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
                    {loading ? "Working..." : mode === "signup" ? "Confirm & Create account" : "Confirm & Login"}
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
                Phone login requires enabling the Phone provider in Supabase Auth settings.
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
