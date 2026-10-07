import React from "react";

/**
 * The stage an onboarding step's illustration sits in.
 *
 * The drawing gets whatever vertical space is left over and shrinks inside it,
 * so it can never push the heading or the button off the screen. On a genuinely
 * short screen (a small phone in landscape, or a very small phone) the stage
 * steps aside completely: the words and the button are what must always fit.
 */
export default function StepArt({ children, className = "", size = "fill" }) {
  // One literal branch per size, so the class that wins is always the one meant.
  const box =
    size === "hero" ? "h-[28vh] min-h-[104px] max-h-[240px]"
    : size === "compact" ? "h-[16vh] min-h-[84px] max-h-[150px]"
    : "flex-1 min-h-0";
  return (
    <div
      className={`hidden items-center justify-center [@media(min-height:620px)]:flex ${box} ${className}`}
    >
      {children}
    </div>
  );
}