import React from "react";
import GoogleIcon from "@/components/GoogleIcon";
import AppleIcon from "@/components/AppleIcon";
import { sound } from "@/lib/sounds";

/**
 * The divider and the two provider options, sitting in the account card between
 * the password field and the create-account button.
 *
 * The divider is the login screen's: a hairline with the word resting on it, its
 * mask painted in the card's own grey so the line appears to break around it.
 *
 * Both providers send the person away to their own page and bring them back, so
 * the caller records everything answered so far on the device first (see
 * src/lib/onboardingDraft.js). Apple sits beside Google because Levli offers a
 * third-party sign-in (App Store guideline 4.8).
 *
 * Each is a full-height button carrying its mark alone — the wording lives in
 * the screen-reader label — and each keeps its own brand's ground: Google's mark
 * on white, Apple's on black.
 */
export default function SocialAuthButtons({ onProvider, disabled = false }) {
  const base =
    "flex h-12 flex-1 items-center justify-center rounded-xl transition-all active:scale-[0.98] disabled:opacity-60";

  return (
    <div className="w-full">
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-gray-100 px-3 text-gray-400">or</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          disabled={disabled}
          aria-label="Continue with Google"
          onClick={() => { sound.tap(); onProvider("google"); }}
          className={`${base} border border-gray-200 bg-white hover:border-gray-300`}
        >
          <GoogleIcon className="h-5 w-5" />
        </button>

        <button
          type="button"
          disabled={disabled}
          aria-label="Continue with Apple"
          onClick={() => { sound.tap(); onProvider("apple"); }}
          className={`${base} bg-black text-white hover:bg-gray-900`}
        >
          <AppleIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}