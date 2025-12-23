// src/App.tsx
import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
import AuthSheet from "@/components/AuthSheet";
import WelcomeGate from "@/components/WelcomeGate";
import AppLayout from "@/components/AppLayout";
import SplashGate from "@/components/SplashGate";

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

export default function App() {
  const { status, user } = useAuth();
  const isLoggedIn = !!user && status === "authenticated";

  const navigate = useNavigate();
  const location = useLocation();

  const [loginOpen, setLoginOpen] = useState(false);

  // Close auth sheet after login
  useEffect(() => {
    if (isLoggedIn) setLoginOpen(false);
  }, [isLoggedIn]);

  // ✅ Hard rule:
  // - Logged out => always /welcome
  // - Logged in  => never stuck on /welcome
  useEffect(() => {
    const onWelcome = location.pathname === "/welcome";
    if (!isLoggedIn && !onWelcome) navigate("/welcome", { replace: true });
    if (isLoggedIn && onWelcome) navigate("/", { replace: true });
  }, [isLoggedIn, location.pathname, navigate]);

  return (
    <>
      <AuthSheet open={loginOpen} onOpenChange={setLoginOpen} />

      <SplashGate
        logoSrc="/logo.png" // change if needed
        slogan="Connecting Africans Globally, Building Communities"
        durationMs={2000}
      >
        <Routes>
          {/* ✅ WELCOME (logged out only) */}
          <Route
            path="/welcome"
            element={
              <div className="mx-auto max-w-6xl px-4 py-6">
                <WelcomeGate
                  previewPosts={[]}
                  onLogin={() => setLoginOpen(true)}
                  // No guests allowed now:
                  onContinueAsGuest={() => setLoginOpen(true)}
                />
              </div>
            }
          />

          {/* ✅ APP (logged in) */}
          <Route
            path="/"
            element={
              <AppLayout onOpenAuth={() => setLoginOpen(true)}>
                <HomePage onRequireLogin={() => setLoginOpen(true)} />
              </AppLayout>
            }
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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SplashGate>
    </>
  );
}
