// src/components/AuthSheet.tsx
import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Eye, EyeOff, Phone } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type Mode = "signin" | "signup";
type Method = "email" | "phone";

function toE164(raw: string) {
  const input = (raw || "").trim();
  if (!input) return "";
  const hasPlus = input.startsWith("+");
  const digits = input.replace(/[^\d]/g, "");
  if (!digits) return "";
  if (hasPlus) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length >= 11) return `+${digits}`;
  return digits;
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

  // NEW: profile fields for signup
  const [displayName, setDisplayName] = useState("");
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

  useEffect(() => {
    if (!open) return;
    setErrorMsg(null);
    setOtp("");
    setOtpSent(false);
    setShowPass(false);
  }, [open]);

  function softResetAuthFields() {
    setErrorMsg(null);
    setPassword("");
    setOtp("");
    setOtpSent(false);
  }

  function switchMethod(next: Method) {
    setMethod(next);
    setErrorMsg(null);
    setOtp("");
    setOtpSent(false);
  }

  function switchMode(next: Mode) {
    setMode(next);
    setErrorMsg(null);
    setOtp("");
    setOtpSent(false);
  }

  function requireSignupNames() {
    if (!displayName.trim()) return "Display name is required.";
    if (!firstName.trim()) return "First name is required.";
    if (!lastName.trim()) return "Last name is required.";
    return null;
  }

  async function onGoogle() {
    setErrorMsg(null);
    try {
      await signInWithGoogle();
      // OAuth redirects; this toast may not show in all flows, but it’s fine.
      toast.success("Continuing with Google...");
    } catch (e: any) {
      const msg = e?.message ?? "Google sign-in failed.";
      setErrorMsg(msg);
      toast.error("Google sign-in failed.");
    }
  }

  async function onEmailSubmit() {
    setErrorMsg(null);

    const e = email.trim();
    if (!e) return setErrorMsg("Email is required.");
    if (!password) return setErrorMsg("Password is required.");

    if (mode === "signup") {
      const err = requireSignupNames();
      if (err) return setErrorMsg(err);
    }

    try {
      if (mode === "signin") {
        await signInWithEmail(e, password);
        toast.success("Logged in.");
      } else {
        const session = await signUpWithEmail(e, password);

        // If email confirmation is ON, session may be null (user must confirm email).
        if (!session?.user) {
          toast.success("Account created. Please check your email to confirm, then log in.");
          onOpenChange(false);
          softResetAuthFields();
          return;
        }

        await upsertMyProfile({
          displayName: displayName.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        });

        toast.success("Account created.");
      }

      onOpenChange(false);
      softResetAuthFields();
    } catch (err: any) {
      const msg = String(err?.message ?? "Auth failed.");

      if (msg.toLowerCase().includes("invalid login credentials")) {
        setErrorMsg("Wrong email or password.");
      } else if (msg.toLowerCase().includes("already registered")) {
        setErrorMsg("This email is already in use. Try logging in.");
      } else {
        setErrorMsg(msg);
      }
    }
  }

  async function onSendOtp() {
    setErrorMsg(null);

    if (mode === "signup") {
      const err = requireSignupNames();
      if (err) return setErrorMsg(err);
    }

    const p = toE164(phone);
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

    const p = toE164(phone);
    const t = otp.trim();

    if (!p) return setErrorMsg("Phone number is required.");
    if (!t) return setErrorMsg("OTP is required.");

    try {
      await verifyPhoneOtp(p, t);

      if (mode === "signup") {
        await upsertMyProfile({
          displayName: displayName.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        });
        toast.success("Account created.");
      } else {
        toast.success("Logged in.");
      }

      onOpenChange(false);
      softResetAuthFields();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "OTP verification failed.");
    }
  }

  const primaryDisabled =
    isBusy ||
    (method === "email"
      ? !email.trim() || !password
      : !toE164(phone) || (otpSent ? !otp.trim() : false));

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
              onClick={() => switchMethod("email")}
              disabled={isBusy}
            >
              Continue with email
            </Button>

            <Button
              type="button"
              variant={method === "phone" ? "default" : "outline"}
              onClick={() => switchMethod("phone")}
              disabled={isBusy}
            >
              <Phone className="h-4 w-4 mr-2" />
              Continue with phone
            </Button>
          </div>

          {/* Signup identity fields */}
          {mode === "signup" ? (
            <div className="space-y-2">
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display name (what your community sees)"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
              </div>
            </div>
          ) : null}

          {method === "email" ? (
            <>
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

              <Button className="w-full" onClick={onEmailSubmit} disabled={primaryDisabled}>
                {mode === "signin" ? "Log in" : "Create account"}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone (e.g. +233501234567 or 7205551234)"
                  inputMode="tel"
                  autoComplete="tel"
                />

                {otpSent ? (
                  <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP code" inputMode="numeric" />
                ) : null}

                {errorMsg ? <div className="text-sm text-red-600">{errorMsg}</div> : null}
              </div>

              {!otpSent ? (
                <Button className="w-full" onClick={onSendOtp} disabled={primaryDisabled}>
                  Send OTP
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={onSendOtp} disabled={isBusy}>
                    Resend
                  </Button>
                  <Button onClick={onVerifyOtp} disabled={primaryDisabled}>
                    Verify
                  </Button>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Phone OTP requires Supabase Phone Auth enabled and an SMS provider configured.
              </div>
            </>
          )}

          <div className="text-sm text-muted-foreground text-center">
            {mode === "signin" ? (
              <>
                Don’t have an account?{" "}
                <button
                  type="button"
                  className="text-primary underline underline-offset-4"
                  onClick={() => switchMode("signup")}
                  disabled={isBusy}
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
                  onClick={() => switchMode("signin")}
                  disabled={isBusy}
                >
                  Log in
                </button>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
