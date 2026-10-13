import { sendIOSEvent } from "@/lib/iosBridge";

// Native sign-in (guide §8.2.2): the wrapper runs Apple / Google natively and
// injects the session via window.setBase44Session. The timestamp lets
// forceLogoutFromIOS ignore a logout during the 2-minute sign-in window.
const EVENTS = {
  apple: ["wanillajs.event.auth.appleSignInRequested", "appleSignInRequestedAt"],
  google: ["wanillajs.event.auth.googleSignInRequested", "googleSignInRequestedAt"],
};
const WINDOW_MS = 2 * 60 * 1000;

export const requestNativeSignIn = (provider, mode) => {
  const [event, key] = EVENTS[provider];
  sessionStorage.setItem(key, String(Date.now()));
  sendIOSEvent(event, { mode });
};

export const nativeSignInInProgress = () => {
  const last = Math.max(
    ...Object.values(EVENTS).map(([, key]) => parseInt(sessionStorage.getItem(key) ?? "", 10) || 0)
  );
  return last > 0 && Date.now() - last < WINDOW_MS;
};