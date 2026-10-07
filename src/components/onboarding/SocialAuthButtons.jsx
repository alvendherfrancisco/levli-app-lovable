import React from "react";
import GoogleIcon from "@/components/GoogleIcon";
import AppleIcon from "@/components/AppleIcon";
import { sound } from "@/lib/sounds";

/**
 * The two provider buttons and the divider that separates them from the email
 * form.
 *
 * Both send the person away to the provider's own page and bring them back, so
 * the caller records everything answered so far on the device first (see
 * src/lib/onboardingDraft.js). Apple sits beside Google because Levli offers a
 * third-party sign-in (App Store guideline 4.8).
 */
export default function SocialAuthButtons({ onProvider, disabled = false }) {
  const base =
    "w-full h-12 rounded-full text-[16px] font-semibold flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-60";

  return (
    <div className="flex flex-col gap-2.5">
      <button
        type="button"
        disabled={disabled}
        onClick={() => { sound.tap(); onProvider("google"); }}
        className={`${base} border-2 border-gray-200 bg-white text-gray-700 hover:border-gray-300`}
      >
        <GoogleIcon className="w-5 h-5" />
        Continue with Google
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => { sound.tap(); onProvider("apple"); }}
        className={`${base} bg-gray-900 text-white hover:bg-black`}
      >
        <AppleIcon className="w-5 h-5 -mt-0.5" />
        Continue with Apple
      </button>

      <div className="flex items-center gap-3 pt-1">
        <span className="flex-1 h-px bg-gray-200" />
        <span className="text-[11px] font-semibold tracking-wide text-gray-400">OR</span>
        <span className="flex-1 h-px bg-gray-200" />
      </div>
    </div>
  );
}