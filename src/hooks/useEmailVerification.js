import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { VERIFICATION_CODE_LENGTH } from "@/lib/accountValidation";

/**
 * The code half of the email path: the 6-digit code emailed to an address, the
 * check that turns it into a session, and asking for another one.
 *
 * It is held by the page that owns the onboarding shell rather than by the
 * screen that draws the boxes, because that screen borrows the shell's own
 * pinned CTA — the shell has to know when the six digits are complete and what
 * to do when it is tapped. Nothing here is shared with signing in: an existing
 * account is checked by the server.
 */
export function useEmailVerification({ email, persistState }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  /** Takes the last result off the screen — used when leaving to the form. */
  const clear = () => {
    setError("");
    setNotice("");
  };

  /** Checks the code. A verified address is a session, so the page reloads. */
  const verify = async () => {
    clear();
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode: code });
      if (result?.access_token) base44.auth.setToken(result.access_token);
      // Verified: everything answered travels on and is saved to the new account
      // in one write when onboarding finishes. Replace, not push, so the account
      // step is not left in the history behind onboarding.
      persistState?.({ email, step: 4, verified: true, awaitingVerification: false });
      window.location.replace("/onboarding");
    } catch (err) {
      setError("That code didn't match. Check the most recent email, or ask for a new one.");
      setLoading(false);
    }
  };

  const resend = async () => {
    clear();
    try {
      await base44.auth.resendOtp(email);
      setNotice("Sent. Check your inbox for a new code.");
    } catch (err) {
      setError("We couldn't send another code just now. Please try again in a moment.");
    }
  };

  return {
    code,
    setCode,
    error,
    notice,
    loading,
    // What the pinned CTA waits for: all six digits, and nothing in flight.
    ready: code.length === VERIFICATION_CODE_LENGTH && !loading,
    verify,
    resend,
    clear,
  };
}