// ─────────────────────────────────────────────────────────────────────────────
// SPLASH SOUNDS — the launch sequence, written to match the droplet.
//
// Soft, watery and rounded: a low plop as the droplet lands, a mellow swell as
// its ring spreads, a warm two-note hello when the face arrives, and three
// tiny, very quiet bells for the sparkles. Nothing in it repeats or pulses, no
// note has a square or sawtooth edge, and every one fades out on its own — so
// it reads as water settling rather than as a chime, an alarm or a notification.
//
// The cues sit on the animation's own timings (src/lib/splashTiming.js), so
// retiming the mascot retimes its sound with it.
//
// ── When it can be heard ────────────────────────────────────────────────────
// A page cannot start sound on its own: a browser allows audio only once the
// person has touched the page, unless the browser itself says otherwise (an
// installed app, a site it considers well used). So the sequence asks twice and
// takes the first answer, and either way it stays on the mascot's beats:
//
//   1. Straight away at launch — how it plays on a launch the browser allows,
//      and on the sign-out splash, where the page has been in use.
//   2. On the first tap, if it is still blocked. Only the beats that have not
//      gone by are played then, so what is heard is still in step with the
//      droplet rather than a heap of notes arriving at once.
// ─────────────────────────────────────────────────────────────────────────────

import { VOLUME, getSoundPreference, playNotes, resumeContext } from "@/lib/audioEngine";
import { SPLASH_TIMING, SPLASH_SPARKLES } from "@/lib/splashTiming";

/** One note per sparkle, in the order they pop. */
const SPARKLE_TONES = [1046.5, 1174.7, 1318.5];

/** The animation's timings are in milliseconds; notes are scheduled in seconds. */
const seconds = (ms) => ms / 1000;

/**
 * Every note of the sequence, each carrying the moment (in seconds from the
 * splash appearing) it belongs at.
 */
function sequence() {
  const land = seconds(SPLASH_TIMING.drop * 0.55); // the frame the droplet squashes down on
  const ripple = seconds(SPLASH_TIMING.rippleDelay);
  const smile = seconds(SPLASH_TIMING.smileDelay);
  const sparklePops = SPLASH_SPARKLES.map((sparkle) => seconds(sparkle.pop));

  return [
    // The landing: one soft note sliding down the way a drop of water lands,
    // with a brief high tip on the contact itself.
    { at: land, freq: 880, to: 420, dur: 0.22, peak: VOLUME * 0.8 },
    { at: land, freq: 1320, dur: 0.05, peak: VOLUME * 0.25 },

    // The ring: two low, rounded notes swelling up and settling again.
    { at: ripple, freq: 190, to: 250, dur: 0.34, peak: VOLUME * 0.45 },
    { at: ripple + 0.04, freq: 380, to: 320, dur: 0.28, peak: VOLUME * 0.3 },

    // The face: a warm rising pair a major third apart — a greeting, not a
    // signal, and low enough not to sound childish.
    { at: smile, freq: 587.33, dur: 0.12, peak: VOLUME * 0.6 },
    { at: smile + 0.09, freq: 783.99, dur: 0.16, peak: VOLUME * 0.55 },

    // The sparkles: three very short, very quiet bells, one with each sparkle.
    ...SPARKLE_TONES.map((freq, index) => ({
      at: sparklePops[index], freq, dur: 0.15, peak: VOLUME * 0.25,
    })),
  ];
}

/**
 * Plays the droplet's four moments. Does nothing when sounds are switched off,
 * or when the browser has no Web Audio at all.
 *
 * Returns a stop function, which the splash runs when the screen goes so that
 * nothing is listened for afterwards.
 */
export function playSplashSounds() {
  if (!getSoundPreference()) return () => {};

  const notes = sequence();
  const lastMoment = Math.max(...notes.map((n) => n.at));
  const startedAt = Date.now();
  let done = false;
  let timer = null;

  /** Schedules what is still ahead of the sequence's clock. Runs once. */
  const playFrom = (ctx) => {
    if (done || !ctx) return;
    done = true;
    const elapsed = (Date.now() - startedAt) / 1000;
    const due = notes.filter((note) => note.at >= elapsed);
    if (!due.length) return;
    playNotes(ctx, due.map((note) => ({ ...note, at: note.at - elapsed })));
  };

  // 1. Straight away, in case the browser allows sound here.
  resumeContext().then(playFrom);

  // 2. Otherwise the first tap is what unlocks audio, and the beats still to
  //    come play then. Nothing is listened for past the end of the sequence:
  //    after that the composition is still, and a sound arriving over the app
  //    would belong to nothing.
  const stopListening = () => {
    window.removeEventListener("pointerdown", onFirstTap);
    window.removeEventListener("touchstart", onFirstTap);
    clearTimeout(timer);
  };
  function onFirstTap() {
    stopListening();
    resumeContext().then(playFrom);
  }
  window.addEventListener("pointerdown", onFirstTap);
  window.addEventListener("touchstart", onFirstTap);
  timer = setTimeout(() => { done = true; stopListening(); }, lastMoment * 1000 + 120);

  return () => { done = true; stopListening(); };
}