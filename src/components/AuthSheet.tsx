// src/components/AuthSheet.tsx
import { useMemo, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

import { supabase } from "@/lib/supabaseClient";
import { useInternetIdentity, type AuthUser } from "@/hooks/useInternetIdentity";

type Mode = "login" | "signup";
type Method = "email" | "phone";

function mapSupabaseUserToAuthUser(u: any): AuthUser {
  return {
    id: u.id,
    displayName:
      (u.user_metadata?.display_name as string) ||
      (u.user_metadata?.full_name as string) ||
      (u.email as string) ||
      (u.phone as string) ||
      "User",
    email: u.email ?? undefined,
    phone: u.phone ?? undefined,
  };
}

export default function AuthSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { completeAuth } = useInternetIdentity();

  const [mode, setMode] = useState<Mode>("login");
  const [method, setMethod] = useState<Method>("email");

  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [phone, setPhone] = useState(""); // E.164: +13035551234
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const title = useMemo(() => {
    if (mode === "signup") return "Create your AfroConnect account";
    return "Log in to AfroConnect";
  }, [mode]);

  async function finalizeSession() {
    // After sign-in/up, ensure we have a session + user
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;

    const user = data.session?.user;
    if (!user) throw new Error("No active session returned from Supabase.");

    completeAuth(mapSupabaseUserToAuthUser(user));
  }

  async function doEmail() {
    try {
      if (!email.trim()) return toast.error("Enter your email.");
      if (!password.trim()) return toast.error("Enter your password.");

      setLoading(true);

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) throw error;

        // If email confirmation is ON, session may be null. We handle both cases.
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          completeAuth(mapSupabaseUserToAuthUser(data.session.user));
          toast.success("Account created and signed in.");
          onOpenChange(false);
        } else {
          toast.success("Account created. Check your email to confirm, then login.");
          onOpenChange(false);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;

        await finalizeSession();
        toast.success("Logged in.");
        onOpenChange(false);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Auth failed.");
    } finally {
      setLoading(false);
    }
  }

  async function sendOtp() {
    try {
      if (!phone.trim().startsWith("+")) {
        return toast.error("Phone must be in E.164 format, e.g. +13035551234");
      }

      setLoading(true);

      const { error } = await supabase.auth.signInWithOtp({
        phone: phone.trim(),
      });
      if (error) throw error;

      setOtpSent(true);
      toast.success("OTP sent by SMS.");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmOtp() {
    try {
      if (!otp.trim()) return toast.error("Enter the OTP code.");

      setLoading(true);

      const { error } = await supabase.auth.verifyOtp({
        phone: phone.trim(),
        token: otp.trim(),
        type: "sms",
      });
      if (error) throw error;

      await finalizeSession();
      toast.success("Logged in.");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setOtp("");
          setOtpSent(false);
          setLoading(false);
        }
      }}
    >
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
                  If email confirmation is enabled in Supabase, you must confirm via email before login.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone (E.164 format) e.g. +13035551234"
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
                Phone login requires enabling Phone in Supabase Auth settings.
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
