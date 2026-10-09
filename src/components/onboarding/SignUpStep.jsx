import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { SignUpIllustration } from "@/components/onboarding/OnboardingIllustrations";
import SocialAuthButtons from "@/components/onboarding/SocialAuthButtons";
import AccountEmailForm from "@/components/onboarding/AccountEmailForm";
import VerifyEmailStep from "@/components/onboarding/VerifyEmailStep";
import OnboardingArt from "@/components/onboarding/OnboardingArt";
import { isEmailTakenError } from "@/lib/accountValidation";
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
 *
 * The screen is one column: the illustration, the title and the provider
 * buttons travel into the form as children, so the fields and the button that
 * submits them stay in a single form and the button stays pinned at the bottom
 * while everything above it scrolls.
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
  // A keyboard on screen is worth a smaller picture: the field being typed into
  // gets the room, and nothing that is text ever shrinks.
  const [typing, setTyping] = useState(false);

  const address = email.trim();

  const signUp = async () => {
    if (loading) return;
    setError("");
    setResent("");
    setTaken(false);
    setLoading(true);
    try {
      await base44.auth.register({ email: address, password });
      // Registered, not yet verified. The answers stay on the device, and a
      // reload lands back on the code screen rather than an emptied form.
      persistState?.({ firstName, email: address, step: 3, awaitingVerification: true, verified: false });
      sound.success();
      setView("verify");
    } catch (err) {
      if (isEmailTakenError(err)) setTaken(true);
      else setError(friendlySignUpError(err));
      sound.warning();
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
      sound.success();
      persistState?.({ firstName, email: address, step: 4, verified: true, awaitingVerification: false });
      window.location.replace("/onboarding");
    } catch (err) {
      setError("That code didn't match. Check the most recent email, or ask for a new one.");
      sound.warning();
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
      sound.warning();
    }
  };

  if (view === "verify") {
    return (
      <div className="w-full flex flex-col">
        <VerifyEmailStep
          email={address}
          onVerify={verify}
          onResend={resend}
          onBackToForm={() => { setView("form"); setError(""); setResent(""); setTaken(false); }}
          loading={loading}
          error={error}
          notice={resent}
        />
      </div>
    );
  }

  if (taken) {
    return (
      <div className="w-full flex flex-col items-center">
        <p className="text-center text-[18px] font-bold text-gray-800 mb-1.5">
          This email is already registered.
        </p>
        <p className="text-center text-[14.5px] text-gray-500 mb-5 px-3 leading-relaxed">
          Nothing was created. Log in with Google, or with the password you set.
        </p>
        <div className="w-full">
          <SocialAuthButtons
            providers={["google"]}
            divider={false}
            labels={{ google: "Log in with Google" }}
            onProvider={onProvider}
          />
        </div>
        <Link
          to="/login"
          className="inline-flex items-center min-h-[44px] px-2 mt-4 text-[14px] text-indigo-600 font-semibold"
        >
          Log in with email and password
        </Link>
        <button
          type="button"
          onClick={() => { sound.tap(); setTaken(false); setError(""); }}
          className="min-h-[44px] px-2 text-[13px] text-gray-500 hover:text-gray-700"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    // Focus travels through the whole column, so the picture can shrink the
    // moment the keyboard comes up and grow back when it goes.
    <div
      className="w-full flex flex-col"
      onFocusCapture={() => setTyping(true)}
      onBlurCapture={() => setTyping(false)}
    >
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
      >
        <OnboardingArt compact={typing}>
          <SignUpIllustration />
        </OnboardingArt>

        <div className="text-center mb-4">
          <h1 className="text-[24px] sm:text-[28px] font-bold text-gray-800 mb-2 leading-tight px-2">
            Create your account
          </h1>
          <p className="text-[15px] text-gray-500 px-3 leading-relaxed">
            Sign up to save your journey and pick up where you left off, on any device.
          </p>
        </div>

        {notice && (
          <p className="w-full mb-4 text-[14px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-center leading-relaxed">
            {notice}
          </p>
        )}

        <SocialAuthButtons onProvider={onProvider} disabled={loading} />
      </AccountEmailForm>
    </div>
  );
}