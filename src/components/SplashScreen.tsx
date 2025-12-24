// src/components/SplashScreen.tsx
import { useEffect } from "react";

type Props = {
  durationMs?: number;
  onDone: () => void;
  logoSrc?: string; // optional: pass your actual logo path
  appName?: string;
  tagline?: string;
};

export default function SplashScreen({
  durationMs = 2000,
  onDone,
  logoSrc,
  appName = "AfroConnect",
  tagline = "Connecting Africans Globally, Building Communities.",
}: Props) {
  useEffect(() => {
    const t = window.setTimeout(() => onDone(), durationMs);
    return () => window.clearTimeout(t);
  }, [durationMs, onDone]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-emerald-50">
      <div className="w-full max-w-md px-6">
        <div className="rounded-3xl border bg-white/70 backdrop-blur shadow-sm p-8 text-center">
          {logoSrc ? (
            <img src={logoSrc} alt="AfroConnect Logo" className="h-20 w-20 mx-auto mb-4 rounded-2xl object-contain" />
          ) : (
            <div className="h-20 w-20 mx-auto mb-4 rounded-2xl bg-orange-100 flex items-center justify-center text-2xl font-bold">
              AC
            </div>
          )}

          <div className="text-2xl font-bold">{appName}</div>
          <div className="text-sm text-muted-foreground mt-2">{tagline}</div>

          <div className="mt-6 flex justify-center">
            <div className="h-2 w-2 rounded-full bg-orange-500 animate-bounce" />
            <div className="h-2 w-2 rounded-full bg-orange-500 animate-bounce [animation-delay:120ms] mx-2" />
            <div className="h-2 w-2 rounded-full bg-orange-500 animate-bounce [animation-delay:240ms]" />
          </div>
        </div>
      </div>
    </div>
  );
}
