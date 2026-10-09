import React, { useEffect, useState } from "react";
import { MailCheck } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { sound } from "@/lib/sounds";
import { VERIFICATION_CODE_LENGTH } from "@/lib/accountValidation";
import {
  ERROR_TEXT, HEADING, HEAD_BLOCK, ICON_CIRCLE_LG, SUBTITLE,
} from "@/lib/uiStyles";

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

// The two ways on from here, under the boxes: one size, indigo, medium weight,
// and no underline at all — not even the hover one, which on a phone flashes
// for a moment after every tap.
const LINK_PLAIN = "font-medium text-indigo-600";

/**
 * The verification half of the email path.
 *
 * Signing up sends a code to the address given; entering it here is what turns
 * the account into a session. The screen offers a fresh code, and a way back to
 * the form with everything already typed still in place.
 *
 * The icon, the heading and the six boxes are one group, held in the middle of
 * the space between the progress bar and the pinned CTA — the same position the
 * artwork and heading take on every other step, so no screen ends in empty
 * space. The button itself is not drawn here: it is the shell's own, so it is
 * pinned above the home indicator exactly like Next (see OnboardingScreen).
 */
export default function VerifyEmailStep({
  email, code, onCodeChange, onResend, onBackToForm, error, notice,
}) {
  const [cooldown, setCooldown] = useState(0);

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
    <div className="flex flex-col items-center">
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
        maxLength={VERIFICATION_CODE_LENGTH}
        value={code}
        onChange={onCodeChange}
        autoFocus
        containerClassName="w-full"
      >
        <InputOTPGroup className="flex w-full items-center justify-center gap-1.5">
          {Array.from({ length: VERIFICATION_CODE_LENGTH }).map((_, i) => (
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

      {/* Directly under the boxes, centred, part of the same group: ask for
          another code, or go back and use a different address. */}
      <div className="mt-6 flex w-full flex-col items-center gap-4">
        <p className="text-center text-[15px] text-gray-500">
          Didn't get it?{" "}
          {cooldown > 0 ? (
            <span className="font-medium text-indigo-400">Resend in {cooldown}s</span>
          ) : (
            <button type="button" onClick={askForAnother} className={LINK_PLAIN}>
              Resend email
            </button>
          )}
        </p>
        <button
          type="button"
          onClick={() => { sound.tap(); onBackToForm(); }}
          className={`${LINK_PLAIN} text-[15px]`}
        >
          Use a different email
        </button>
      </div>
    </div>
  );
}