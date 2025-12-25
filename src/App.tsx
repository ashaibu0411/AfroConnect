// src/App.tsx
import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
import AuthSheet from "@/components/AuthSheet";
import WelcomeGate from "@/components/WelcomeGate";
import AppLayout from "@/components/AppLayout";
import OnboardingInterests from "@/pages/OnboardingInterests";

import HomePage from "@/pages/HomePage";
import MarketplacePage from "@/pages/MarketplacePage";
import BusinessDirectoryPage from "@/pages/BusinessDirectoryPage";
import GroupsPage from "@/pages/GroupsPage";
import StudentsPage from "@/pages/StudentsPage";
import MessagesPage from "@/pages/MessagesPage";
import EventsPage from "@/pages/EventsPage";
import MyProfilePage from "@/pages/ProfilePage";
import MySettingsPage from "@/pages/SettingsPage";
import HelpCenterPage from "@/pages/HelpCenterPage";

// These pages exist in your project per your note:
import SearchPage from "@/pages/SearchPage";
import NotificationsPage from "@/pages/NotificationsPage";
import AddBusinessPage from "@/pages/AddBusinessPage";

export default function App() {
  const { status, user } = useAuth();

  const isLoggedIn = !!user && status === "authenticated";

  // ✅ auth is "ready" once it's not loading/idle
  const authReady = status !== "loading" && status !== "idle";

  const navigate = useNavigate();
  const location = useLocation();

  const [loginOpen, setLoginOpen] = useState(false);

  // Close auth sheet after login
  useEffect(() => {
    if (isLoggedIn) setLoginOpen(false);
  }, [isLoggedIn]);

  // ✅ Routing rules — guarded so it doesn't "snap back"
  useEffect(() => {
    if (!authReady) return;

    const onWelcome = location.pathname === "/welcome";

    if (!isLoggedIn && !onWelcome) {
      navigate("/welcome", { replace: true });
      return;
    }

    if (isLoggedIn && onWelcome) {
      navigate("/", { replace: true });
    }
  }, [authReady, isLoggedIn, location.pathname, navigate]);

  // Go to onboarding when requested
  useEffect(() => {
    const go = () => navigate("/onboarding");
    window.addEventListener("afroconnect.onboardingNeeded", go);
    return () => window.removeEventListener("afroconnect.onboardingNeeded", go);
  }, [navigate]);

  return (
    <>
      <AuthSheet open={loginOpen} onOpenChange={setLoginOpen} />

      <Routes>
        {/* WELCOME */}
        <Route
          path="/welcome"
          element={
            <div className="mx-auto max-w-6xl px-4 py-6">
              <WelcomeGate onLogin={() => setLoginOpen(true)} />
            </div>
          }
        />

        {/* APP */}
        <Route
          path="/"
          element={
            <AppLayout onOpenAuth={() => setLoginOpen(true)}>
              <HomePage onRequireLogin={() => setLoginOpen(true)} />
            </AppLayout>
          }
        />

        <Route
          path="/onboarding"
          element={<OnboardingInterests onDone={() => navigate("/", { replace: true })} />}
        />

        <Route
          path="/marketplace"
          element={
            <AppLayout onOpenAuth={() => setLoginOpen(true)}>
              <MarketplacePage />
            </AppLayout>
          }
        />

        <Route
          path="/business"
          element={
            <AppLayout onOpenAuth={() => setLoginOpen(true)}>
              <BusinessDirectoryPage />
            </AppLayout>
          }
        />

        <Route
          path="/add-business"
          element={
            <AppLayout onOpenAuth={() => setLoginOpen(true)}>
              <AddBusinessPage />
            </AppLayout>
          }
        />

        <Route
          path="/groups"
          element={
            <AppLayout onOpenAuth={() => setLoginOpen(true)}>
              <GroupsPage />
            </AppLayout>
          }
        />

        <Route
          path="/students"
          element={
            <AppLayout onOpenAuth={() => setLoginOpen(true)}>
              <StudentsPage />
            </AppLayout>
          }
        />

        <Route
          path="/messages"
          element={
            <AppLayout onOpenAuth={() => setLoginOpen(true)}>
              <MessagesPage />
            </AppLayout>
          }
        />

        <Route
          path="/events"
          element={
            <AppLayout onOpenAuth={() => setLoginOpen(true)}>
              <EventsPage onRequireLogin={() => setLoginOpen(true)} />
            </AppLayout>
          }
        />

        <Route
          path="/profile"
          element={
            <AppLayout onOpenAuth={() => setLoginOpen(true)}>
              <MyProfilePage />
            </AppLayout>
          }
        />

        <Route
          path="/settings"
          element={
            <AppLayout onOpenAuth={() => setLoginOpen(true)}>
              <MySettingsPage />
            </AppLayout>
          }
        />

        <Route
          path="/help"
          element={
            <AppLayout onOpenAuth={() => setLoginOpen(true)}>
              <HelpCenterPage />
            </AppLayout>
          }
        />

        <Route
          path="/search"
          element={
            <AppLayout onOpenAuth={() => setLoginOpen(true)}>
              <SearchPage />
            </AppLayout>
          }
        />

        <Route
          path="/notifications"
          element={
            <AppLayout onOpenAuth={() => setLoginOpen(true)}>
              <NotificationsPage />
            </AppLayout>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
