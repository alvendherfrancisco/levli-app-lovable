import React from "react";
import SocialAuthButtons from "@/components/onboarding/SocialAuthButtons";
import { AUTH_CARD, AUTH_NOTICE } from "@/lib/authStyles";

/**
 * Inside the iOS app, accounts are Apple or Google only: this card replaces the
 * email/password fields with just the two provider buttons.
 */
export default function ProviderOnlyCard({ error, onProvider, loading }) {
  return (
    <div className={`w-full ${AUTH_CARD}`}>
      {error && <p className={`${AUTH_NOTICE} mb-4`}>{error}</p>}
      <SocialAuthButtons onProvider={onProvider} disabled={loading} hideDivider />
    </div>
  );
}