import React, { useRef, useState } from "react";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import SocialAuthButtons from "@/components/onboarding/SocialAuthButtons";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";
import {
  emailError, passwordError, formBlocker,
} from "@/lib/accountValidation";
// The field, label, card, notice and button styles, shared with the sign-in
// card so the account screens can never drift apart.
import {
  CARD, ERROR_TEXT, FIELD, FIELD_EYE, FIELD_MARK, HELP_IN_CARD, LABEL, NOTICE,
  PRIMARY_BTN, PRIMARY_BTN_OFF, PRIMARY_BTN_ON,
} from "@/lib/uiStyles";
import { sound } from "@/lib/sounds";

/**
 * The account card, and the button that creates the account.
 *
 * Levli asks only for the two things an account cannot exist without. A name is
 * not one of them: it arrives from Google or Apple when the provider gives one,
 * and otherwise it is optional and added later in Profile — so nothing here
 * waits on it, and nothing is ever greeted by an empty name.
 *
 * Validation is inline and specific — each message sits beside the field it
 * belongs to, after that field has been touched, and the button says in words
 * what still needs filling rather than failing silently. The password is shown
 * behind an eye toggle instead of a second confirmation field, and carries a
 * live strength hint that never blocks anything.
 *
 * The card holds the two labelled fields, the divider and the two provider
 * marks — nothing else. Create account sits below the card, outside it, so the
 * screen's main action reads as the screen's own rather than as part of the
 * form; it is still the form's submit button, so the return key and a tap do
 * the same thing. What sits under the button (the legal line and the way to log
 * in instead) is the caller's.
 */
export default function AccountEmailForm({
  email, setEmail, password, setPassword,
  onSubmit, loading, error, onProvider,
}) {
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const blocker = formBlocker({ email, password });
  const emailMsg = touched.email ? emailError(email) : "";
  const passwordMsg = touched.password ? passwordError(password) : "";

  // The return key walks the form: email → password → create account.
  const focusNext = (e, next) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    next.current?.focus();
  };

  // The keyboard rises over the lower half of the screen, so the field being
  // typed into is brought into the middle of whatever is left visible.
  const revealField = (e) => {
    const field = e.currentTarget;
    window.setTimeout(() => field.scrollIntoView({ block: "center", behavior: "smooth" }), 300);
  };

  const submit = (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (formBlocker({ email, password })) return;
    sound.tap();
    onSubmit();
  };

  return (
    <form onSubmit={submit} className="w-full">
      <div className={`w-full ${CARD}`}>
        {error && (
          <p className={`${NOTICE} mb-4`}>{error}</p>
        )}

        <div className="w-full">
          <label htmlFor="signup-email" className={LABEL}>Email</label>
          <div className="relative w-full">
            <Mail className={FIELD_MARK} aria-hidden="true" />
            <input
              id="signup-email"
              ref={emailRef}
              type="email"
              inputMode="email"
              placeholder="you@example.com"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="next"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={revealField}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              onKeyDown={(e) => focusNext(e, passwordRef)}
              className={FIELD}
            />
          </div>
          {emailMsg && <p className={`${ERROR_TEXT} mt-2`}>{emailMsg}</p>}
        </div>

        <div className="mt-4 w-full">
          <label htmlFor="signup-password" className={LABEL}>Password</label>
          <div className="relative w-full">
            <Lock className={FIELD_MARK} aria-hidden="true" />
            <input
              id="signup-password"
              ref={passwordRef}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              enterKeyHint="go"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={revealField}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              className={`${FIELD} pr-14`}
            />
            {/* Its own 44pt target, so the eye is as easy to hit as the field. */}
            <button
              type="button"
              onClick={() => { sound.tap(); setShowPassword((s) => !s); }}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className={FIELD_EYE}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {passwordMsg
            ? <p className={`${ERROR_TEXT} mt-2`}>{passwordMsg}</p>
            : <PasswordStrengthMeter password={password} />}
        </div>

        <SocialAuthButtons onProvider={onProvider} disabled={loading} />
      </div>

      {/* Create account — the shell's own Next button in everything but the
          wording: same pill, same indigo, same height, same soft shadow. It sits
          outside the card, lined up with the card's own edges, with the reason
          it is not ready yet above it, which waits for the first touch so an
          untouched form is not scolded. */}
      <div className="mt-6 w-full">
        {blocker && !loading && (touched.email || touched.password || email || password) && (
          <p className={`${HELP_IN_CARD} mb-2 text-center`}>{blocker}</p>
        )}
        <button
          type="submit"
          disabled={loading || !!blocker}
          className={`flex items-center justify-center ${PRIMARY_BTN} ${
            loading || blocker ? PRIMARY_BTN_OFF : PRIMARY_BTN_ON
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