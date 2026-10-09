import React, { useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { sound } from "@/lib/sounds";
import {
  HEADING, HEAD_BLOCK, ICON_CIRCLE, LINK, NOTICE,
  PRIMARY_BTN, PRIMARY_BTN_OFF, PRIMARY_BTN_ON, SUBTITLE,
} from "@/lib/uiStyles";

/**
 * The verification half of the email path.
 *
 * Signing up sends a code to the address given; entering it here is what turns
 * the account into a session. The screen offers a fresh code, and a way back to
 * the form with everything already typed still in place.
 *
 * It is drawn on the same tokens as every other onboarding screen: the same
 * heading, the same subtitle, the same notice and the same primary button.
 */
export default function VerifyEmailStep({
  email, onVerify, onResend, onBackToForm, loading, error, notice,
}) {
  const [code, setCode] = useState("");
  const ready = code.length === 6 && !loading;

  return (
    <div className="flex flex-col items-center">
      <span className={`${ICON_CIRCLE} mb-3`}>
        <MailCheck size={20} strokeWidth={1.5} className="text-indigo-600" aria-hidden="true" />
      </span>

      <div className={HEAD_BLOCK}>
        <h1 className={HEADING}>Check your email</h1>
        <p className={`${SUBTITLE} break-words`}>
          We sent a 6-digit code to <span className="font-medium text-gray-700">{email}</span>.
          Enter it and your account is ready.
        </p>
      </div>

      {error && <p className={`${NOTICE} mb-3`}>{error}</p>}
      {notice && (
        <p className="mb-3 w-full rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-center text-[13px] leading-snug text-teal-700">
          {notice}
        </p>
      )}

      <div className="mb-4 flex justify-center">
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
      <div className="sticky bottom-0 z-10 w-full bg-white/85 pt-3 backdrop-blur-sm">
        <button
          onClick={() => { sound.tap(); onVerify(code); }}
          disabled={!ready}
          className={`${PRIMARY_BTN} ${ready ? PRIMARY_BTN_ON : PRIMARY_BTN_OFF}`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
            </span>
          ) : "Verify and continue"}
        </button>
      </div>

      <p className="mt-4 text-center text-[15px] text-gray-500">
        Didn't get it?{" "}
        <button onClick={() => { sound.tap(); onResend(); }} className={LINK}>
          Resend email
        </button>
      </p>
      <button
        onClick={() => { sound.tap(); onBackToForm(); }}
        className="mt-3 text-center text-[13px] text-gray-400 hover:text-gray-600"
      >
        Use a different email
      </button>
    </div>
  );
}