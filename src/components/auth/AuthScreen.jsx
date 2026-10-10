import React from "react";
import AmbientBackground from "@/components/onboarding/AmbientBackground";
import LevliLogo from "@/components/LevliLogo";
import { AUTH_HEADING, AUTH_SCREEN, AUTH_SUBTITLE } from "@/lib/authStyles";

/**
 * The sign-in screens' shell: Login and the standalone Create account screen.
 *
 * Both draw the same page — the ambient background, the droplet, the greeting,
 * then whatever the caller puts under it (the card, and the plain lines that
 * follow) — so the two can never drift apart.
 *
 * The page follows the device's light/dark setting. Its surface covers the whole
 * screen, from the top edge to the bottom, so the status bar area and the home
 * indicator area show the page itself and never a strip of their own. The top and
 * bottom safe-area insets are added to the page's own breathing room, so the
 * greeting is never under the status bar and the last line is never under the
 * home indicator, on a notched phone as much as on an older one.
 *
 * A short screen sits centred in the space the safe areas leave; a taller one
 * scrolls from its top, so the greeting is never pushed off to make room.
 */
export default function AuthScreen({ title, subtitle, children }) {
  return (
    <div className={`${AUTH_SCREEN} relative min-h-[100dvh] overflow-x-hidden bg-auth-page`}>
      <AmbientBackground themed />
      <div className="auth-page-bottom relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col px-5 pt-[calc(2rem_+_env(safe-area-inset-top,0px))] sm:px-6 sm:pt-[calc(3rem_+_env(safe-area-inset-top,0px))]">
        <div className="my-auto w-full py-6">
          {/* The brand mark sits above the title with a clear gap. Nothing here
              sets a height or hides overflow, so a taller mark is never cut. */}
          <div className="mb-6 flex justify-center">
            <LevliLogo size={88} lighterOnDark />
          </div>

          <div className="mb-6 text-center">
            <h1 className={AUTH_HEADING}>{title}</h1>
            <p className={`${AUTH_SUBTITLE} mt-2`}>{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}