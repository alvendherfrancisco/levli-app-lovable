import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SocialAuthButtons from "@/components/onboarding/SocialAuthButtons";
import {
  emailError, passwordError, passwordStrength, formBlocker,
} from "@/lib/accountValidation";
import { sound } from "@/lib/sounds";

/** The one field style, shared by both fields: room on the left for the field's
 *  icon, and on the password a little more on the right for the eye. */
const FIELD = "h-12 rounded-xl border-gray-200 pl-10";

const STRENGTH_BAR = {
  weak: "bg-red-500",
  fair: "bg-orange-400",
  good: "bg-amber-400",
  strong: "bg-teal-500",
};

/**
 * The account step's card — the same construction the login screen uses: a soft
 * grey panel with a hairline border holding the fields, the divider, the two
 * provider marks and the one button. Above it sits the step's own illustration
 * and heading; below it the legal line and the way to log in instead.
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
 * live strength hint that never blocks anything. Until both fields are filled
 * the button stays a light grey and does nothing.
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
      <div className="rounded-2xl border border-gray-200 bg-gray-100 p-5 shadow-sm">
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-600">{error}</div>
        )}

        <div className="space-y-2">
          <Label htmlFor="signup-email" className="text-gray-700">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <Input
              ref={emailRef}
              id="signup-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="next"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={revealField}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              onKeyDown={(e) => focusNext(e, passwordRef)}
              className={FIELD}
            />
          </div>
          {emailMsg && <p className="text-[13px] text-red-600">{emailMsg}</p>}
        </div>

        <div className="mt-4 space-y-2">
          <Label htmlFor="signup-password" className="text-gray-700">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <Input
              ref={passwordRef}
              id="signup-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              enterKeyHint="go"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={revealField}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              className={`${FIELD} pr-12`}
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
            <p className="text-[13px] text-red-600">{passwordMsg}</p>
          ) : strength ? (
            <div>
              <div className="flex items-center gap-2">
                <span className="flex flex-1 gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className={`h-1 flex-1 rounded-full ${i <= strength.score ? STRENGTH_BAR[strength.tone] : "bg-gray-300"}`}
                    />
                  ))}
                </span>
                <span className="text-[12px] font-semibold text-gray-500">{strength.label}</span>
              </div>
              {strength.hint && <p className="mt-1 text-[12px] text-gray-500">{strength.hint}</p>}
            </div>
          ) : null}
        </div>

        {/* The divider, then Google and Apple, then the one tap that creates an
            account with the email just typed. */}
        <SocialAuthButtons onProvider={onProvider} disabled={loading} />

        <div className="mt-5">
          {blocker && !loading && (touched.email || touched.password || email || password) && (
            <p className="mb-2 text-center text-[13px] text-gray-500">{blocker}</p>
          )}
          <Button
            type="submit"
            disabled={loading || !!blocker}
            className="h-12 w-full rounded-xl bg-indigo-600 font-medium text-white hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-500 disabled:opacity-100"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : "Create account"}
          </Button>
        </div>
      </div>

      <p className="mt-5 px-2 text-center text-[12px] leading-relaxed text-gray-500">
        By creating an account you agree to our{" "}
        <Link to="/terms" className="text-indigo-600 underline">Terms of Service</Link>{" "}
        and{" "}
        <Link to="/privacy" className="text-indigo-600 underline">Privacy Policy</Link>.
      </p>

      <p className="mt-4 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-indigo-600 hover:underline">Log in</Link>
      </p>
    </form>
  );
}