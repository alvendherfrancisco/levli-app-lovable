import React from "react";

/**
 * The heading of an onboarding step: one short line saying what the step is for,
 * and a supporting line in muted text. Both follow the theme, and the sizes are
 * set so the type stays readable rather than being shrunk to make a screen fit.
 */
export default function StepHeading({ title, subtitle, className = "" }) {
  return (
    <div className={`text-center ${className}`}>
      <h1 className="text-[22px] font-bold leading-tight text-foreground sm:text-[26px]">{title}</h1>
      {subtitle && (
        <p className="mx-auto mt-1.5 max-w-[34ch] text-[15px] leading-snug text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}