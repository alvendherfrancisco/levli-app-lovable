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
// ── Always in step with the animation ───────────────────────────────────────
// A sound here belongs to one frame of the animation, and is only ever played
// while that frame is still ahead of us. Whenever audio starts — at launch, or
// a moment later — each beat is placed on the animation's own clock, so what is
// heard is what is on screen. A beat the animation has already passed is
// skipped, never replayed late, and once the splash is gone nothing is left
// waiting: a later tap on a button can never set the droplet's sounds off.
//
// ── When audio may start ────────────────────────────────────────────────────
// A browser never lets a page start sound on its own: audio may begin only
// once the person has really tapped or clicked the page, unless the browser
// itself says otherwise (an installed app, or a site it considers well used).
// So the sequence asks twice and takes the first answer:
//
//   1. Straight away at launch — plays from the very first frame wherever the
//      browser allows it, and on the sign-out splash.
//   2. On the first real tap during the splash: a finger touching down does not
//      count to a browser, only the lift (pointerup / touchend), a click or a
//      key does. The beats still ahead then play, in step with the animation.
// ─────────────────────────────────────────────────────────────────────────────

import { VOLUME, getSoundPreference, playNotes, resumeContext } from "@/lib/audioEngine";
import { SPLASH_TIMING, SPLASH_SPARKLES } from "@/lib/splashTiming";

/** One note per sparkle, in the order they pop. */
const SPARKLE_TONES = [1046.5, 1174.7, 1318.5];

/** The events a browser accepts as the person really using the page. */
const ACTIVATION_EVENTS = ["pointerup", "touchend", "click", "keydown"];

/** The animation's timings are in milliseconds; notes are scheduled in seconds. */
const seconds = (ms) => ms / 1000;

/**
 * The droplet's moments, in order. Each carries the point in the sequence it
 * belongs at (in seconds from the splash appearing) and the notes that sound
 * there — a note's own `at` is its offset inside its moment.
 */
function moments() {
  const landing = seconds(SPLASH_TIMING.drop * 0.55); // the frame the droplet squashes down on
  const ring = seconds(SPLASH_TIMING.rippleDelay);
  const face = seconds(SPLASH_TIMING.smileDelay);

  return [
    {
      at: landing,
      notes: [
        // One soft note sliding down the way a drop of water lands, with a
        // brief high tip on the contact itself.
        { freq: 880, to: 420, dur: 0.22, peak: VOLUME * 0.8 },
        { freq: 1320, dur: 0.05, peak: VOLUME * 0.25 },
      ],
    },
    {
      at: ring,
      notes: [
        // Two low, rounded notes swelling up and settling again.
        { freq: 190, to: 250, dur: 0.34, peak: VOLUME * 0.45 },
        { freq: 380, to: 320, at: 0.04, dur: 0.28, peak: VOLUME * 0.3 },
      ],
    },
    {
      at: face,
      notes: [
        // A warm rising pair a major third apart — a greeting, not a signal,
        // and low enough not to sound childish.
        { freq: 587.33, dur: 0.12, peak: VOLUME * 0.6 },
        { freq: 783.99, at: 0.09, dur: 0.16, peak: VOLUME * 0.55 },
      ],
    },
    // One very short, very quiet bell with each sparkle.
    ...SPARKLE_TONES.map((freq, index) => ({
      at: seconds(SPLASH_SPARKLES[index].pop),
      notes: [{ freq, dur: 0.15, peak: VOLUME * 0.25 }],
    })),
  ];
}

/** The beats still ahead of `elapsed` seconds, retimed to play from now. */
function stillAhead(sequence, elapsed) {
  const notes = [];
  sequence.forEach((moment) => {
    if (moment.at < elapsed) return;
    moment.notes.forEach((note) => {
      notes.push({ ...note, at: moment.at + (note.at || 0) - elapsed });
    });
  });
  return notes;
}

/**
 * Plays the droplet's sequence, in step with the animation. Does nothing when
 * sounds are switched off, or when the browser has no Web Audio at all.
 *
 * Returns a stop function, which the splash runs when the screen goes: from
 * then on nothing is listened for and nothing can play.
 */
export function playSplashSounds() {
  if (!getSoundPreference()) return () => {};

  const sequence = moments();
  const startedAt = performance.now();
  let finished = false;

  const stop = () => {
    finished = true;
    ACTIVATION_EVENTS.forEach((type) => window.removeEventListener(type, attempt, true));
  };

  /** Plays once, from wherever the animation has got to. */
  const playFrom = (ctx) => {
    if (finished || !ctx) return;
    const remaining = stillAhead(sequence, (performance.now() - startedAt) / 1000);
    if (!remaining.length) return; // the animation is past every beat
    stop();
    playNotes(ctx, remaining);
  };

  function attempt() {
    resumeContext().then(playFrom);
  }

  // 1. Straight away, for a launch the browser allows sound on.
  attempt();

  // 2. Otherwise on the first real tap, and on every one after it until audio
  //    has started. Listening is kept until sound has actually played, because
  //    the first touch of a finger is not yet a tap as far as a browser goes.
  ACTIVATION_EVENTS.forEach((type) => window.addEventListener(type, attempt, true));

  return stop;
}