// App Store review prompt (guide §3.12 and §4.1 "Review prompt").
// iOS reports the launch count; the web picks ONE channel per session off the
// first major action (a logged dose): the in-app modal at 5+ launches, else
// the native SKStoreReview prompt.
import { sendIOSEvent } from "@/lib/iosBridge";

export const APP_REVIEW_LAUNCH_THRESHOLD = 5;
const SESSION_FLAG = "reviewPromptFiredThisSession";

let launchCount = 0;

export const getLaunchCount = () => launchCount;

if (typeof window !== "undefined") {
  window.setAppLaunchCount = (n) => {
    if (typeof n !== "number" || !Number.isFinite(n) || n < 0) return;
    launchCount = Math.floor(n);
  };
}

// Call from the success handler of the first major user action.
export const onMajorActionCompleted = () => {
  try {
    if (sessionStorage.getItem(SESSION_FLAG)) return;
    sessionStorage.setItem(SESSION_FLAG, "1");
  } catch { return; }
  // Let the success animation land first.
  window.setTimeout(() => {
    if (launchCount >= APP_REVIEW_LAUNCH_THRESHOLD) {
      window.dispatchEvent(new CustomEvent("levli:open-review-modal"));
    } else {
      sendIOSEvent("wanillajs.event.review.requestPrompt", { reason: "firstMajorActionOfSession", promptType: "appReview" });
    }
  }, 1500);
};