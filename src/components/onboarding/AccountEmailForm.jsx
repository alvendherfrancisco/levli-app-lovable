import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import SocialAuthButtons from "@/components/onboarding/SocialAuthButtons";
import {
  emailError, passwordError, passwordStrength, formBlocker,
} from "@/lib/accountValidation";
import { sound } from "@/lib/sounds";

/** The one field style, shared by both fields. */
const FIELD =
  "w-full border-2 border-gray-200 bg-white rounded-xl px-4 py-3.5 text-[16px] text-gray-700 outline-none focus:border-indigo-500 transition-colors";

const STRENGTH_BAR = {
  weak: "bg-red-500",
  fair: "bg-orange-400",
  good: "bg-amber-400",
  strong: "bg-teal-500",
};

/**
 * The email half of the account step: an email and a password, and nothing else.
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
    <form onSubmit={submit} className="onb-cta flex w-full flex-col">
      {error && (
        <p className="mb-4 w-full rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-600">{error}</p>
      )}

      <div className="w-full">
        <input
          ref={emailRef}
          type="email"
          inputMode="email"
          placeholder="Email"
          aria-label="Email"
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
        {emailMsg && <p className="mt-2 text-[13px] text-red-600">{emailMsg}</p>}
      </div>

      <div className="mt-3 w-full">
        <div className="relative w-full">
          <input
            ref={passwordRef}
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            aria-label="Password"
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
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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

      {/* Create account, directly under the two fields — with the reason it is
          not ready yet, which waits for the first touch so an untouched form is
          not scolded, directly above it. Below it come the other two ways in,
          then the legal line and the way to log in instead. */}
      <div className="mt-6 w-full">
        {blocker && !loading && (touched.email || touched.password || email || password) && (
          <p className="mb-2 text-center text-[13px] text-gray-500">{blocker}</p>
        )}
        <button
          type="submit"
          disabled={loading || !!blocker}
          className="onb-cta-btn w-full rounded-full bg-indigo-600 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all active:scale-95 disabled:bg-gray-200 disabled:text-gray-600 disabled:shadow-none disabled:active:scale-100"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Creating account...
            </span>
          ) : "Create account"}
        </button>
      </div>

      {/* The divider and the two provider marks sit under the button, below the
          one tap that creates an account with the email just typed. */}
      <SocialAuthButtons onProvider={onProvider} disabled={loading} />

      <p className="mt-6 px-2 text-center text-[12px] leading-relaxed text-gray-500">
        By creating an account you agree to our{" "}
        <Link to="/terms" className="text-indigo-600 underline">Terms of Service</Link>{" "}
        and{" "}
        <Link to="/privacy" className="text-indigo-600 underline">Privacy Policy</Link>.
      </p>

      <p className="mt-4 px-2 text-center text-[14px] text-gray-500">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-indigo-600 hover:underline">Log in</Link>
      </p>
    </form>
  );
}