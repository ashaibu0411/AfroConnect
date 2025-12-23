// src/components/SplashGate.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SplashScreen from "@/components/SplashScreen";
import { useAuth } from "@/hooks/useAuth";

type Props = {
  logoSrc?: string;
  slogan?: string;
  durationMs?: number;
  children: React.ReactNode;
};

export default function SplashGate({
  logoSrc,
  slogan = "Connecting Africans Globally, Building Communities",
  durationMs = 2000,
  children,
}: Props) {
  const navigate = useNavigate();
  const { user, status } = useAuth();
  const isLoggedIn = !!user && status === "authenticated";

  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setShowSplash(false);

      // Always route based on auth
      if (!isLoggedIn) navigate("/welcome", { replace: true });
      else navigate("/", { replace: true });
    }, durationMs);

    return () => clearTimeout(t);
  }, [navigate, durationMs, isLoggedIn]);

  if (showSplash) {
    return (
      <SplashScreen
        durationMs={durationMs}
        onDone={() => {}}
        logoSrc={logoSrc}
        appName="AfroConnect"
        tagline={slogan}
      />
    );
  }

  return <>{children}</>;
}
