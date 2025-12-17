// src/App.tsx
import { useEffect, useMemo, useState } from "react";

import HomeFeed from "./components/HomeFeed";
import BusinessDirectory from "./components/BusinessDirectory";
import Marketplace from "./components/Marketplace";
import StudentsHub from "./components/StudentsHub";
import MessagesSection from "./components/MessagesSection";
import GroupsSection from "./components/GroupsSection";
import LocationOnboarding from "./components/LocationOnboarding";

import AppHeader from "./components/AppHeader";
import AppMenuSheet, { TabRoute } from "./components/AppMenuSheet";
import LocationConfirmModal from "./components/LocationConfirmModal";
import NotificationsSheet from "./components/NotificationsSheet";
import ProfilePage from "./components/ProfilePage";
import SettingsPage from "./components/SettingsPage";
import EventsPage from "./components/EventsPage";

import Logo from "./assets/afroconnect-logo.png";

import { UserLocationProvider, useUserLocation } from "@/contexts/UserLocationContext";
import { useInternetIdentity } from "./hooks/useInternetIdentity";

import { COMMUNITIES, DEFAULT_COMMUNITY_ID } from "@/lib/communities";

type TabId = TabRoute;

const LS_COMMUNITY_KEY = "afroconnect.communityId";
const LS_AREA_KEY_PREFIX = "afroconnect.areaId."; // + communityId

const LS_PROFILE = "afroconnect.profile";
const LS_AVATAR_URL = "afroconnect.avatarUrl";

// Custom event so ProfilePage can tell AppHeader to refresh immediately
export const PROFILE_UPDATED_EVENT = "afroconnect.profileUpdated";

type StoredProfile = {
  displayName?: string;
  bio?: string;
  interests?: string;
  avatarUrl?: string;
};

function getSavedCommunityId() {
  return localStorage.getItem(LS_COMMUNITY_KEY) || DEFAULT_COMMUNITY_ID;
}
function getSavedAreaId(communityId: string) {
  return localStorage.getItem(`${LS_AREA_KEY_PREFIX}${communityId}`) || "all";
}
function getCommunityById(id: string) {
  return COMMUNITIES.find((c) => c.id === id) || COMMUNITIES[0];
}

function readProfile(): StoredProfile {
  try {
    const raw = localStorage.getItem(LS_PROFILE);
    return raw ? (JSON.parse(raw) as StoredProfile) : {};
  } catch {
    return {};
  }
}

