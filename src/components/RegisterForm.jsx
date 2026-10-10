import React from "react";
import { Loader2, Mail } from "lucide-react";
import SocialAuthButtons from "@/components/onboarding/SocialAuthButtons";
import PasswordField from "@/components/PasswordField";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";
import { formBlocker } from "@/lib/accountValidation";
import {
  AUTH_CARD, AUTH_FIELD, AUTH_FIELD_MARK, AUTH_LABEL, AUTH_NOTICE,
} from "@/lib/authStyles";
// The pill is the app's own indigo in both modes, so it stays the shared one.
import { PRIMARY_BTN, PRIMARY_BTN_OFF, PRIMARY_BTN_ON } from "@/lib/uiStyles";

/**
 * The account card, and the button that creates the account.
 *
 * The same card the sign-in screen draws, with the extra field creating an
 * account needs: the email and the password, each behind its own eye. The card
 * holds the two labelled fields, the divider and the two provider marks; Create
 * account sits below it, outside the card, so the screen's main action reads as
 * the screen's own rather than as part of the form — it is still the form's
 * submit button, so the return key and a tap do the same thing. What sits beneath
 * it (the terms line and the way to log in instead) is the page's.
 *
 * The password carries the same live strength hint the onboarding account screen
 * shows, so the two screens read identically. That hint is guidance and nothing
 * more: the button simply waits, faded, until the address is a real one and the
 * password clears the minimum length.
 */
export default function RegisterForm({
  email, setEmail, password, setPassword,
  onSubmit, loading, error, onProvider,
}) {
  const ready = !formBlocker({ email, password });

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className={`w-full ${AUTH_CARD}`}>
        {error && (
          <p className={`${AUTH_NOTICE} mb-4`}>{error}</p>
        )}

        <div className="w-full">
          <label htmlFor="register-email" className={AUTH_LABEL}>Email</label>
          <div className="relative w-full">
            <Mail className={AUTH_FIELD_MARK} aria-hidden="true" />
            <input
              id="register-email"
              type="email"
              inputMode="email"
              placeholder="you@example.com"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="next"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={AUTH_FIELD}
            />
          </div>
        </div>

        <div className="mt-4 w-full">
          <PasswordField
            id="register-password"
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            enterKeyHint="go"
          />
          {/* The same live hint, and the same gap under the field, as the
              onboarding account screen. */}
          <PasswordStrengthMeter password={password} />
        </div>

        <SocialAuthButtons onProvider={onProvider} disabled={loading} />
      </div>

      {/* Create account — the same pill as the sign-in screen's Log in and the
          shell's Next: same indigo, same height, same soft shadow, faded rather
          than grey until the two fields are filled. */}
      <div className="mt-6 w-full">
        <button
          type="submit"
          disabled={loading || !ready}
          className={`flex items-center justify-center ${PRIMARY_BTN} ${
            loading || !ready ? PRIMARY_BTN_OFF : PRIMARY_BTN_ON
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...
            </>
          ) : "Create account"}
        </button>
      </div>
    </form>
  );
}