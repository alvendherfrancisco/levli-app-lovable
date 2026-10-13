import React from "react";
import GoogleIcon from "@/components/GoogleIcon";
import AppleIcon from "@/components/AppleIcon";
import { AUTH_APPLE_BTN, AUTH_DIVIDER_LINE, AUTH_DIVIDER_TEXT, AUTH_PROVIDER_BTN } from "@/lib/authStyles";
import { sound } from "@/lib/sounds";

/**
 * The two provider options, sitting inside the account card below its two
 * fields: an "OR" divider, then Google and Apple as logo-only round buttons
 * side by side.
 *
 * Both send the person away to the provider's own page and bring them back, so
 * the caller records everything answered so far on the device first (see
 * src/lib/onboardingDraft.js). Apple sits beside Google because Levli offers a
 * third-party sign-in (App Store guideline 4.8).
 *
 * With no label beside them, each mark sits in the middle of its own 56pt
 * circle — the whole circle is the touch target — and the wording lives in the
 * screen-reader label. Each keeps its own brand's ground: Google's mark on the
 * card's surface, Apple's on the inverse of it.
 *
 * Every colour here is the flow's own token (see src/lib/authStyles.js), so both
 * marks, the hairline and the word follow the device's light/dark setting on
 * every screen that draws them — the two account cards and onboarding's account
 * step are the same row. Google keeps its own brand mark either way; Apple's
 * circle turns white with a black mark on a dark surface.
 */
export default function SocialAuthButtons({ onProvider, disabled = false, hideDivider = false }) {
  const circle =
    "flex h-14 w-14 items-center justify-center rounded-full transition-all active:scale-95 disabled:opacity-60";

  return (
    <div className="w-full">
      {/* The divider, drawn the way the login screen draws it: a hairline the
          full width of the card, with the word sitting in a gap on the card's
          own surface. */}
      <div className={hideDivider ? "hidden" : "relative my-5"}>
        <div className="absolute inset-0 flex items-center">
          <div className={AUTH_DIVIDER_LINE} />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className={AUTH_DIVIDER_TEXT}>or</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          disabled={disabled}
          aria-label="Continue with Google"
          onClick={() => { sound.tap(); onProvider("google"); }}
          className={`${circle} ${AUTH_PROVIDER_BTN}`}
        >
          <GoogleIcon className="h-6 w-6" />
        </button>

        <button
          type="button"
          disabled={disabled}
          aria-label="Continue with Apple"
          onClick={() => { sound.tap(); onProvider("apple"); }}
          className={`${circle} ${AUTH_APPLE_BTN}`}
        >
          <AppleIcon className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}