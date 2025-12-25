// src/components/AppLayout.tsx
import { ReactNode } from "react";
import AppHeader from "@/components/AppHeader";

export default function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/5">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
