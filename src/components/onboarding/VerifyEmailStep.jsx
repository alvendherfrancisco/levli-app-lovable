import React, { useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

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
      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-3">
        <MailCheck className="w-6 h-6 text-indigo-600" />
      </div>
      <div className="text-center mb-3">
        <h1 className="text-[21px] sm:text-[26px] font-bold text-gray-800 mb-1.5 leading-tight px-2">
          Check your email
        </h1>
        <p className="text-[13px] text-gray-500 px-3 break-words leading-snug">
          We sent a 6-digit code to <span className="font-medium text-gray-700">{email}</span>.
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

      <button
        onClick={() => onVerify(code)}
        disabled={loading || code.length < 6}
        className="onb-cta-btn w-full max-w-[320px] mx-auto rounded-full font-semibold text-base bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 disabled:opacity-50 transition-all active:scale-95"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
          </span>
        ) : "Verify and continue"}
      </button>

      <p className="text-center text-[13px] text-gray-500 mt-3">
        Didn't get it?{" "}
        <button onClick={onResend} className="text-indigo-600 font-medium hover:underline">
          Resend email
        </button>
      </p>
      <button onClick={onBackToForm} className="text-center text-[12px] text-gray-400 mt-2 hover:text-gray-600">
        Use a different email
      </button>
    </div>
  );
}