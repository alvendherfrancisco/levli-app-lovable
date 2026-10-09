import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import AmbientBackground from "@/components/onboarding/AmbientBackground";
import LevliLogo from "@/components/LevliLogo";
import RegisterForm from "@/components/RegisterForm";
import { toast } from "@/components/ui/use-toast";
import {
  HEADING, LINK, LINK_UNDERLINE, NOTICE,
  PRIMARY_BTN, PRIMARY_BTN_OFF, PRIMARY_BTN_ON, SUBTITLE,
} from "@/lib/uiStyles";

/**
 * Creating an account, drawn as the same screen as signing in: the warm ambient
 * background, the droplet, the greeting, one white card holding the two labelled
 * fields and the two provider marks, and the screen's own action as a pill below
 * the card. The page scrolls, and its last line is kept clear of the home
 * indicator, so nothing is ever cut off on a short phone.
 *
 * Verifying the emailed code is the step after this one and is its own screen.
 */
export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
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
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      // Replace, not push: the sign-up page must not stay in the history behind
      // the app (see the note in Login.jsx).
      window.location.replace("/");
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
      toast({
        title: "Code sent",
        description: "Check your email for the new code.",
      });
    } catch (err) {
      setError(err.message || "Failed to resend code");
    }
  };

  const handleProvider = (provider) => {
    base44.auth.loginWithProvider(provider, "/");
  };

  if (showOtp) {
    return (
      <AuthLayout
        iconNode={<LevliLogo size={88} />}
        title="Verify your email"
        subtitle={`We sent a code to ${email}`}
      >
        {error && <p className={`${NOTICE} mb-4`}>{error}</p>}
        <div className="flex justify-center mb-6">
          <InputOTP
            maxLength={6}
            value={otpCode}
            onChange={setOtpCode}
            autoFocus
            autoComplete="one-time-code"
          >
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
          className={`flex items-center justify-center ${PRIMARY_BTN} ${
            otpCode.length === 6 && !loading ? PRIMARY_BTN_ON : PRIMARY_BTN_OFF
          }`}
          onClick={handleVerify}
          disabled={loading || otpCode.length < 6}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify"
          )}
        </button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Didn't receive the code?{" "}
          <button onClick={handleResend} className={LINK}>
            Resend
          </button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-[#FAFAFA]">
      <AmbientBackground />
      <div className="auth-page-bottom relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col px-5 pt-8 sm:px-6 sm:pt-12">
        {/* A short screen sits centred; a taller one scrolls from its top, so the
            greeting is never pushed off the top to make room for the card. */}
        <div className="my-auto w-full py-6">
          <div className="mb-6 flex justify-center">
            <LevliLogo size={88} />
          </div>

          <div className="mb-6 text-center">
            <h1 className={HEADING}>Create your account</h1>
            <p className={`${SUBTITLE} mt-2`}>Sign up to get started</p>
          </div>

          <RegisterForm
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
            onProvider={handleProvider}
          />

          <p className="mt-6 px-1 text-center text-[12.5px] leading-relaxed text-gray-500">
            By creating an account you agree to our{" "}
            <Link to="/terms" className={LINK_UNDERLINE}>Terms of Service</Link> and{" "}
            <Link to="/privacy" className={LINK_UNDERLINE}>Privacy Policy</Link>
          </p>

          <p className="mt-6 text-center text-[15px] text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className={LINK}>
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}