import React from "react";
import { Loader2, Mail } from "lucide-react";
import SocialAuthButtons from "@/components/onboarding/SocialAuthButtons";
import PasswordField from "@/components/PasswordField";
import { FIELD, LABEL } from "@/lib/authFormStyles";

/**
 * The account card, and the button that creates the account.
 *
 * The same card the sign-in screen draws, with the extra field creating an
 * account needs: the two passwords, each behind its own eye. The card holds the
 * three labelled fields, the divider and the two provider marks; Create account
 * sits below it, outside the card, so the screen's main action reads as the
 * screen's own rather than as part of the form — it is still the form's submit
 * button, so the return key and a tap do the same thing. What sits beneath it
 * (the terms line and the way to log in instead) is the page's.
 *
 * Whether the two passwords match is the only thing there is to check here, and
 * that is said above the fields on submit. The button itself simply waits,
 * faded, until all three fields have something in them.
 */
export default function RegisterForm({
  email, setEmail, password, setPassword, confirmPassword, setConfirmPassword,
  onSubmit, loading, error, onProvider,
}) {
  const ready = !!email.trim() && !!password && !!confirmPassword;

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        {error && (
          <p className="mb-4 w-full rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-600">{error}</p>
        )}

        <div className="w-full">
          <label htmlFor="register-email" className={LABEL}>Email</label>
          <div className="relative w-full">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
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
              className={FIELD}
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
            enterKeyHint="next"
          />
        </div>

        <div className="mt-4 w-full">
          <PasswordField
            id="register-confirm"
            label="Confirm Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            enterKeyHint="go"
          />
        </div>

        <SocialAuthButtons onProvider={onProvider} disabled={loading} />
      </div>

      {/* Create account — the same pill as the sign-in screen's Log in and the
          shell's Next: same indigo, same height, same soft shadow, faded rather
          than grey until the three fields are filled. */}
      <div className="mt-5 w-full">
        <button
          type="submit"
          disabled={loading || !ready}
          className={`flex w-full items-center justify-center rounded-full py-4 text-base font-semibold transition-all duration-300 active:scale-95 sm:text-lg ${
            loading || !ready
              ? "cursor-not-allowed bg-indigo-300 text-white shadow-none"
              : "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700"
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