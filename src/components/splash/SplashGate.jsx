import React, { useCallback, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useAppState } from "@/lib/AppState";
import SplashScreen from "@/components/splash/SplashScreen";
import {
  splashAlreadyPlayed,
  rememberSplashPlayed,
  showsSplash,
  isLaunchReady,
} from "@/lib/launchGate";

/**
 * The launch screen — the one and only place the splash is mounted.
 *
 * There is a single launch state for the whole app. While it is launching the
 * splash is the only thing on screen: the routes are not mounted underneath it,
 * so no screen can appear behind it or ahead of it — not Login, not Home. Once
 * the launch is over the routes mount, and by then the session check has
 * resolved, so they open on the right screen for the session in hand.
 *
 * The splash plays once per launch and cannot be restarted: a finished launch
 * stays finished (see src/lib/launchGate.js), so an auth-state event, a token
 * refresh, a remount or the reloads login and logout cause never start it
 * again.
 */
export default function SplashGate({ children }) {
  const { isLoadingAuth, isLoadingPublicSettings, isAuthenticated, isLoggingOut } = useAuth();
  const { onboardingCompleted } = useAppState();
  const [launchDone, setLaunchDone] = useState(splashAlreadyPlayed);

  const finish = useCallback(() => {
    rememberSplashPlayed();
    setLaunchDone(true);
  }, []);

  if (showsSplash({ launchDone, isLoggingOut })) {
    return (
      <SplashScreen
        ready={isLaunchReady({
          isLoadingAuth,
          isLoadingPublicSettings,
          isAuthenticated,
          onboardingCompleted,
          isLoggingOut,
        })}
        onFinish={finish}
      />
    );
  }

  return children;
}