function AppInner() {
  const { identity, login, loginStatus, clear } = useInternetIdentity();
  const isLoggedIn = !!identity && loginStatus === "success";
  const isLoggingIn = loginStatus === "logging-in";

  const { location, setLocation } = useUserLocation();

  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [activeConversationTitle, setActiveConversationTitle] = useState<string | null>(null);

  // Header/menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  // Location state used by header/modal
  const [communityId, setCommunityId] = useState(() => getSavedCommunityId());
  const [areaId, setAreaId] = useState(() => getSavedAreaId(getSavedCommunityId()));

  useEffect(() => {
    localStorage.setItem(LS_COMMUNITY_KEY, communityId);
  }, [communityId]);

  useEffect(() => {
    localStorage.setItem(`${LS_AREA_KEY_PREFIX}${communityId}`, areaId);
  }, [communityId, areaId]);

  const community = useMemo(() => getCommunityById(communityId), [communityId]);

  const areaName = useMemo(() => {
    if (areaId === "all") return null;
    return community.areas?.find((a) => a.id === areaId)?.name ?? null;
  }, [community, areaId]);

  const locationLabel = useMemo(() => {
    return areaName ? `${community.name} · ${areaName}` : community.name;
  }, [community.name, areaName]);

  // =========
  // PROFILE (fixes Guest sticking)
  // =========
  const [profileVersion, setProfileVersion] = useState(0);

  useEffect(() => {
    const onProfileUpdated = () => setProfileVersion((v) => v + 1);

    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_PROFILE || e.key === LS_AVATAR_URL) {
        setProfileVersion((v) => v + 1);
      }
    };

    window.addEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated as EventListener);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const profile = useMemo(() => readProfile(), [profileVersion]);

  const displayName = useMemo(() => {
    const name = (profile.displayName || "").trim();
    if (name) return name;
    return isLoggedIn ? "User" : "Guest";
  }, [profile.displayName, isLoggedIn]);

  const avatarUrl = useMemo(() => {
    return profile.avatarUrl || localStorage.getItem(LS_AVATAR_URL) || undefined;
  }, [profile.avatarUrl, profileVersion]);

  // Gate: first-login location confirmation
  if (isLoggedIn && !location) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70 sticky top-0 z-50">
          <div className="container mx-auto flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-3">
              <img src={Logo} alt="AfroConnect" className="h-9 w-9 rounded-md object-contain" />
              <div className="leading-tight select-none">
                <span className="font-extrabold text-xl leading-none">
                  <span className="text-[#F66B0E]">Afro</span>
                  <span className="text-[#008F5D]">Connect</span>
                </span>
                <div className="text-[11px] text-muted-foreground -mt-0.5">Connecting Africans Globally</div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <LocationOnboarding
            onConfirmed={(loc) => {
              setLocation(loc);
              setActiveTab("home");
            }}
          />
        </main>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <HomeFeed userLocation={location ?? undefined} />;

      case "marketplace":
        return (
          <Marketplace
            onStartChat={(businessName) => {
              setActiveConversationTitle(businessName);
              setActiveTab("messages");
            }}
          />
        );

      case "businesses":
        return <BusinessDirectory />;

      case "groups":
        return <GroupsSection />;

      case "students":
        return (
          <StudentsHub
            onStartChat={(threadTitle) => {
              setActiveConversationTitle(threadTitle);
              setActiveTab("messages");
            }}
          />
        );

      case "messages":
        return <MessagesSection initialConversationTitle={activeConversationTitle ?? undefined} />;

      case "events":
        return <EventsPage communityLabel={locationLabel} />;

      case "profile":
        return <ProfilePage communityLabel={locationLabel} />;

      case "settings":
        return (
          <SettingsPage
            communityLabel={locationLabel}
            isLoggedIn={isLoggedIn}
            displayName={displayName}
            onBack={() => setActiveTab("home")}
            onLogout={async () => {
              await clear();
              setActiveTab("home");
            }}
          />
        );

      default:
        return <HomeFeed userLocation={location ?? undefined} />;
    }
  };

  const confirmLocation = () => {
    setLocationModalOpen(false);
    setLocation({ communityId, areaId } as any);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader
        locationLabel={locationLabel}
        displayName={displayName}
        avatarUrl={avatarUrl}
        isLoggedIn={isLoggedIn}
        isLoggingIn={isLoggingIn}
        onOpenLocation={() => setLocationModalOpen(true)}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onGoMessages={() => setActiveTab("messages")}
        onLogin={() => login()}
        onOpenMenu={() => setMenuOpen(true)}
      />

      <LocationConfirmModal
        open={locationModalOpen}
        community={community}
        areaId={areaId}
        onChangeCommunity={(id) => {
          setCommunityId(id);
          setAreaId(getSavedAreaId(id));
        }}
        onChangeArea={setAreaId}
        onConfirm={confirmLocation}
      />

      <AppMenuSheet
        open={menuOpen}
        onOpenChange={setMenuOpen}
        displayName={displayName}
        avatarUrl={avatarUrl}
        communityName={locationLabel}
        onNavigate={(tab) => setActiveTab(tab)}
      />

      <NotificationsSheet open={notificationsOpen} onOpenChange={setNotificationsOpen} communityName={locationLabel} />

      <main className="flex-1">{renderContent()}</main>
    </div>
  );
}

export default function App() {
  return (
    <UserLocationProvider>
      <AppInner />
    </UserLocationProvider>
  );
}
