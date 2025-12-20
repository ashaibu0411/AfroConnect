// src/components/AuthSheet.tsx
import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Mode = "login" | "signup";
type Method = "email" | "phone";

function normalizePhone(phone: string) {
  const p = phone.trim();
  if (!p) return "";
  // Keep it simple: user must provide E.164 like +1720...
  return p.startsWith("+") ? p : `+${p}`;
}

function friendlyAuthError(err: unknown) {
  const msg = typeof err === "object" && err && "message" in err ? String((err as any).message) : String(err ?? "");

  const lower = msg.toLowerCase();

  // Supabase common messages / patterns
  if (lower.includes("invalid login credentials")) return "Wrong email or password. Please try again.";
  if (lower.includes("invalid credentials")) return "Wrong email or password. Please try again.";
  if (lower.includes("email not confirmed")) return "Please confirm your email first (check your inbox).";
  if (lower.includes("user not found")) return "No account found with that email. Try signing up instead.";
  if (lower.includes("phone") && lower.includes("invalid")) return "That phone number looks invalid. Use format +1XXXXXXXXXX.";
  if (lower.includes("otp") && (lower.includes("invalid") || lower.includes("expired")))
    return "That OTP is invalid or expired. Request a new code and try again.";

  // fallback
  return msg || "Something went wrong. Please try again.";
}

export default function AuthSheet({ open, onOpenChange }: Props) {
  const { signInWithEmail, signUpWithEmail, signInWithPhoneOtp, verifyPhoneOtp, status } = useAuth();

  const busy = status === "loading";

  const [mode, setMode] = useState<Mode>("login");
  const [method, setMethod] = useState<Method>("email");

  // email form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // show/hide password
  const [showPassword, setShowPassword] = useState(false);

  // phone OTP form
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const title = useMemo(() => {
    if (mode === "signup") return "Create account";
    return "Login";
  }, [mode]);

  async function onSubmitEmail() {
    const e = email.trim();
    const p = password;

    if (!e) {
      toast.error("Please enter your email.");
      return;
    }
    if (!p || p.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    try {
      if (mode === "signup") {
        await signUpWithEmail(e, p);
        toast.success("Account created. You're in.");
        onOpenChange(false);
      } else {
        await signInWithEmail(e, p);
        toast.success("Logged in.");
        onOpenChange(false);
      }
    } catch (err) {
      toast.error(friendlyAuthError(err));
      // Do NOT clear password; user may want to toggle visibility and correct it.
    }
  }

  async function onSendOtp() {
    const p = normalizePhone(phone);
    if (!p || p.length < 8) {
      toast.error("Enter a valid phone number (example: +1720XXXXXXX).");
      return;
    }

    try {
      await signInWithPhoneOtp(p);
      setOtpSent(true);
      toast.success("OTP sent. Check your SMS.");
    } catch (err) {
      toast.error(friendlyAuthError(err));
    }
  }

  async function onVerifyOtp() {
    const p = normalizePhone(phone);
    const t = otp.trim();
    if (!p) {
      toast.error("Enter your phone number first.");
      return;
    }
    if (!t) {
      toast.error("Enter the OTP code.");
      return;
    }

    try {
      await verifyPhoneOtp(p, t);
      toast.success("Logged in.");
      onOpenChange(false);
    } catch (err) {
      toast.error(friendlyAuthError(err));
    }
  }

  function resetPhoneFlow() {
    setOtpSent(false);
    setOtp("");
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="p-0 sm:max-w-none">
        <div className="p-4 border-b">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>

          {/* Mode toggle */}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className={[
                "px-4 py-1.5 rounded-full text-sm border transition",
                mode === "login" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted/50",
              ].join(" ")}
              onClick={() => setMode("login")}
            >
              Login
            </button>

            <button
              type="button"
              className={[
                "px-4 py-1.5 rounded-full text-sm border transition",
                mode === "signup"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted/50",
              ].join(" ")}
              onClick={() => setMode("signup")}
            >
              Create account
            </button>
          </div>

          {/* Method toggle */}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className={[
                "px-4 py-1.5 rounded-full text-sm border transition",
                method === "email" ? "bg-muted border-muted-foreground/20" : "bg-background hover:bg-muted/50",
              ].join(" ")}
              onClick={() => {
                setMethod("email");
                resetPhoneFlow();
              }}
            >
              Email
            </button>

            <button
              type="button"
              className={[
                "px-4 py-1.5 rounded-full text-sm border transition",
                method === "phone" ? "bg-muted border-muted-foreground/20" : "bg-background hover:bg-muted/50",
              ].join(" ")}
              onClick={() => {
                setMethod("phone");
                // keep email/pass as-is, just switch view
              }}
            >
              Phone
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {method === "email" ? (
            <>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Email</label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  autoCapitalize="none"
                  autoCorrect="off"
                  inputMode="email"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Password</label>

                <div className="relative">
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "signup" ? "Create a password" : "Enter your password"}
                    type={showPassword ? "text" : "password"}
                    autoCapitalize="none"
                    autoCorrect="off"
                  />

                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <div className="text-xs text-muted-foreground">
                  {mode === "signup" ? "Tip: use at least 6 characters." : "Tip: tap the eye icon to confirm what you typed."}
                </div>
              </div>

              <Button onClick={onSubmitEmail} disabled={busy} className="w-full">
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Please wait…
                  </>
                ) : mode === "signup" ? (
                  "Create account"
                ) : (
                  "Login"
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Phone (E.164)</label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1720XXXXXXX"
                  inputMode="tel"
                />
                <div className="text-xs text-muted-foreground">
                  Must include country code, e.g. <strong>+1</strong> for USA.
                </div>
              </div>

              {!otpSent ? (
                <Button onClick={onSendOtp} disabled={busy} className="w-full">
                  {busy ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">OTP Code</label>
                    <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" inputMode="numeric" />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={onVerifyOtp} disabled={busy} className="flex-1">
                      {busy ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Verifying…
                        </>
                      ) : (
                        "Verify & Login"
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        resetPhoneFlow();
                      }}
                    >
                      Change phone
                    </Button>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={onSendOtp}
                    disabled={busy}
                  >
                    Resend OTP
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
