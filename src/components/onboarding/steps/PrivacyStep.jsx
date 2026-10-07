import React from "react";
import { Link } from "react-router-dom";
import { PrivacyIllustration } from "@/components/onboarding/OnboardingIllustrations";
import StepArt from "@/components/onboarding/StepArt";
import StepHeading from "@/components/onboarding/StepHeading";
import { DISCLAIMER_TEXT } from "@/lib/appInfo";

/**
 * Step 5 — consent, age gate and the plain-language data note.
 *
 * This is the one step that is longer than a phone screen at a large text size,
 * so it is also the one step that legitimately scrolls (the shell measures it and
 * enables scrolling only when it does not fit).
 */
export default function PrivacyStep({
  gdprConsented, setGdprConsented, birthdate, setBirthdate, ageConfirmed, setAgeConfirmed, minor,
}) {
  return (
    <div className="flex flex-col gap-[clamp(0.5rem,1.6vh,1rem)] py-2">
      <StepArt size="compact">
        <PrivacyIllustration />
      </StepArt>

      <StepHeading
        title="Your data stays yours."
        subtitle="Levli is a personal logbook. It doesn't replace your care team, and it never shares your journey without your say-so."
      />

      <div className="rounded-2xl border border-border bg-background p-3.5">
        <p className="text-sm font-semibold text-foreground">What Levli stores, and why</p>
        <ul className="mt-1.5 list-inside list-disc space-y-1 text-[13px] leading-relaxed text-muted-foreground">
          <li><span className="font-medium text-foreground">What:</span> what you log — doses, symptoms and side effects, weight, nutrition, journal entries and progress photos.</li>
          <li><span className="font-medium text-foreground">Where:</span> in your own account, in our encrypted cloud database. Only your sign-in can read it. It is never sold, never used for advertising, and never shared with another person unless you grant them caregiver access.</li>
          <li><span className="font-medium text-foreground">Why:</span> to show your history, trends and reports back to you. Nothing else.</li>
          <li><span className="font-medium text-foreground">Your control:</span> export everything as CSV or PDF, or delete your account and all of its data, from Settings at any time.</li>
        </ul>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-background p-3.5">
        <input
          type="checkbox"
          checked={gdprConsented}
          onChange={(e) => setGdprConsented(e.target.checked)}
          className="mt-0.5 h-6 w-6 flex-shrink-0 accent-[hsl(var(--action))]"
        />
        <span className="text-sm text-foreground">
          I consent to Levli processing my health data as described above and in the{" "}
          <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>.
        </span>
      </label>

      <div>
        <label htmlFor="onb-birthdate" className="mb-2 block text-sm font-semibold text-foreground">
          Date of birth
        </label>
        <input
          id="onb-birthdate"
          type="date"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          className="w-full min-h-[48px] rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground outline-none focus:border-primary [color-scheme:light] dark:[color-scheme:dark]"
        />
      </div>

      {minor ? (
        <div className="rounded-2xl border border-destructive bg-background p-3.5">
          <p className="text-sm font-semibold text-foreground">Levli is for adults aged 18 and over.</p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            The date of birth entered is under 18, so Levli can't be used for health tracking. Please check the date, or come back when you're 18.
          </p>
        </div>
      ) : (
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-background p-3.5">
          <input
            type="checkbox"
            checked={ageConfirmed}
            onChange={(e) => setAgeConfirmed(e.target.checked)}
            className="mt-0.5 h-6 w-6 flex-shrink-0 accent-[hsl(var(--action))]"
          />
          <span className="text-sm text-foreground">I confirm that I am 18 years or older.</span>
        </label>
      )}

      {!minor && !(gdprConsented && birthdate && ageConfirmed) && (
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Add your date of birth and tick both confirmations to continue.
        </p>
      )}

      <p className="text-[13px] leading-relaxed text-muted-foreground">
        {DISCLAIMER_TEXT} Read the{" "}
        <Link to="/medical-disclaimer" className="text-primary underline">full medical disclaimer</Link>.
      </p>
    </div>
  );
}