// src/components/AuthSheet.tsx
import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Eye, EyeOff, Phone } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type Mode = "signin" | "signup";
type Method = "email" | "phone";

function toE164(raw: string) {
  const cleaned = raw.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.length === 10) return `+1${cleaned}`;
  return cleaned;
}

export default function AuthSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithPhoneOtp,
    verifyPhoneOtp,
    upsertMyProfile,
    status,
  } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [method, setMethod] = useState<Method>("email");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isBusy = status === "loading";
  const title = useMemo(() => (mode === "signin" ? "Log in" : "Create account"), [mode]);

  function reset() {
    setErrorMsg(null);
    setPassword("");
    setOtp("");
    setOtpSent(false);
  }

  async function onGoogle() {
    setErrorMsg(null);
    try {
      await signInWithGoogle();
      toast.success("Logged in.");
      onOpenChange(false);
      reset();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Google sign-in failed.");
      toast.error("Google sign-in failed.");
    }
  }

  async function onEmailSubmit() {
    setErrorMsg(null);

    const e = email.trim();
    if (!e) return setErrorMsg("Email is required.");
    if (!password) return setErrorMsg("Password is required.");

    if (mode === "signup") {
      if (!firstName.trim()) return setErrorMsg("First name is required.");
      if (!lastName.trim()) return setErrorMsg("Last name is required.");
    }

    try {
      if (mode === "signin") {
        await signInWithEmail(e, password);
        toast.success("Logged in.");
      } else {
        await signUpWithEmail(e, password);

        // ✅ create/update profile row in Supabase
        await upsertMyProfile({ firstName, lastName });

        toast.success("Account created.");
      }

      onOpenChange(false);
      reset();
    } catch (err: any) {
      const msg = String(err?.message ?? "Auth failed.");
      if (msg.toLowerCase().includes("invalid login credentials")) {
        setErrorMsg("Wrong email or password.");
      } else {
        setErrorMsg(msg);
      }
    }
  }

  async function onSendOtp() {
    setErrorMsg(null);
    const p = toE164(phone.trim());
    if (!p) return setErrorMsg("Phone number is required.");

    try {
      await signInWithPhoneOtp(p);
      setOtpSent(true);
      toast.success("OTP sent.");
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to send OTP.");
    }
  }

  async function onVerifyOtp() {
    setErrorMsg(null);
    const p = toE164(phone.trim());
    const t = otp.trim();
    if (!p) return setErrorMsg("Phone number is required.");
    if (!t) return setErrorMsg("OTP is required.");

    try {
      await verifyPhoneOtp(p, t);
      toast.success("Logged in.");
      onOpenChange(false);
      reset();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "OTP verification failed.");
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[460px]">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <Button type="button" variant="outline" className="w-full" onClick={onGoogle} disabled={isBusy}>
            Continue with Google
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={method === "email" ? "default" : "outline"}
              onClick={() => {
                setMethod("email");
                setErrorMsg(null);
              }}
              disabled={isBusy}
            >
              Continue with email
            </Button>

            <Button
              type="button"
              variant={method === "phone" ? "default" : "outline"}
              onClick={() => {
                setMethod("phone");
                setErrorMsg(null);
              }}
              disabled={isBusy}
            >
              <Phone className="h-4 w-4 mr-2" />
              Continue with phone
            </Button>
          </div>

          {method === "email" ? (
            <>
              {mode === "signup" ? (
                <div className="grid grid-cols-2 gap-2">
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
                </div>
              ) : null}

              <div className="space-y-2">
                <Input
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  placeholder="Email"
                  inputMode="email"
                  autoComplete="email"
                />

                <div className="relative">
                  <Input
                    value={password}
                    onChange={(ev) => setPassword(ev.target.value)}
                    placeholder="Password"
                    type={showPass ? "text" : "password"}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-label={showPass ? "Hide password" : "Show password"}
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {errorMsg ? <div className="text-sm text-red-600">{errorMsg}</div> : null}
              </div>

              <Button className="w-full" onClick={onEmailSubmit} disabled={isBusy}>
                {mode === "signin" ? "Log in" : "Create account"}
              </Button>

              <div className="text-sm text-muted-foreground text-center">
                {mode === "signin" ? (
                  <>
                    Don’t have an account?{" "}
                    <button
                      type="button"
                      className="text-primary underline underline-offset-4"
                      onClick={() => {
                        setMode("signup");
                        setErrorMsg(null);
                      }}
                    >
                      Create one
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      className="text-primary underline underline-offset-4"
                      onClick={() => {
                        setMode("signin");
                        setErrorMsg(null);
                      }}
                    >
                      Log in
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone (e.g. 7205551234 or +233...)"
                  inputMode="tel"
                  autoComplete="tel"
                />

                {otpSent && (
                  <Input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter OTP code"
                    inputMode="numeric"
                  />
                )}

                {errorMsg ? <div className="text-sm text-red-600">{errorMsg}</div> : null}
              </div>

              {!otpSent ? (
                <Button className="w-full" onClick={onSendOtp} disabled={isBusy}>
                  Send OTP
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={onSendOtp} disabled={isBusy}>
                    Resend
                  </Button>
                  <Button onClick={onVerifyOtp} disabled={isBusy}>
                    Verify
                  </Button>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Note: phone OTP may require Supabase phone auth configuration for web (captcha + SMS provider).
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
