import {
  createContext,
  useContext,
  useState,
  useMemo,
  type ReactNode,
} from "react";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

type LoginStatus = "idle" | "logging-in" | "success" | "loginError";

interface DevPrincipal {
  toString(): string;
}

interface DevIdentity {
  getPrincipal(): DevPrincipal;
}

interface InternetIdentityContextValue {
  identity: DevIdentity | null;
  loginStatus: LoginStatus;
  login: () => Promise<void>;
  clear: () => Promise<void>;
}

// ICP Internet Identity URL (you can change this later if you use a different provider URL)
const ICP_IDENTITY_URL = "https://identity.ic0.app/#authorize";

const InternetIdentityContext = createContext<
  InternetIdentityContextValue | undefined
>(undefined);

export function InternetIdentityProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [identity, setIdentity] = useState<DevIdentity | null>(null);
  const [loginStatus, setLoginStatus] = useState<LoginStatus>("idle");

  const value = useMemo<InternetIdentityContextValue>(
    () => ({
      identity,
      loginStatus,

      // Unified login for web + mobile
      login: async () => {
        try {
          console.log("[Auth] login() called");
          setLoginStatus("logging-in");

          const isNative = Capacitor.isNativePlatform();

          if (isNative) {
            // MOBILE (Android/iOS via Capacitor)
            console.log("[Auth] Detected native platform – opening ICP in system browser");
            try {
              await Browser.open({
                url: ICP_IDENTITY_URL,
              });
            } catch (browserError) {
              console.error("[Auth] Error opening ICP in Browser:", browserError);
            }
          } else {
            // WEB (normal browser)
            console.log("[Auth] Web platform – optionally open ICP in new tab");
            // Optional: open ICP in a new tab for the web version too
            // window.open(ICP_IDENTITY_URL, "_blank", "noopener,noreferrer");
          }

          // DEV: simulate a successful identity so the app can function
          const devIdentity: DevIdentity = {
            getPrincipal() {
              return {
                toString: () => "dev-principal-afroconnect",
              };
            },
          };

          // Simulate a small delay (network/auth)
          await new Promise((res) => setTimeout(res, 800));

          setIdentity(devIdentity);
          setLoginStatus("success");
          console.log(
            "[Auth] login success, principal:",
            devIdentity.getPrincipal().toString()
          );
        } catch (e) {
          console.error("[Auth] login error:", e);
          setLoginStatus("loginError");
        }
      },

      clear: async () => {
        console.log("[Auth] clear() called");
        setIdentity(null);
        setLoginStatus("idle");
      },
    }),
    [identity, loginStatus]
  );

  return (
    <InternetIdentityContext.Provider value={value}>
      {children}
    </InternetIdentityContext.Provider>
  );
}

export function useInternetIdentity(): InternetIdentityContextValue {
  const ctx = useContext(InternetIdentityContext);
  if (!ctx) {
    throw new Error(
      "useInternetIdentity must be used within an InternetIdentityProvider"
    );
  }
  return ctx;
}
