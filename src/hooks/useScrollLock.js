import { useEffect } from "react";

/**
 * Locks the page behind a modal or bottom sheet so it cannot scroll, rubber-band
 * or shift on any device (iOS Safari, Android Chrome, desktop).
 *
 * The lock is reference counted, so a dialog opened from inside a sheet (for
 * example a confirmation) only releases it once the last one has closed.
 *
 * On the first open the body is pinned with position: fixed at the offset it was
 * already scrolled to; on the final close those styles are removed and the page
 * is put back exactly where it was, so it never jumps or reflows.
 */

let openCount = 0;
let savedY = 0;
let savedStyles = null;

function lock() {
  const body = document.body;
  savedY = window.scrollY || window.pageYOffset || 0;
  savedStyles = {
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    width: body.style.width,
    overflow: body.style.overflow,
  };
  body.style.position = "fixed";
  body.style.top = `-${savedY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
  body.style.overflow = "hidden";
}

function unlock() {
  const body = document.body;
  if (savedStyles) {
    Object.assign(body.style, savedStyles);
    savedStyles = null;
  } else {
    body.style.position = "";
    body.style.top = "";
    body.style.left = "";
    body.style.right = "";
    body.style.width = "";
    body.style.overflow = "";
  }
  window.scrollTo(0, savedY);
}

// Safety net: if a lock was ever left behind (for example a route change that
// skipped the cleanup), the next sheet clears it instead of leaving the page
// stuck in the locked position.
function clearStaleLock() {
  if (openCount === 0 && document.body.style.position === "fixed") unlock();
}

export default function useScrollLock(active = true) {
  useEffect(() => {
    if (!active) return;
    clearStaleLock();
    openCount += 1;
    if (openCount === 1) lock();
    return () => {
      openCount = Math.max(0, openCount - 1);
      if (openCount === 0) unlock();
    };
  }, [active]);
}