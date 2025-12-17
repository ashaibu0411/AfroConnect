// src/contexts/UserLocationContext.tsx
import React, { createContext, useContext, useMemo, useState } from "react";
import { loadUserLocation, UserLocation } from "@/lib/userLocation";

type Ctx = {
  location: UserLocation | null;
  setLocation: (loc: UserLocation | null) => void;
};

const UserLocationContext = createContext<Ctx | null>(null);

export function UserLocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<UserLocation | null>(() => loadUserLocation());

  const value = useMemo(() => ({ location, setLocation }), [location]);
  return <UserLocationContext.Provider value={value}>{children}</UserLocationContext.Provider>;
}

export function useUserLocation() {
  const ctx = useContext(UserLocationContext);
  if (!ctx) throw new Error("useUserLocation must be used within UserLocationProvider");
  return ctx;
}
