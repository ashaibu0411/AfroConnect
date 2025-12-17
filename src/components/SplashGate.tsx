// src/components/SplashGate.tsx
import { useEffect, useState } from "react";

type Props = {
  durationMs?: number; // default 5000
  logoSrc: string;
  slogan?: string;
  children: React.ReactNode;
};

export default function SplashGate({ durationMs = 5000, logoSrc, slogan, children }: Props) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setShow(false), durationMs);
    return () => window.clearTimeout(t);
  }, [durationMs]);

  if (!show) return <>{children}</>;

  return (
    <div className="min-h-screen grid place-items-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-50 via-background to-emerald-50">
      <div className="text-center px-6">
        <div className="mx-auto h-20 w-20 rounded-2xl bg-white/70 backdrop-blur border shadow-sm grid place-items-center overflow-hidden">
          <img src={logoSrc} alt="AfroConnect" className="h-14 w-14 object-contain" />
        </div>
        <div className="mt-4 text-3xl font-extrabold tracking-tight">
          <span className="text-[#F66B0E]">Afro</span>
          <span className="text-[#008F5D]">Connect</span>
        </div>
        {slogan ? <div className="mt-1 text-sm text-muted-foreground">{slogan}</div> : null}
      </div>
    </div>
  );
}
