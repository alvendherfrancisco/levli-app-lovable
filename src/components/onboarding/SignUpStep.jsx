import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { SignUpIllustration } from "@/components/onboarding/OnboardingIllustrations";
import SocialAuthButtons from "@/components/onboarding/SocialAuthButtons";
import AccountEmailForm from "@/components/onboarding/AccountEmailForm";
import VerifyEmailStep from "@/components/onboarding/VerifyEmailStep";
import GoogleIcon from "@/components/GoogleIcon";
import { formBlocker, isEmailTakenError } from "@/lib/accountValidation";
import { sound } from "@/lib/sounds";

/** Turns a refusal from the sign-up endpoint into something worth reading. */
function friendlySignUpError(err) {
  const message = String(err?.message || "");
  if (/network|fetch|timeout|offline/i.test(message)) {
    return "We couldn't reach Levli. Check your connection and try again.";
  }
  if (/password/i.test(message)) return message;
  return "We couldn't create your account just now. Please try again.";
}

/**
 * Onboarding's account step.
 *
 * Two ways in, one account:
 *  - Google and Apple hand off to the provider and come back already signed in.
 *    Nothing is asked twice: the name and email come from the provider, that
 *    email is already verified, and the account step is skipped altogether.
 *  - Email creates the account, verifies the address with the emailed code, and
 *    reloads so the new session starts.
 * Either way the answers given so far are already on the device (see
 * src/lib/onboardingDraft.js) and are saved to the account in one write when
 * onboarding finishes.
 */
export default function SignUpStep({
  firstName, setFirstName, email, setEmail,
  persistState, onProvider, notice = "", startAtVerify = false,
}) {
  const [view, setView] = useState(startAtVerify ? "verify" : "form");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resent, setResent] = useState("");
  const [taken, setTaken] = useState(false);
  const [loading, setLoading] = useState(false);

  const address = email.trim();

  const signUp = async () => {
    setError("");
    setResent("");
    setTaken(false);
    if (formBlocker({ firstName, email, password })) return;
    setLoading(true);
    try {
      await base44.auth.register({ email: address, password });
      // Registered, not yet verified. The answers stay on the device, and a
      // reload lands back on the code screen rather than an emptied form.
      persistState?.({ firstName, email: address, step: 3, awaitingVerification: true, verified: false });
      setView("verify");
    } catch (err) {
      if (isEmailTakenError(err)) setTaken(true);
      else setError(friendlySignUpError(err));
    } finally {
      setLoading(false);
    }
  };

  const verify = async (code) => {
    setError("");
    setResent("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email: address, otpCode: code });
      if (result?.access_token) base44.auth.setToken(result.access_token);
      // Verified: everything answered travels on and is saved to the new account
      // in one write when onboarding finishes. Replace, not push, so the account
      // step is not left in the history behind onboarding.
      persistState?.({ firstName, email: address, step: 4, verified: true, awaitingVerification: false });
      window.location.replace("/onboarding");
    } catch (err) {
      setError("That code didn't match. Check the most recent email, or ask for a new one.");
      setLoading(false);
    }
  };

  const resend = async () => {
    setError("");
    setResent("");
    try {
      await base44.auth.resendOtp(address);
      setResent("Sent. Check your inbox for a new code.");
    } catch (err) {
      setError("We couldn't send another code just now. Please try again in a moment.");
    }
  };

  if (view === "verify") {
    return (
      <VerifyEmailStep
        email={address}
        onVerify={verify}
        onResend={resend}
        onBackToForm={() => { setView("form"); setError(""); setResent(""); setTaken(false); }}
        loading={loading}
        error={error}
        notice={resent}
      />
    );
  }

  return (
    <div className="flex flex-col">
      <SignUpIllustration />

      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
          Create your account
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed mt-2">
          Sign up to save your journey and pick up where you left off, on any device.
        </p>
      </div>

      {notice && (
        <p className="mb-4 text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl px-3 py-2.5 text-center leading-relaxed">
          {notice}
        </p>
      )}

      {taken ? (
        <div className="flex flex-col items-center">
          <p className="text-center text-base font-semibold text-foreground mb-2">
            This email is already registered.
          </p>
          <p className="text-center text-sm text-muted-foreground mb-4 px-3 leading-relaxed">
            Nothing was created. Log in with Google, or with the password you set.
          </p>
          <button
            type="button"
            onClick={() => { sound.tap(); onProvider("google"); }}
            className="w-full h-12 rounded-full border-2 border-border bg-background text-foreground text-base font-semibold flex items-center justify-center gap-2.5 hover:border-muted-foreground/40 active:scale-[0.98] transition-all"
          >
            <GoogleIcon className="w-5 h-5" />
            Log in with Google
          </button>
          <Link to="/login" className="text-sm text-primary font-medium hover:underline mt-4">
            Log in with email and password
          </Link>
          <button
            type="button"
            onClick={() => { sound.tap(); setTaken(false); setError(""); }}
            className="text-sm text-muted-foreground hover:text-foreground mt-3"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <SocialAuthButtons onProvider={onProvider} disabled={loading} />
          <AccountEmailForm
            firstName={firstName}
            setFirstName={setFirstName}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            onSubmit={signUp}
            loading={loading}
            error={error}
          />
        </div>
      )}
    </div>
  );
}