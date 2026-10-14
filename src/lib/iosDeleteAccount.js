// iOS → Web: window.deleteBase44Account()
// Called by the wrapper after the user confirms its native delete alert.
// Deletes the signed-in account and all its records in Base44.
// Resolves to a JSON string: { ok: true } or { ok: false, errorCode, reason }.
import { base44 } from "@/api/base44Client";

if (typeof window !== "undefined") {
  window.deleteBase44Account = async () => {
    try {
      const user = await base44.auth.me();
      // The native alert is the confirmation, so the account's own email is passed.
      const { data } = await base44.functions.invoke("delete-account", { confirmEmail: user.email });
      return JSON.stringify(data?.ok ? { ok: true } : { ok: false, errorCode: "delete_failed", reason: data?.error || "Delete failed" });
    } catch (e) {
      const status = e?.response?.status;
      return JSON.stringify({
        ok: false,
        errorCode: status === 401 ? "unauthorized" : "delete_failed",
        reason: e?.response?.data?.error || e?.message || "Delete failed",
      });
    }
  };
}