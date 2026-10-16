import React from "react";

/**
 * The fade both full-page Premium locks settle into.
 *
 * Nothing over the top two thirds of the page behind the lock, then a light tint
 * arriving through the last third, and a short stretch at the very foot that settles
 * into the same tint's own colour: the sample page behind the lock is longer than the
 * screen and is clipped at the bottom edge, and that last stretch is what keeps the
 * cut from being seen.
 *
 * One component for both screens (see ReportLockView and InsightsLockView), so the
 * Report lock and the Insights lock settle into the same colour at the same strength,
 * the two read as one design, and tuning the tint is one edit rather than two.
 *
 * The tint is deliberately light — a lavender in light mode, a deep indigo in dark
 * mode, and well held back in both: what is behind it is meant to stay readable,
 * because the sample page is what says what Premium opens. Only the last third is
 * touched, so everything above it is the page as it is.
 *
 * It is drawn as a layer, not a wrapper: both callers hand it a positioned box
 * exactly as tall as the area under their header, and it fills that box.
 */
export default function PremiumLockFade() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent via-white/10 to-indigo-50/40 dark:via-indigo-950/10 dark:to-indigo-950/40"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-indigo-50/55 dark:to-indigo-950/55"
      />
    </>
  );
}