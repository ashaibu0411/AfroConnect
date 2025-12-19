import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";

import { InternetIdentityProvider } from "./hooks/useInternetIdentity";
import { AuthProvider } from "./hooks/useAuth";
import SplashGate from "./components/SplashGate";
import Logo from "./assets/afroconnect-logo.png";
import { initEditor } from "./hooks/useEditor";

const queryClient = new QueryClient();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initEditor());
} else {
  initEditor();
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <InternetIdentityProvider>
        <SplashGate logoSrc={Logo} slogan="Connecting Africans Globally" durationMs={5000}>
          <App />
        </SplashGate>
      </InternetIdentityProvider>
    </AuthProvider>
  </QueryClientProvider>
);
