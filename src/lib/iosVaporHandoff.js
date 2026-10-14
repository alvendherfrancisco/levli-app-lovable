// Wanilla (Vapor) sign-in handoff. Once Base44 has a signed-in session inside
// the iOS wrapper, the web app asks the issueVaporHandoff function for a
// one-time code and passes it to the wrapper, which exchanges it with Wanilla.
//
// Web → iOS:
//   wanillajs.event.auth.vaporHandoffReady  { handoff_code, expires_in, base44_user_id, reason }
//   wanillajs.event.auth.vaporHandoffFailed { errorCode, reason }
// iOS → Web:
//   window.requestVaporHandoff(reason?) — ask for a fresh code (expired JWT,
//   handoff_expired, handoff_already_used). Returns JSON { accepted }.
import { base44 } from "@/api/base44Client";
import { sendIOSEvent, isRunningInIOSWrapper } from "@/lib/iosBridge";
import { authStore } from "@/lib/authStore";

let inFlight = null;
let deliveredFor = null; // Base44 user id the last code was delivered for

const issue = (reason) => {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const { data } = await base44.functions.invoke("issueVaporHandoff", {});
      deliveredFor = data.base44_user_id;
      sendIOSEvent("wanillajs.event.auth.vaporHandoffReady", {
        handoff_code: data.handoff_code,
        expires_in: data.expires_in,
        base44_user_id: data.base44_user_id,
        reason,
      });
      return true;
    } catch (e) {
      const body = e?.response?.data || {};
      sendIOSEvent("wanillajs.event.auth.vaporHandoffFailed", {
        errorCode: body.errorCode || "internal_error",
        reason: body.reason || "Handoff failed",
      });
      return false;
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
};

// Automatic: once per signed-in account per app load.
const maybeIssue = async (reason) => {
  if (!isRunningInIOSWrapper()) return;
  let user = null;
  try { user = await base44.auth.me(); } catch { return; }
  if (user?.id && user.id !== deliveredFor) issue(reason);
};

if (typeof window !== "undefined") {
  window.requestVaporHandoff = (reason = "native_request") => {
    if (!isRunningInIOSWrapper()) return JSON.stringify({ accepted: false, reason: "notInWrapper" });
    issue(reason);
    return JSON.stringify({ accepted: true });
  };

  maybeIssue("app_launch");
  authStore.subscribe(({ user }) => {
    if (user?.id) maybeIssue("signed_in");
    else deliveredFor = null;
  });
}