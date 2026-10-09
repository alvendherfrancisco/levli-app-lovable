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
// A browser never lets a page start sound on its own: audio may begin only once
// the person has touched the page, unless the browser itself says otherwise (an
// installed app, or a site it considers well used). Nothing in the app can talk
// it round, so the sequence asks twice and takes the first answer:
//
//   1. Straight away at launch — how it plays on a launch the browser allows,
//      and on the sign-out splash, where the page has already been in use.
//   2. On the first touch of the splash. The sound still follows the mascot:
//      the beats that have not gone by play then, and if the animation has
//      already finished, the droplet answers with its own voice — its landing
//      and its ring.
//
// Whichever comes first is the one that plays, and once the splash goes nothing
// is listened for any more.
// ─────────────────────────────────────────────────────────────────────────────

import { VOLUME, getSoundPreference, playNotes, resumeContext } from "@/lib/audioEngine";
import { SPLASH_TIMING, SPLASH_SPARKLES } from "@/lib/splashTiming";

/** One note per sparkle, in the order they pop. */
const SPARKLE_TONES = [1046.5, 1174.7, 1318.5];

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
function stillAhead(moments, elapsed) {
  const notes = [];
  moments.forEach((moment) => {
    if (moment.at < elapsed) return;
    moment.notes.forEach((note) => {
      notes.push({ ...note, at: moment.at + (note.at || 0) - elapsed });
    });
  });
  return notes;
}

/**
 * The droplet's own voice — its landing and its ring — retimed to play from
 * now, with the distance between the two kept. This is what the droplet says
 * when the person touches it after the composition has finished: the two sounds
 * that are simply water, and nothing that belonged to a moment already gone.
 */
function dropletVoice(moments) {
  const [landing, ring] = moments;
  return [
    ...landing.notes.map((note) => ({ ...note, at: note.at || 0 })),
    ...ring.notes.map((note) => ({ ...note, at: ring.at - landing.at + (note.at || 0) })),
  ];
}

/**
 * Plays the droplet's sequence. Does nothing when sounds are switched off, or
 * when the browser has no Web Audio at all.
 *
 * Returns a stop function, which the splash runs when the screen goes so that
 * nothing is listened for afterwards.
 */
export function playSplashSounds() {
  if (!getSoundPreference()) return () => {};

  const sequence = moments();
  const startedAt = Date.now();
  let played = false;

  /** Plays once: what is left of the composition, or the droplet's own voice. */
  const playFrom = (ctx) => {
    if (played || !ctx) return;
    played = true;
    const elapsed = (Date.now() - startedAt) / 1000;
    const remaining = stillAhead(sequence, elapsed);
    playNotes(ctx, remaining.length ? remaining : dropletVoice(sequence));
  };

  // 1. Straight away, for a launch the browser allows sound on.
  resumeContext().then(playFrom);

  // 2. Otherwise the person's first touch is what starts audio, and it is also
  //    what asks the droplet to speak.
  const stopListening = () => {
    window.removeEventListener("pointerdown", onFirstTouch);
    window.removeEventListener("touchstart", onFirstTouch);
  };
  function onFirstTouch() {
    stopListening();
    resumeContext().then(playFrom);
  }
  window.addEventListener("pointerdown", onFirstTouch);
  window.addEventListener("touchstart", onFirstTouch);

  return stopListening;
}