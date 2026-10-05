import React from "react";
import { SPLASH_SPARKLES } from "@/lib/splashTiming";

/** A four-point sparkle, drawn as a single vector path. */
const SPARKLE = "M12 0 C13.5 6.8 17.2 10.5 24 12 C17.2 13.5 13.5 17.2 12 24 C10.5 17.2 6.8 13.5 0 12 C6.8 10.5 10.5 6.8 12 0 Z";

/** The three accents around the mascot, each with its own colour and delay. */
const ACCENTS = ["amber", "teal", "periwinkle"];

export default function SplashSparkles() {
  return (
    <>
      {ACCENTS.map((accent, index) => (
        <span
          key={accent}
          aria-hidden="true"
          className={`splash__sparkle splash__sparkle--${accent}`}
          style={{
            "--sp-pop-delay": `${SPLASH_SPARKLES[index].pop}ms`,
            "--sp-twinkle-delay": `${SPLASH_SPARKLES[index].twinkle}ms`,
          }}
        >
          <svg viewBox="0 0 24 24"><path d={SPARKLE} /></svg>
        </span>
      ))}
    </>
  );
}