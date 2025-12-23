// src/main.tsx
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { InternetIdentityProvider } from "./hooks/useInternetIdentity";
import { initEditor } from "./hooks/useEditor";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";

import SplashGate from "./components/SplashGate";
import Logo from "./assets/afroconnect-logo.png";
import { AuthProvider } from "@/hooks/useAuth";

const queryClient = new QueryClient();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initEditor());
} else {
  initEditor();
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <InternetIdentityProvider>
        <AuthProvider>
          <SplashGate logoSrc={Logo} slogan="Connecting Africans Globally" durationMs={2000}>
            <App />
          </SplashGate>
        </AuthProvider>
      </InternetIdentityProvider>
    </QueryClientProvider>
  </BrowserRouter>
);
