/**
 * The launch screen's decisions, in one place.
 *
 * The splash belongs to the launch of the app, not to the session changes that
 * happen after it. Login and logout both leave the document (a hard reload
 * through the platform's auth endpoints), and each fresh load used to start the
 * splash again — which is what made the login screen flash ahead of it on the
 * way out, and the splash play a second time on the way back in.
 *
 * So the launch is remembered for the rest of the browser session: the first
 * document of a session shows the splash, and every reload after it — login,
 * logout, sign-up, an OAuth return — opens straight on the screen the session
 * calls for. A new tab or a relaunch starts a new session and plays it again.
 */

const SHOWN_KEY = "levli_splash_shown";

/** Has this browser session already shown the launch splash? */
export function splashAlreadyPlayed() {
  try {
    return window.sessionStorage.getItem(SHOWN_KEY) === "1";
  } catch {
    // Nothing to read (private mode, storage disabled): play it, just don't
    // remember it for the next document.
    return false;
  }
}

/** Remember that this session has shown the splash. */
export function rememberSplashPlayed() {
  try {
    window.sessionStorage.setItem(SHOWN_KEY, "1");
  } catch {
    /* nothing to remember */
  }
}

/**
 * Is the splash the only thing on screen?
 *
 * It is until the launch has finished, and it comes back while the session is
 * being torn down on the way out — the same sequence plays over the sign-out,
 * and the app leaves for the login screen when it has finished. Covering that
 * moment is what keeps the signed-out app from painting first.
 */
export function showsSplash({ launchDone, isLoggingOut }) {
  return !launchDone || !!isLoggingOut;
}

/**
 * May the splash leave?
 *
 * Only once the session has resolved — and, for a signed-in person, once the
 * profile has loaded too, since that decides whether the app opens on Home or
 * on onboarding. A sign-out does not go through this at all: there the splash
 * plays its whole sequence and the app leaves when it has finished.
 */
export function isLaunchReady({
  isLoadingAuth,
  isLoadingPublicSettings,
  isAuthenticated,
  onboardingCompleted,
}) {
  if (isLoadingAuth || isLoadingPublicSettings) return false;
  return !isAuthenticated || onboardingCompleted !== null;
}