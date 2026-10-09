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
 *
 * They are drawn to the same measurements as the fields below them — the same
 * width, the same height, the same corner radius — with the mark in a fixed 24pt
 * slot and the label centred beside it, so neither button looks like a smaller
 * thing sitting next to the form.
 */
export default function SocialAuthButtons({ onProvider, disabled = false }) {
  const base =
    "w-full min-h-[56px] rounded-xl px-5 text-[16px] font-semibold flex items-center justify-center gap-3 text-center transition-all active:scale-[0.98] disabled:opacity-60";

  return (
    <div className="flex w-full flex-col gap-3">
      <button
        type="button"
        disabled={disabled}
        aria-label="Continue with Google"
        onClick={() => { sound.tap(); onProvider("google"); }}
        className={`${base} border border-gray-200 bg-white text-gray-700 hover:border-gray-300`}
      >
        {/* A fixed slot: the mark keeps its place, and never shrinks the label. */}
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
          <GoogleIcon className="h-6 w-6" />
        </span>
        <span className="min-w-0">Continue with Google</span>
      </button>

      <button
        type="button"
        disabled={disabled}
        aria-label="Continue with Apple"
        onClick={() => { sound.tap(); onProvider("apple"); }}
        className={`${base} bg-black text-white hover:bg-gray-900`}
      >
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
          <AppleIcon className="h-6 w-6" />
        </span>
        <span className="min-w-0">Continue with Apple</span>
      </button>

      {/* 20pt of air above and below, from the button gap plus its own margin,
          and lines that run the full width of the form. */}
      <div className="my-2 flex items-center gap-3">
        <span className="h-px flex-1 bg-gray-200" />
        <span className="text-[12px] font-semibold tracking-wide text-gray-400">OR</span>
        <span className="h-px flex-1 bg-gray-200" />
      </div>
    </div>
  );
}