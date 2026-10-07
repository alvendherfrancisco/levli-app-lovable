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
// The browser will not start audio before a gesture, so a cold launch is silent
// by its rules: the sequence plays only on a context the page has already
// unlocked, which is the sign-out splash — the same screen, in a document the
// person has been using. Nothing is queued for later, so a launch that had to
// stay quiet never fires its sounds over the app afterwards.
// ─────────────────────────────────────────────────────────────────────────────

import { VOLUME, getSoundPreference, liveContext, playNotes } from "@/lib/audioEngine";
import { SPLASH_TIMING, SPLASH_SPARKLES } from "@/lib/splashTiming";

/** One note per sparkle, in the order they pop. */
const SPARKLE_TONES = [1046.5, 1174.7, 1318.5];

/** The animation's timings are in milliseconds; notes are scheduled in seconds. */
const seconds = (ms) => ms / 1000;

/**
 * Plays the droplet's four moments. Does nothing when sounds are switched off,
 * when the browser has not unlocked audio for this page, or when it has no Web
 * Audio at all.
 */
export function playSplashSounds() {
  if (!getSoundPreference()) return;
  const ctx = liveContext();
  if (!ctx) return;

  // The frame the droplet squashes down on, the ring spreading out from under
  // it, the face arriving, and each sparkle popping in.
  const land = seconds(SPLASH_TIMING.drop * 0.55);
  const ripple = seconds(SPLASH_TIMING.rippleDelay);
  const smile = seconds(SPLASH_TIMING.smileDelay);
  const sparkles = SPLASH_SPARKLES.map((sparkle) => seconds(sparkle.pop));

  playNotes(ctx, [
    // The landing: one soft note sliding down the way a drop of water lands,
    // with a brief high tip on the contact itself.
    { freq: 880, to: 420, at: land, dur: 0.22, peak: VOLUME * 0.8 },
    { freq: 1320, at: land, dur: 0.05, peak: VOLUME * 0.25 },

    // The ring: two low, rounded notes swelling up and settling again.
    { freq: 190, to: 250, at: ripple, dur: 0.34, peak: VOLUME * 0.45 },
    { freq: 380, to: 320, at: ripple + 0.04, dur: 0.28, peak: VOLUME * 0.3 },

    // The face: a warm rising pair a major third apart — a greeting, not a
    // signal, and low enough not to sound childish.
    { freq: 587.33, at: smile, dur: 0.12, peak: VOLUME * 0.6 },
    { freq: 783.99, at: smile + 0.09, dur: 0.16, peak: VOLUME * 0.55 },

    // The sparkles: three very short, very quiet bells, one with each sparkle.
    ...SPARKLE_TONES.map((freq, index) => ({
      freq,
      at: sparkles[index],
      dur: 0.15,
      peak: VOLUME * 0.25,
    })),
  ]);
}