// src/components/AppLayout.tsx
import { ReactNode } from "react";
import AppHeader from "@/components/AppHeader";

export default function AppLayout({
  children,
  onOpenAuth,
}: {
  children: ReactNode;
  onOpenAuth?: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/5">
      <AppHeader onOpenAuth={onOpenAuth} />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
