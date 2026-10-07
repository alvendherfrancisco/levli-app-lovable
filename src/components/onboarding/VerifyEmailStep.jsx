import React, { useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { sound } from "@/lib/sounds";

/**
 * The verification half of the email path.
 *
 * Signing up sends a code to the address given; entering it here is what turns
 * the account into a session. The screen offers a fresh code, and a way back to
 * the form with everything already typed still in place.
 */
export default function VerifyEmailStep({
  email, onVerify, onResend, onBackToForm, loading, error, notice,
}) {
  const [code, setCode] = useState("");

  return (
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
        <MailCheck className="w-6 h-6 text-primary" />
      </div>
      <div className="text-center mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
          Check your email
        </h1>
        <p className="text-base text-muted-foreground break-words leading-relaxed mt-2">
          We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>.
          Enter it and your account is ready.
        </p>
      </div>

      {error && (
        <p className="w-full mb-3 text-sm text-red-600 text-center bg-red-50 rounded-xl px-3 py-2">{error}</p>
      )}
      {notice && (
        <p className="w-full mb-3 text-sm text-teal-700 text-center bg-teal-50 rounded-xl px-3 py-2">{notice}</p>
      )}

      <div className="flex justify-center mb-3">
        <InputOTP maxLength={6} value={code} onChange={setCode} autoFocus>
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

      {/* Docked, so the button stays in view however tall the step grows. */}
      <div className="sticky bottom-0 z-10 w-full pt-3 pb-1 bg-background/85 backdrop-blur-sm">
        <button
          onClick={() => { sound.tap(); onVerify(code); }}
          disabled={loading || code.length < 6}
          className="onb-cta-btn w-full max-w-[320px] mx-auto rounded-full font-semibold text-base bg-primary text-primary-foreground shadow-lg shadow-primary/25 disabled:opacity-50 transition-all active:scale-95"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
            </span>
          ) : "Verify and continue"}
        </button>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-4">
        Didn't get it?{" "}
        <button onClick={() => { sound.tap(); onResend(); }} className="text-primary font-medium hover:underline">
          Resend email
        </button>
      </p>
      <button onClick={() => { sound.tap(); onBackToForm(); }} className="text-center text-sm text-muted-foreground mt-3 hover:text-foreground">
        Use a different email
      </button>
    </div>
  );
}