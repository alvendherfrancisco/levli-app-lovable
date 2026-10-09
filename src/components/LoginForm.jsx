import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import SocialAuthButtons from "@/components/onboarding/SocialAuthButtons";
import {
  CARD, FIELD, FIELD_MARK, LABEL, LABEL_TEXT, LINK, NOTICE,
  PRIMARY_BTN, PRIMARY_BTN_OFF, PRIMARY_BTN_ON,
} from "@/lib/uiStyles";

/**
 * The sign-in card, and the button that signs in.
 *
 * The same card the account step draws, read the other way round: the two
 * labelled fields, the divider and the two provider marks belong to the card,
 * while Log in sits below it — the screen's own action rather than part of the
 * form — and it is still the form's submit button, so the return key and a tap
 * do the same thing.
 *
 * Nothing is validated here. Whether an address and a password belong to an
 * account is the server's to say, and it says it above the fields; the button
 * simply waits, faded, until both fields have something in them.
 */
export default function LoginForm({
  email, setEmail, password, setPassword,
  onSubmit, loading, error, onProvider,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const ready = !!email.trim() && !!password;

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className={`w-full ${CARD}`}>
        {error && (
          <p className={`${NOTICE} mb-4`}>{error}</p>
        )}

        <div className="w-full">
          <label htmlFor="login-email" className={LABEL}>Email</label>
          <div className="relative w-full">
            <Mail className={FIELD_MARK} aria-hidden="true" />
            <input
              id="login-email"
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
          {/* The label and the way out of a forgotten password share one row, so
              the pair reads as part of the same field. */}
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="login-password" className={LABEL_TEXT}>Password</label>
            <Link to="/forgot-password" className={LINK}>
              Forgot password?
            </Link>
          </div>
          <div className="relative w-full">
            <Lock className={FIELD_MARK} aria-hidden="true" />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              enterKeyHint="go"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${FIELD} pr-14`}
            />
            {/* Its own 44pt target, so the eye is as easy to hit as the field. */}
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <SocialAuthButtons onProvider={onProvider} disabled={loading} />
      </div>

      {/* Log in — the same pill as the shell's Next and the account step's
          Create account: same indigo, same height, same soft shadow, and faded
          rather than grey while the two fields are still empty. */}
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
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...
            </>
          ) : "Log in"}
        </button>
      </div>
    </form>
  );
}