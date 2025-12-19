import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallback() {
  const [message, setMessage] = useState("Finishing sign-in…");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // Supabase OAuth/Email link redirect handling
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);

        if (!alive) return;

        if (error) {
          console.error("[AuthCallback] exchangeCodeForSession error:", error);
          setMessage("Sign-in failed. Please try again.");
          return;
        }

        setMessage("Signed in successfully. Redirecting…");

        // Send user back to the app (change if you want a different landing page)
        window.location.replace("/");
      } catch (e) {
        console.error("[AuthCallback] unexpected error:", e);
        if (!alive) return;
        setMessage("Sign-in failed. Please try again.");
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ maxWidth: 420, textAlign: "center" }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>AfroConnect</h1>
        <p style={{ opacity: 0.8 }}>{message}</p>
      </div>
    </div>
  );
}
