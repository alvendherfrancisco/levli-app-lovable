import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { SignUpIllustration } from "@/components/onboarding/OnboardingIllustrations";
import StepArt from "@/components/onboarding/StepArt";
import StepHeading from "@/components/onboarding/StepHeading";
import { FIELD } from "@/components/onboarding/onboardingStyles";

/**
 * Step 4 — account creation.
 * Collects email + password, verifies via OTP, then persists the onboarding
 * state (via persistState) and reloads so the auth session initialises.
 * The reload resumes onboarding at the consent step with all prior data intact.
 */
export default function SignUpStep({ persistState }) {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) base44.auth.setToken(result.access_token);
      // Persist onboarding state so it survives the auth-session reload.
      persistState?.({ firstName });
      // Replace, not push: the sign-up page must not stay in the history behind
      // onboarding (see the note in Login.jsx).
      window.location.replace("/onboarding");
    } catch (err) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
    } catch (err) {
      setError(err.message || "Failed to resend code");
    }
  };

  const errorLine = error && (
    <p role="alert" className="rounded-xl border border-destructive bg-background px-3 py-2 text-center text-sm text-foreground">
      {error}
    </p>
  );

  if (showOtp) {
    return (
      <div className="flex flex-col gap-[clamp(0.5rem,1.8vh,1.25rem)] py-2">
        <StepArt size="compact">
          <SignUpIllustration />
        </StepArt>
        <StepHeading title="Verify your email" subtitle={`We sent a 6-digit code to ${email}`} />
        {errorLine}
        <div className="flex justify-center">
          <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <button
          type="button"
          onClick={handleVerify}
          disabled={loading || otpCode.length < 6}
          className="mx-auto min-h-[52px] w-full max-w-[320px] rounded-full bg-action text-base font-semibold text-action-foreground transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Verifying…
            </span>
          ) : "Verify"}
        </button>
        <p className="text-center text-sm text-muted-foreground">
          Didn't receive the code?{" "}
          <button type="button" onClick={handleResend} className="min-h-[44px] font-medium text-primary underline">
            Resend
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[clamp(0.4rem,1.4vh,1rem)] py-2">
      <StepArt size="compact">
        <SignUpIllustration />
      </StepArt>
      <StepHeading
        title="Create your account"
        subtitle="Save your journey and pick up where you left off, on any device."
      />
      {errorLine}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
        <input
          type="text"
          placeholder="First name"
          autoComplete="given-name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className={FIELD}
        />
        <input
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={FIELD}
          required
        />
        <input
          type="password"
          placeholder="Password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={FIELD}
          required
        />
        <input
          type="password"
          placeholder="Confirm password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={FIELD}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="mx-auto min-h-[52px] w-full max-w-[320px] rounded-full bg-action text-base font-semibold text-action-foreground transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Creating account…
            </span>
          ) : "Create account"}
        </button>
      </form>
      <p className="text-center text-xs text-muted-foreground">
        By creating an account, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}