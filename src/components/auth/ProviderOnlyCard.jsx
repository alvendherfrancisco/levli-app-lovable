import React from "react";
import SocialAuthButtons from "@/components/onboarding/SocialAuthButtons";
import { AUTH_CARD, AUTH_NOTICE } from "@/lib/authStyles";
import { requestNativeSignIn } from "@/lib/iosNativeSignIn";

/**
 * Inside the iOS app, accounts are Apple or Google only: this card replaces the
 * email/password fields with the two provider buttons, which hand sign-in to the
 * native wrapper instead of the web redirect flow.
 */
export default function ProviderOnlyCard({ error, loading, mode = "signin" }) {
  return (
    <div className={`w-full ${AUTH_CARD}`}>
      {error && <p className={`${AUTH_NOTICE} mb-4`}>{error}</p>}
      <SocialAuthButtons onProvider={(p) => requestNativeSignIn(p, mode)} disabled={loading} hideDivider />
    </div>
  );
}