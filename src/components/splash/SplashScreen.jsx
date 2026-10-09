import React, { useEffect, useRef, useState } from "react";
import { SPLASH_TIMING, SPLASH_STEPS, SPLASH_VARS } from "@/lib/splashTiming";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import useLiveDarkTheme from "@/hooks/useLiveDarkTheme";
import SplashDroplet from "@/components/splash/SplashDroplet";
import SplashSparkles from "@/components/splash/SplashSparkles";
import { playSplashSounds } from "@/lib/splashSounds";

/**
 * The Levli launch splash.
 *
 * It plays its own sequence in full, and the app is routed to only once that
 * sequence has finished and the splash has cross-faded away — so Home, or
 * Login, can never arrive on top of a splash that is still animating. If
 * startup runs longer than the sequence, the droplet keeps bobbing gently (and
 * the sparkles keep twinkling) until the app is ready.
 *
 * With "Reduce Motion" the same composition is shown as a single fade — the
 * static logo — and nothing moves, so nothing sounds either.
 *
 * A sign-out borrows the same screen: the sequence plays through in full, then
 * onSequenceEnd tells the app to leave for the login screen. Playing it before
 * the navigation is what keeps it animated — a document that is already leaving
 * paints its splash frozen.
 */
export default function SplashScreen({ ready = true, onFinish, onSequenceEnd }) {
  const reduced = usePrefersReducedMotion();
  const dark = useLiveDarkTheme();
  const [exiting, setExiting] = useState(false);
  const [bobbing, setBobbing] = useState(false);

  const startedAt = useRef(Date.now());
  const readyRef = useRef(ready);
  const finishRef = useRef(onFinish);
  const sequenceEndRef = useRef(onSequenceEnd);
  readyRef.current = ready;
  finishRef.current = onFinish;
  sequenceEndRef.current = onSequenceEnd;

  // The droplet's own sounds, written onto the same beats as its animation: the
  // landing, the ring, the face, the sparkles. Played once, when the splash
  // appears, and stopped when it goes. A still logo has nothing to sound out,
  // and whether the browser has allowed audio yet is handled inside the
  // sequence itself (src/lib/splashSounds.js).
  const sounded = useRef(false);
  useEffect(() => {
    if (reduced || sounded.current) return undefined;
    sounded.current = true;
    return playSplashSounds();
  }, [reduced]);

  const steps = reduced ? [SPLASH_TIMING.reducedHold] : SPLASH_STEPS;
  const sequenceEnd = steps[steps.length - 1];

  // Ready? Then leave as soon as the sequence has finished — the whole sequence
  // is played, never a part of it, so the screen the session calls for (Home, or
  // Login) is only routed to after the splash is done. Startup that runs longer
  // than the sequence is covered by the idle bob below.
  useEffect(() => {
    if (exiting || !ready) return undefined;
    const remaining = sequenceEnd - (Date.now() - startedAt.current);
    const timer = setTimeout(() => setExiting(true), Math.max(0, remaining));
    return () => clearTimeout(timer);
  }, [ready, exiting, sequenceEnd]);

  // The sequence has played out. If startup ran long, bob gently rather than
  // sitting on a frozen frame; either way the caller is told once, which is how
  // a sign-out knows its animation has run before it leaves for the login
  // screen.
  useEffect(() => {
    const remaining = sequenceEnd - (Date.now() - startedAt.current);
    const timer = setTimeout(() => {
      sequenceEndRef.current?.();
      if (!readyRef.current) setBobbing(true);
    }, Math.max(0, remaining));
    return () => clearTimeout(timer);
  }, [sequenceEnd]);

  // Cross-fade over the app, then hand over.
  useEffect(() => {
    if (!exiting) return undefined;
    const timer = setTimeout(() => finishRef.current?.(), SPLASH_TIMING.exit);
    return () => clearTimeout(timer);
  }, [exiting]);

  const className = [
    "splash",
    dark ? "splash--dark" : "",
    reduced ? "splash--reduced" : "",
    bobbing && !exiting ? "splash--idle" : "",
    exiting ? "splash--exiting" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={className} style={SPLASH_VARS} aria-busy="true">
      <div className="splash__wash" aria-hidden="true" />
      <div className="splash__stage">
        <div className="splash__mascot">
          <SplashDroplet />
          <SplashSparkles />
        </div>
        <p className="splash__word font-body font-bold">Levli</p>
        <p className="splash__tag">Track your journey, simply.</p>
      </div>
    </div>
  );
}