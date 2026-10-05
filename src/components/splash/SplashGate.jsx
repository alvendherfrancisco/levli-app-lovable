import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useAppState } from "@/lib/AppState";
import SplashScreen from "@/components/splash/SplashScreen";

/**
 * Holds the launch splash over the app while it starts up.
 *
 * The app itself renders straight away underneath, so nothing waits on the
 * splash; it only decides when the splash may cross-fade away. "Ready" means
 * the session has resolved, and — for a signed-in person — the profile has
 * loaded too, since that decides whether the app opens on the home screen or
 * onboarding.
 */
export default function SplashGate({ children }) {
  const { isLoadingAuth, isLoadingPublicSettings, isAuthenticated } = useAuth();
  const { onboardingCompleted } = useAppState();
  const [done, setDone] = useState(false);

  const authSettled = !isLoadingAuth && !isLoadingPublicSettings;
  const ready = authSettled && (!isAuthenticated || onboardingCompleted !== null);

  return (
    <>
      {children}
      {!done && <SplashScreen ready={ready} onFinish={() => setDone(true)} />}
    </>
  );
}