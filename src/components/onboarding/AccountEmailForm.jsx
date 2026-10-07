import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import {
  emailError, firstNameError, passwordError, passwordStrength, formBlocker,
} from "@/lib/accountValidation";
import { sound } from "@/lib/sounds";

const FIELD =
  "w-full border-2 border-border bg-background rounded-xl px-3.5 py-3 text-base text-foreground outline-none focus:border-primary transition-colors";

const STRENGTH_BAR = {
  weak: "bg-red-500",
  fair: "bg-orange-400",
  good: "bg-amber-400",
  strong: "bg-teal-500",
};

/**
 * The email half of the account step: first name, email, password.
 *
 * Validation is inline and specific — each message sits beside the field it
 * belongs to, after that field has been touched, and the button says in words
 * what still needs filling rather than failing silently. The password is shown
 * behind an eye toggle instead of a second confirmation field, and carries a
 * live strength hint that never blocks anything.
 */
export default function AccountEmailForm({
  firstName, setFirstName, email, setEmail, password, setPassword,
  onSubmit, loading, error,
}) {
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const strength = passwordStrength(password);
  const blocker = formBlocker({ firstName, email, password });
  const nameMsg = touched.firstName ? firstNameError(firstName) : "";
  const emailMsg = touched.email ? emailError(email) : "";
  const passwordMsg = touched.password ? passwordError(password) : "";

  // The return key walks the form: name → email → password → create account.
  const focusNext = (e, next) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    next.current?.focus();
  };

  const submit = (e) => {
    e.preventDefault();
    setTouched({ firstName: true, email: true, password: true });
    if (formBlocker({ firstName, email, password })) return;
    sound.tap();
    onSubmit();
  };

  return (
    <form onSubmit={submit} className="flex flex-col items-center">
      {error && (
        <p className="w-full mb-3 text-sm text-red-600 text-center bg-red-50 rounded-xl px-3 py-2">{error}</p>
      )}

      <input
        type="text"
        placeholder="First name"
        aria-label="First name"
        autoComplete="given-name"
        enterKeyHint="next"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        onBlur={() => setTouched((t) => ({ ...t, firstName: true }))}
        onKeyDown={(e) => focusNext(e, emailRef)}
        className={`${FIELD} mb-1`}
      />
      {nameMsg && <p className="w-full text-xs text-red-500 mb-1.5">{nameMsg}</p>}

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
        onBlur={() => setTouched((t) => ({ ...t, email: true }))}
        onKeyDown={(e) => focusNext(e, passwordRef)}
        className={`${FIELD} mb-1`}
      />
      {emailMsg && <p className="w-full text-xs text-red-500 mb-1.5">{emailMsg}</p>}

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
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
          className={`${FIELD} pr-11`}
        />
        <button
          type="button"
          onClick={() => { sound.tap(); setShowPassword((s) => !s); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {passwordMsg ? (
        <p className="w-full text-xs text-red-500 mt-1.5">{passwordMsg}</p>
      ) : strength ? (
        <div className="w-full mt-1.5">
          <div className="flex items-center gap-2">
            <span className="flex-1 flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={`h-1 flex-1 rounded-full ${i <= strength.score ? STRENGTH_BAR[strength.tone] : "bg-muted"}`}
                />
              ))}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">{strength.label}</span>
          </div>
          {strength.hint && <p className="text-xs text-muted-foreground mt-1">{strength.hint}</p>}
        </div>
      ) : null}

      {/* The button is docked to the bottom of the step, so it stays in view while
          the form scrolls behind it — with the reason it is not ready yet, which
          waits for the first touch so an untouched form is not scolded, sitting
          right above it. */}
      <div className="sticky bottom-0 z-10 w-full pt-3 pb-1 bg-background/85 backdrop-blur-sm">
        {blocker && !loading && (touched.firstName || touched.email || touched.password || firstName || email || password) && (
          <p className="text-sm text-muted-foreground mb-2 text-center">{blocker}</p>
        )}
        <button
          type="submit"
          disabled={loading || !!blocker}
          className="onb-cta-btn w-full max-w-[320px] mx-auto rounded-full font-semibold text-base bg-primary text-primary-foreground shadow-lg shadow-primary/25 disabled:opacity-50 transition-all active:scale-95"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Creating account...
            </span>
          ) : "Create account"}
        </button>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-4 px-4 leading-relaxed">
        By creating an account you agree to our{" "}
        <Link to="/terms" className="text-primary underline">Terms of Service</Link>{" "}
        and{" "}
        <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>.
      </p>

      <p className="text-center text-sm text-muted-foreground mt-4">
        Already have an account?{" "}
        <Link to="/login" className="text-primary font-medium hover:underline">Log in</Link>
      </p>
    </form>
  );
}