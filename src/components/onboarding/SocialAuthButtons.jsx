import React from "react";
import GoogleIcon from "@/components/GoogleIcon";
import AppleIcon from "@/components/AppleIcon";
import { sound } from "@/lib/sounds";

/**
 * The two provider options, sitting below the create-account button: an "OR"
 * divider, then Google and Apple as logo-only round buttons side by side.
 *
 * Both send the person away to the provider's own page and bring them back, so
 * the caller records everything answered so far on the device first (see
 * src/lib/onboardingDraft.js). Apple sits beside Google because Levli offers a
 * third-party sign-in (App Store guideline 4.8).
 *
 * With no label beside them, each mark sits in the middle of its own 56pt
 * circle — the whole circle is the touch target — and the wording lives in the
 * screen-reader label. Each keeps its own brand's ground: Google's mark on
 * white, Apple's on black.
 */
export default function SocialAuthButtons({ onProvider, disabled = false }) {
  const circle =
    "flex h-14 w-14 items-center justify-center rounded-full transition-all active:scale-95 disabled:opacity-60";

  return (
    <div className="w-full">
      {/* 20pt of air above and below the word, with the lines running the full
          width of the form. */}
      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-gray-200" />
        <span className="text-[12px] font-semibold tracking-wide text-gray-400">OR</span>
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          disabled={disabled}
          aria-label="Continue with Google"
          onClick={() => { sound.tap(); onProvider("google"); }}
          className={`${circle} border border-gray-200 bg-white hover:border-gray-300`}
        >
          <GoogleIcon className="h-6 w-6" />
        </button>

        <button
          type="button"
          disabled={disabled}
          aria-label="Continue with Apple"
          onClick={() => { sound.tap(); onProvider("apple"); }}
          className={`${circle} bg-black text-white hover:bg-gray-900`}
        >
          <AppleIcon className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}