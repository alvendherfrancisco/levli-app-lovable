/**
 * Launch splash — timings, in milliseconds.
 *
 * One place to tune the sequence. The values reach the CSS as the --sp-*
 * variables below (set on the splash root) and drive the JS that decides when
 * the splash may leave. The colours sit beside the styles as the named
 * --splash-* tokens in the "Launch splash" block of src/index.css.
 */
export const SPLASH_TIMING = {
  // 0.0–0.6 s — the wash fades in while the droplet drops in and settles.
  fadeIn: 600,
  drop: 600,

  // 0.6–1.0 s — a soft ring expands from under the droplet.
  rippleDelay: 600,
  ripple: 400,

  // 1.0–1.4 s — the eyes appear and blink once, then the smile curves in.
  eyesDelay: 1000,
  eyes: 230,
  smileDelay: 1235,
  smile: 160,

  // 1.2–1.8 s — three sparkles pop in, one after another, then twinkle.
  sparkleDelay: 1200,
  sparklePop: 260,
  sparkleStagger: 170,
  twinkle: 2400,
  twinkleGap: 140,

  // 1.5–2.0 s — the wordmark rises in; the tagline fades in after it.
  wordDelay: 1500,
  word: 420,
  tagDelay: 1770,
  tag: 240,

  // 2.0–2.5 s — a small happy bob, then the cross-fade into the app.
  bobDelay: 2000,
  bob: 500,

  // Keeps the droplet gently bobbing if startup runs longer than the sequence.
  bobLoop: 2600,

  // The cross-fade out, over the app.
  exit: 480,

  // "Reduce Motion": the static logo holds this long, then fades.
  reducedHold: 900,
};

const endOf = (start, duration) => start + duration;

/** The end of each step — the points the splash is allowed to leave on. */
export const SPLASH_STEPS = [
  endOf(0, SPLASH_TIMING.fadeIn),
  endOf(SPLASH_TIMING.rippleDelay, SPLASH_TIMING.ripple),
  Math.max(
    endOf(SPLASH_TIMING.eyesDelay, SPLASH_TIMING.eyes),
    endOf(SPLASH_TIMING.smileDelay, SPLASH_TIMING.smile),
  ),
  endOf(SPLASH_TIMING.sparkleDelay + 2 * SPLASH_TIMING.sparkleStagger, SPLASH_TIMING.sparklePop),
  SPLASH_TIMING.bobDelay,
  endOf(SPLASH_TIMING.bobDelay, SPLASH_TIMING.bob),
];

/** Pop-in and twinkle delay for each of the three sparkles. */
export const SPLASH_SPARKLES = [0, 1, 2].map((index) => {
  const pop = SPLASH_TIMING.sparkleDelay + index * SPLASH_TIMING.sparkleStagger;
  return { pop, twinkle: pop + SPLASH_TIMING.sparklePop + SPLASH_TIMING.twinkleGap };
});

/** The timings, handed to the stylesheet as custom properties. */
export const SPLASH_VARS = {
  "--sp-fade-in": `${SPLASH_TIMING.fadeIn}ms`,
  "--sp-drop": `${SPLASH_TIMING.drop}ms`,
  "--sp-ripple": `${SPLASH_TIMING.ripple}ms`,
  "--sp-ripple-delay": `${SPLASH_TIMING.rippleDelay}ms`,
  "--sp-eyes": `${SPLASH_TIMING.eyes}ms`,
  "--sp-eyes-delay": `${SPLASH_TIMING.eyesDelay}ms`,
  "--sp-smile": `${SPLASH_TIMING.smile}ms`,
  "--sp-smile-delay": `${SPLASH_TIMING.smileDelay}ms`,
  "--sp-sparkle": `${SPLASH_TIMING.sparklePop}ms`,
  "--sp-twinkle": `${SPLASH_TIMING.twinkle}ms`,
  "--sp-word": `${SPLASH_TIMING.word}ms`,
  "--sp-word-delay": `${SPLASH_TIMING.wordDelay}ms`,
  "--sp-tag": `${SPLASH_TIMING.tag}ms`,
  "--sp-tag-delay": `${SPLASH_TIMING.tagDelay}ms`,
  "--sp-bob": `${SPLASH_TIMING.bob}ms`,
  "--sp-bob-delay": `${SPLASH_TIMING.bobDelay}ms`,
  "--sp-bob-loop": `${SPLASH_TIMING.bobLoop}ms`,
  "--sp-exit": `${SPLASH_TIMING.exit}ms`,
};