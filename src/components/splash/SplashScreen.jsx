import React, { useEffect, useRef, useState } from "react";
import { SPLASH_TIMING, SPLASH_STEPS, SPLASH_VARS } from "@/lib/splashTiming";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import useLiveDarkTheme from "@/hooks/useLiveDarkTheme";
import SplashDroplet from "@/components/splash/SplashDroplet";
import SplashSparkles from "@/components/splash/SplashSparkles";

/**
 * The Levli launch splash.
 *
 * It plays its own sequence and never holds startup up: as soon as the app says
 * it is ready, the splash finishes the step it is in and cross-fades away. If
 * startup runs longer than the sequence, the droplet keeps bobbing gently (and
 * the sparkles keep twinkling) until the app is ready.
 *
 * With "Reduce Motion" the same composition is shown as a single fade — the
 * static logo — and nothing moves.
 */
export default function SplashScreen({ ready = true, onFinish }) {
  const reduced = usePrefersReducedMotion();
  const dark = useLiveDarkTheme();
  const [exiting, setExiting] = useState(false);
  const [bobbing, setBobbing] = useState(false);

  const startedAt = useRef(Date.now());
  const readyRef = useRef(ready);
  const finishRef = useRef(onFinish);
  readyRef.current = ready;
  finishRef.current = onFinish;

  const steps = reduced ? [SPLASH_TIMING.reducedHold] : SPLASH_STEPS;
  const sequenceEnd = steps[steps.length - 1];

  // Ready? Leave at the end of the step we're in — never mid-step.
  useEffect(() => {
    if (exiting || !ready) return undefined;
    const elapsed = Date.now() - startedAt.current;
    const leaveAt = steps.find((step) => step >= elapsed) ?? 0;
    const timer = setTimeout(() => setExiting(true), Math.max(0, leaveAt - elapsed));
    return () => clearTimeout(timer);
  }, [ready, exiting, reduced]);

  // Startup ran long: bob gently rather than sitting on a frozen frame.
  useEffect(() => {
    const remaining = sequenceEnd - (Date.now() - startedAt.current);
    const timer = setTimeout(() => {
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
        <p className="splash__word font-round">Levli</p>
        <p className="splash__tag">Track your journey, simply.</p>
      </div>
    </div>
  );
}