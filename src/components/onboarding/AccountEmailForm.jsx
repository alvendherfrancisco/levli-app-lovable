import React, { useRef, useState } from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import AccountField from "@/components/onboarding/AccountField";
import AccountFooter from "@/components/onboarding/AccountFooter";
import PasswordStrength from "@/components/onboarding/PasswordStrength";
import { ICON_BUTTON } from "@/components/onboarding/formStyles";
import {
  MIN_PASSWORD_LENGTH, emailError, firstNameError, formBlocker, passwordError, passwordStrength,
} from "@/lib/accountValidation";
import { sound } from "@/lib/sounds";

/** What the waiting button asks for before anything has been touched. */
const MISSING = "Enter your name, a valid email, and a password of 8+ characters.";

/**
 * The account form — first name, email, password — and the footer that creates
 * the account.
 *
 * It owns the whole column: the caller passes the illustration, the title and
 * the provider buttons in as children, because the fields and the button that
 * submits them are one form, and the button has to stay put while the fields
 * scroll behind it.
 *
 * Each field says what it wants under itself. A message appears when the field
 * is left, so nothing is scolded before it has been filled in, and the button
 * waits with one plain sentence above it saying what is still missing.
 */
export default function AccountEmailForm({
  children, firstName, setFirstName, email, setEmail, password, setPassword,
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
  const started = Object.keys(touched).length > 0;

  /** Leaving a field is what asks it to speak: its message, and the error cue. */
  const leave = (field, problem) => {
    setTouched((t) => ({ ...t, [field]: true }));
    if (problem) sound.warning();
  };

  // The keyboard must never come up over the field being typed into.
  const keepInView = (e) => e.target.scrollIntoView({ block: "center", behavior: "smooth" });

  // The return key walks the form, and submits it from the last field.
  const focusNext = (e, next) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    next.current?.focus();
  };

  const submit = (e) => {
    e.preventDefault();
    if (loading) return; // one account, however fast the button is tapped
    setTouched({ firstName: true, email: true, password: true });
    if (blocker) { sound.warning(); return; }
    onSubmit();
  };

  return (
    <form onSubmit={submit} noValidate className="w-full flex flex-col">
      <div className="w-full flex flex-col">
        {children}

        {error && (
          <p
            role="alert"
            className="w-full flex items-start gap-2 text-left text-[14px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-3 mb-4 leading-relaxed"
          >
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}

        <div className="w-full flex flex-col gap-4">
          <AccountField
            id="account-first-name"
            label="First name"
            placeholder="Jamie"
            autoComplete="given-name"
            enterKeyHint="next"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            onBlur={() => leave("firstName", firstNameError(firstName))}
            onFocus={keepInView}
            onKeyDown={(e) => focusNext(e, emailRef)}
            error={nameMsg}
          />

          <AccountField
            id="account-email"
            label="Email"
            type="email"
            inputMode="email"
            placeholder="you@example.com"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="next"
            inputRef={emailRef}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => leave("email", emailError(email))}
            onFocus={keepInView}
            onKeyDown={(e) => focusNext(e, passwordRef)}
            error={emailMsg}
          />

          <AccountField
            id="account-password"
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
            autoComplete="new-password"
            enterKeyHint="go"
            inputRef={passwordRef}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => leave("password", passwordError(password))}
            onFocus={keepInView}
            error={passwordMsg}
            hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
            extra={<PasswordStrength strength={strength} />}
            trailing={
              <button
                type="button"
                onClick={() => { sound.tap(); setShowPassword((s) => !s); }}
                className={`${ICON_BUTTON} text-gray-400 hover:text-gray-600`}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
              </button>
            }
          />
        </div>
      </div>

      <AccountFooter blocker={blocker} message={started ? blocker : MISSING} loading={loading} />
    </form>
  );
}