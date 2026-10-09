import React, { useRef, useState } from "react";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import SocialAuthButtons from "@/components/onboarding/SocialAuthButtons";
import {
  emailError, passwordError, passwordStrength, formBlocker,
} from "@/lib/accountValidation";
import { sound } from "@/lib/sounds";

/**
 * The one field style, drawn the way the login screen draws its fields: a 48pt
 * input with the mark in a fixed slot on the left, so the two fields line up
 * exactly and the card reads as a standard sign-up form.
 */
const FIELD =
  "h-12 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 text-[16px] text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-indigo-500";

const LABEL = "mb-2 block text-sm font-medium text-gray-900";

const STRENGTH_BAR = {
  weak: "bg-red-500",
  fair: "bg-orange-400",
  good: "bg-amber-400",
  strong: "bg-teal-500",
};

/**
 * The account card: an email and a password, and nothing else.
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
 * The card holds, in order: the two labelled fields, the divider and the two
 * provider marks, and the button that creates the account — the same card,
 * labels, marks and indigo button the login screen uses. What sits under the
 * card (the legal line and the way to log in instead) is the caller's.
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
    <form onSubmit={submit} className="w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
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

      {/* The divider and the two provider marks sit between the fields and the
          button, exactly as they do on the login screen. */}
      <SocialAuthButtons onProvider={onProvider} disabled={loading} />

      {/* Why the button is not ready yet, which waits for the first touch so an
          untouched form is not scolded, directly above it. */}
      {blocker && !loading && (touched.email || touched.password || email || password) && (
        <p className="mb-2 text-center text-[13px] text-gray-500">{blocker}</p>
      )}
      <button
        type="submit"
        disabled={loading || !!blocker}
        className="flex h-12 w-full items-center justify-center rounded-lg bg-indigo-600 text-[15px] font-medium text-white transition-colors hover:bg-indigo-700 active:scale-[0.99] disabled:bg-gray-200 disabled:text-gray-400 disabled:hover:bg-gray-200 disabled:active:scale-100"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...
          </>
        ) : "Create account"}
      </button>
    </form>
  );
}