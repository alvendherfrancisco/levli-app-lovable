import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { SignUpIllustration } from "@/components/onboarding/OnboardingIllustrations";

/**
 * Onboarding step 4 — account creation.
 * Collects email + password, verifies via OTP, then persists the onboarding
 * state (via persistState) and reloads so the auth session initialises.
 * The reload resumes onboarding at step 5 (Privacy) with all prior data intact.
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

  if (showOtp) {
    return (
      <div className="flex flex-col">
        <SignUpIllustration className="onb-art" />
        <div className="text-center mt-2.5 mb-3">
          <h1 className="text-[21px] sm:text-[26px] font-bold text-gray-800 mb-1.5 leading-tight px-2">
            Verify your email
          </h1>
          <p className="text-[13px] text-gray-500 px-3 break-words">We sent a code to {email}</p>
        </div>
        {error && (
          <p className="mb-3 text-sm text-red-500 text-center bg-red-50 rounded-xl px-3 py-2">{error}</p>
        )}
        <div className="flex justify-center mb-3">
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
          onClick={handleVerify}
          disabled={loading || otpCode.length < 6}
          className="onb-cta-btn w-full max-w-[320px] mx-auto rounded-full font-semibold text-base bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 disabled:opacity-60 transition-all active:scale-95"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
            </span>
          ) : "Verify"}
        </button>
        <p className="text-center text-[13px] text-gray-500 mt-3">
          Didn't receive the code?{" "}
          <button onClick={handleResend} className="text-indigo-600 font-medium hover:underline">
            Resend
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <SignUpIllustration className="onb-art" />
      <div className="text-center mt-2.5 mb-3">
        <h1 className="text-[21px] sm:text-[26px] font-bold text-gray-800 mb-1.5 leading-tight px-2">
          Create your account
        </h1>
        <p className="text-[13px] text-gray-500 px-3 leading-snug">
          Sign up to save your journey and pick up where you left off, on any device.
        </p>
      </div>
      {error && (
        <p className="mb-3 text-sm text-red-500 text-center bg-red-50 rounded-xl px-3 py-2">{error}</p>
      )}
      <form onSubmit={handleSubmit} className="space-y-2.5 flex flex-col items-center">
        <input
          type="text"
          placeholder="First name"
          autoComplete="given-name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="w-full max-w-[400px] border-2 border-gray-200 bg-white rounded-xl px-3.5 py-2.5 text-[15px] text-gray-700 outline-none focus:border-indigo-500 transition-colors"
        />
        <input
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border-2 border-gray-200 bg-white rounded-xl px-3.5 py-2.5 text-[15px] text-gray-700 outline-none focus:border-indigo-500 transition-colors"
          required
        />
        <input
          type="password"
          placeholder="Password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border-2 border-gray-200 bg-white rounded-xl px-3.5 py-2.5 text-[15px] text-gray-700 outline-none focus:border-indigo-500 transition-colors"
          required
        />
        <input
          type="password"
          placeholder="Confirm password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full border-2 border-gray-200 bg-white rounded-xl px-3.5 py-2.5 text-[15px] text-gray-700 outline-none focus:border-indigo-500 transition-colors"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="onb-cta-btn w-full max-w-[320px] mx-auto rounded-full font-semibold text-base bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 disabled:opacity-60 transition-all active:scale-95"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Creating account...
            </span>
          ) : "Create account"}
        </button>
      </form>
      <p className="text-center text-[11px] text-gray-400 mt-3 px-4 leading-snug">
        By creating an account, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}