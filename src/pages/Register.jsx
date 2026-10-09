import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import AmbientBackground from "@/components/onboarding/AmbientBackground";
import LevliLogo from "@/components/LevliLogo";
import RegisterForm from "@/components/RegisterForm";
import { toast } from "@/components/ui/use-toast";

/**
 * Creating an account, drawn as the same screen as signing in: the warm ambient
 * background, the droplet, the greeting, one white card holding the three
 * labelled fields and the two provider marks, and the screen's own action as a
 * pill below the card. The page scrolls, and its last line is kept clear of the
 * home indicator, so nothing is ever cut off on a short phone.
 *
 * Verifying the emailed code is the step after this one and is its own screen.
 */
export default function Register() {
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
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
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
        <Button
          className="w-full h-12 font-medium"
          onClick={handleVerify}
          disabled={loading || otpCode.length < 6}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify"
          )}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Didn't receive the code?{" "}
          <button onClick={handleResend} className="text-primary font-medium hover:underline">
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
            <h1 className="text-[24px] sm:text-[28px] font-bold text-gray-800 mb-2 leading-tight">
              Create your account
            </h1>
            <p className="text-[15px] text-gray-500">Sign up to get started</p>
          </div>

          <RegisterForm
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
            onProvider={handleProvider}
          />

          <p className="mt-4 px-1 text-center text-[12.5px] leading-relaxed text-gray-500">
            By creating an account you agree to our{" "}
            <Link to="/terms" className="text-indigo-600 underline">Terms of Service</Link> and{" "}
            <Link to="/privacy" className="text-indigo-600 underline">Privacy Policy</Link>
          </p>

          <p className="mt-5 text-center text-[14px] text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-indigo-600 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}