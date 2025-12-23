// src/pages/EventsPage.tsx
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getCommunityLabel } from "@/lib/location";
import EventsBoard from "@/components/EventsBoard";

type Props = {
  onRequireLogin?: () => void;
};

export default function EventsPage({ onRequireLogin }: Props) {
  const { user, status } = useAuth();
  const isLoggedIn = !!user && status === "authenticated";

  const [communityLabel, setCommunityLabel] = useState(() => getCommunityLabel());

  useEffect(() => {
    const handler = () => setCommunityLabel(getCommunityLabel());
    window.addEventListener("afroconnect.communityChanged", handler);
    return () => window.removeEventListener("afroconnect.communityChanged", handler);
  }, []);

  return (
    <EventsBoard
      communityLabel={communityLabel}
      isLoggedIn={isLoggedIn}
      onLogin={() => onRequireLogin?.()}
    />
  );
}
