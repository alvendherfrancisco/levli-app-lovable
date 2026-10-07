import { useCallback, useLayoutEffect, useRef, useState } from "react";

/**
 * Below this the step would be too small to read, so it scrolls from the top
 * instead — only reachable in a window far shorter than any phone in portrait
 * (a phone held in landscape, or a squat desktop window).
 */
const MIN_SCALE = 0.7;

/** Slack kept back so rounding can never leave a sliver of overflow. */
const MARGIN = 4;

/**
 * Fits one block of content into the space its container leaves, without
 * scrolling.
 *
 * The block is measured at its natural size and scaled down — never up — so a
 * whole step, its heading and the primary button sit on a single screen at any
 * phone size. The scale is applied from the centre, which centres both the steps
 * that fill the screen and the short ones that leave room around them.
 *
 * It re-measures on every step change, on viewport resize (address bar, rotation,
 * and Android's keyboard resize) and whenever the content itself changes height,
 * so a validation message appearing can never push the button off the screen.
 *
 * Returns the refs to attach, the scale to apply, and whether the content is too
 * tall to fit legibly.
 */
export default function useFitScale(deps = []) {
  const areaRef = useRef(null);
  const contentRef = useRef(null);
  const [fit, setFit] = useState({ scale: 1, scroll: false });

  const measure = useCallback(() => {
    const area = areaRef.current;
    const content = contentRef.current;
    if (!area || !content) return;
    // clientHeight includes the area's padding; the block lives inside it.
    const style = window.getComputedStyle(area);
    const available =
      area.clientHeight -
      (parseFloat(style.paddingTop) || 0) -
      (parseFloat(style.paddingBottom) || 0) -
      MARGIN;
    const natural = content.offsetHeight;
    if (available < 40 || natural < 40) return;
    const needed = available / natural;
    const scroll = needed < MIN_SCALE;
    const scale = scroll ? MIN_SCALE : Math.min(1, needed);
    setFit((prev) =>
      Math.abs(prev.scale - scale) < 0.004 && prev.scroll === scroll
        ? prev
        : { scale, scroll },
    );
  }, []);

  useLayoutEffect(() => {
    measure();
    const area = areaRef.current;
    const content = contentRef.current;
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    if (observer) {
      if (area) observer.observe(area);
      if (content) observer.observe(content);
    }
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);
    // Web fonts land after the first paint and can change the measured height.
    const fonts = document.fonts;
    if (fonts && fonts.ready) fonts.ready.then(schedule).catch(() => {});
    return () => {
      cancelAnimationFrame(frame);
      if (observer) observer.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measure, ...deps]);

  return { areaRef, contentRef, scale: fit.scale, scroll: fit.scroll };
}