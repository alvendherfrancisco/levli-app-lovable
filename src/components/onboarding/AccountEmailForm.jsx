import React, { useRef, useState } from "react";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import SocialAuthButtons from "@/components/onboarding/SocialAuthButtons";
import {
  emailError, passwordError, passwordStrength, formBlocker,
} from "@/lib/accountValidation";
// The field and label style, shared with the sign-in card so the two screens
// can never drift apart.
import { FIELD, LABEL } from "@/lib/authFormStyles";
import { sound } from "@/lib/sounds";

const STRENGTH_BAR = {
  weak: "bg-red-500",
  fair: "bg-orange-400",
  good: "bg-amber-400",
  strong: "bg-teal-500",
};

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

  const strength = passwordStrength(password);
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
      <div className="w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        {error && (
          <p className="mb-4 w-full rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-600">{error}</p>
        )}

        <div className="w-full">
          <label htmlFor="signup-email" className={LABEL}>Email</label>
          <div className="relative w-full">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
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
          {emailMsg && <p className="mt-2 text-[13px] text-red-600">{emailMsg}</p>}
        </div>

        <div className="mt-4 w-full">
          <label htmlFor="signup-password" className={LABEL}>Password</label>
          <div className="relative w-full">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
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
              className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {passwordMsg ? (
            <p className="mt-2 text-[13px] text-red-600">{passwordMsg}</p>
          ) : strength ? (
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <span className="flex flex-1 gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className={`h-1 flex-1 rounded-full ${i <= strength.score ? STRENGTH_BAR[strength.tone] : "bg-gray-200"}`}
                    />
                  ))}
                </span>
                <span className="text-[12px] font-semibold text-gray-500">{strength.label}</span>
              </div>
              {strength.hint && <p className="mt-1 text-[12px] text-gray-500">{strength.hint}</p>}
            </div>
          ) : null}
        </div>

        <SocialAuthButtons onProvider={onProvider} disabled={loading} />
      </div>

      {/* Create account — the shell's own Next button in everything but the
          wording: same pill, same indigo, same height, same soft shadow. It sits
          outside the card, lined up with the card's own edges, with the reason
          it is not ready yet above it, which waits for the first touch so an
          untouched form is not scolded. */}
      <div className="mt-5 w-full">
        {blocker && !loading && (touched.email || touched.password || email || password) && (
          <p className="mb-2 text-center text-[13px] text-gray-500">{blocker}</p>
        )}
        <button
          type="submit"
          disabled={loading || !!blocker}
          className={`onb-cta-btn flex w-full items-center justify-center rounded-full text-base font-semibold transition-all duration-300 active:scale-95 sm:text-lg ${
            loading || blocker
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