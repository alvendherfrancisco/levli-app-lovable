import React from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { CTA_READY, CTA_WAITING } from "@/components/onboarding/formStyles";
import { sound } from "@/lib/sounds";

/**
 * The account step's footer: what is still missing, the Create account button,
 * the legal line and the way back to signing in.
 *
 * It is pinned to the bottom of the step, so it never moves while the fields
 * scroll behind it, and the soft fade above it is what stops a field vanishing
 * under it in a hard line. Its own padding carries the home-indicator inset
 * rather than relying on it, so the Log in link always sits clear of the bar.
 */
export default function AccountFooter({ blocker = "", message = "", loading = false }) {
  const ready = !blocker && !loading;

  return (
    <div className="sticky bottom-0 z-10 -mx-5 sm:-mx-6 -mb-4 mt-6 pt-7 px-5 sm:px-6 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] bg-white/90 backdrop-blur-sm">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-7 h-7 bg-gradient-to-t from-white/95 to-transparent"
      />
      <div className="relative w-full max-w-[400px] mx-auto flex flex-col items-center">
        {message && !loading && (
          <p role="status" className="text-[13.5px] font-medium text-orange-700 text-center mb-2.5 px-2 leading-snug">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={!ready}
          onClick={() => sound.tap()}
          className={ready ? CTA_READY : CTA_WAITING}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              Creating account…
            </span>
          ) : (
            "Create account"
          )}
        </button>

        <p className="text-center text-[13px] text-gray-500 mt-3.5 px-2 leading-relaxed">
          By creating an account you agree to our{" "}
          <Link to="/terms" className="text-indigo-600 font-medium">Terms of Service</Link>{" "}
          and{" "}
          <Link to="/privacy" className="text-indigo-600 font-medium">Privacy Policy</Link>.
        </p>

        <p className="text-center text-[14px] text-gray-500 mt-1">
          Already have an account?{" "}
          <Link to="/login" className="inline-flex items-center min-h-[44px] px-1 text-indigo-600 font-semibold">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}