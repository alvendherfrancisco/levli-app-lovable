import React, { useEffect, useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { sound } from "@/lib/sounds";
import {
  ERROR_TEXT, HEADING, HEAD_BLOCK, ICON_CIRCLE_LG, LINK,
  PRIMARY_BTN, PRIMARY_BTN_OFF, PRIMARY_BTN_ON, SUBTITLE,
} from "@/lib/uiStyles";

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 30; // seconds, so a code is never asked for twice at once

// One code box: 56px tall, up to 48px wide, a 12px corner, white with a
// hairline grey border. Six of them share the row with equal gaps and stay
// centred, so they never crowd the screen's margin on a narrow phone.
const BOX =
  "h-14 w-full max-w-[48px] flex-1 rounded-xl border bg-white text-[22px] font-normal text-gray-900 shadow-none first:rounded-l-xl last:rounded-r-xl";
const BOX_IDLE = "border-gray-200";
// Focused: the same hairline border, turned indigo, with a soft indigo glow.
const BOX_ON = "border-indigo-500 shadow-[0_0_0_4px_rgba(79,70,229,0.12)]";
// Refused: the same hairline border, softened to red.
const BOX_ERROR = "border-red-300 shadow-[0_0_0_4px_rgba(239,68,68,0.10)]";

/**
 * The verification half of the email path.
 *
 * Signing up sends a code to the address given; entering it here is what turns
 * the account into a session. The screen offers a fresh code, and a way back to
 * the form with everything already typed still in place.
 *
 * It is drawn on the same tokens as every other onboarding screen: the same
 * heading, the same subtitle, the same code boxes and the same primary button,
 * starting at the top of the step area where the other screens' artwork starts.
 */
export default function VerifyEmailStep({
  email, onVerify, onResend, onBackToForm, loading, error, notice,
}) {
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const ready = code.length === CODE_LENGTH && !loading;

  // One tick a second while the countdown runs, and nothing once it is done.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const askForAnother = () => {
    if (cooldown > 0) return;
    sound.tap();
    onResend();
    setCooldown(RESEND_COOLDOWN);
  };

  return (
    // .onb-cta carries the bottom breathing room, so the last link stays clear
    // of the home indicator now that the shell's own CTA is hidden here.
    <div className="onb-cta flex flex-col">
      {/* The icon takes the place the illustrations take on every other step:
          the top of the step, centred, with the same gap below it. */}
      <div className="mb-4 flex justify-center">
        <span className={ICON_CIRCLE_LG}>
          <MailCheck size={32} strokeWidth={1.5} className="text-indigo-600" aria-hidden="true" />
        </span>
      </div>

      <div className={HEAD_BLOCK}>
        <h1 className={HEADING}>Check your email</h1>
        <p className={SUBTITLE}>We sent a 6-digit code to</p>
        {/* The address on a line of its own, so it never wraps mid-word. */}
        <p className="break-all text-[15px] font-medium text-gray-900">{email}</p>
      </div>

      {notice && (
        <p className="mb-4 w-full rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-center text-[13px] leading-snug text-teal-700">
          {notice}
        </p>
      )}

      <InputOTP
        maxLength={CODE_LENGTH}
        value={code}
        onChange={setCode}
        autoFocus
        containerClassName="w-full"
      >
        <InputOTPGroup className="flex w-full items-center justify-center gap-1.5">
          {Array.from({ length: CODE_LENGTH }).map((_, i) => (
            <InputOTPSlot
              key={i}
              index={i}
              className={`${BOX} ${error ? BOX_ERROR : BOX_IDLE}`}
              activeClassName={BOX_ON}
            />
          ))}
        </InputOTPGroup>
      </InputOTP>

      {/* What went wrong, said next to the boxes it is about. */}
      {error && (
        <p className={`${ERROR_TEXT} mt-2 text-center`} role="alert">
          {error}
        </p>
      )}

      <button
        onClick={() => { sound.tap(); onVerify(code); }}
        disabled={!ready}
        className={`${PRIMARY_BTN} mt-6 ${ready ? PRIMARY_BTN_ON : PRIMARY_BTN_OFF}`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
          </span>
        ) : "Verify and continue"}
      </button>

      <p className="mt-4 text-center text-[15px] text-gray-500">
        Didn't get it?{" "}
        {cooldown > 0 ? (
          <span className="font-medium text-indigo-400">Resend in {cooldown}s</span>
        ) : (
          <button onClick={askForAnother} className={LINK}>
            Resend email
          </button>
        )}
      </p>
      <button
        onClick={() => { sound.tap(); onBackToForm(); }}
        className={`${LINK} mt-4 text-[15px]`}
      >
        Use a different email
      </button>
    </div>
  );
}