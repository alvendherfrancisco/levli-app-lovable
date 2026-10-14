import React from "react";
import SocialAuthButtons from "@/components/onboarding/SocialAuthButtons";
import { AUTH_CARD, AUTH_NOTICE } from "@/lib/authStyles";
import { base44 } from "@/api/base44Client";
import { markAuthProvider } from "@/lib/authProviderMark";

/**
 * Inside the iOS app, accounts are Apple or Google only: this card replaces the
 * email/password fields with the two provider buttons, which sign in through
 * Base44's own login flow. The Wanilla handoff follows once the session exists.
 */
const signIn = (provider) => {
  markAuthProvider(provider);
  base44.auth.loginWithProvider(provider, "/");
};

export default function ProviderOnlyCard({ error, loading }) {
  return (
    <div className={`w-full ${AUTH_CARD}`}>
      {error && <p className={`${AUTH_NOTICE} mb-4`}>{error}</p>}
      <SocialAuthButtons onProvider={signIn} disabled={loading} hideDivider />
    </div>
  );
}