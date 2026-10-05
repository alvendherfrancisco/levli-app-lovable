import { useEffect, useRef } from "react";
import useScrollLock from "@/hooks/useScrollLock";

const FOCUSABLE =
  'a[href], area[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Every open dialog pushes itself here; only the topmost one answers Escape,
// Tab and the back button, so a confirmation opened inside a sheet works.
const stack = [];
// Window after we remove our own history entry, during which popstate events
// from that removal must not close a sheet underneath.
let suppressPopUntil = 0;

const isVisible = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);

/**
 * Shared dialog behaviour for every modal and bottom sheet in the app:
 *  - the page behind it is scroll-locked (useScrollLock, reference counted)
 *  - focus is trapped inside the sheet, and returned to the trigger on close
 *  - Escape and the hardware/Android back button dismiss it
 *
 * Returns the ref to attach to the sheet container (give it tabIndex={-1}).
 */
export default function useModal({ open = true, onDismiss }) {
  const containerRef = useRef(null);
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useScrollLock(open);

  useEffect(() => {
    if (!open) return;

    const token = {};
    stack.push(token);
    const isTop = () => stack[stack.length - 1] === token;
    const previous = document.activeElement;

    // A history entry of our own, so the hardware back button closes the sheet.
    let pushed = false;
    try {
      window.history.pushState({ levliModal: true }, "");
      pushed = true;
    } catch {
      pushed = false;
    }

    const onPopState = () => {
      pushed = false;
      if (Date.now() < suppressPopUntil) return;
      if (isTop()) dismissRef.current?.();
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        if (!isTop()) return;
        e.preventDefault();
        dismissRef.current?.();
        return;
      }
      if (e.key !== "Tab" || !isTop()) return;
      const node = containerRef.current;
      if (!node) return;
      const list = Array.from(node.querySelectorAll(FOCUSABLE)).filter(isVisible);
      if (!list.length) {
        e.preventDefault();
        try { node.focus({ preventScroll: true }); } catch { /* ignore */ }
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !node.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !node.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("popstate", onPopState);
    document.addEventListener("keydown", onKeyDown, true);

    // Leave an element's own autoFocus alone; otherwise focus the sheet itself
    // (tabIndex={-1}) so a screen reader announces it and Tab starts inside it.
    const focusTimer = setTimeout(() => {
      const node = containerRef.current;
      if (!node) return;
      if (node.contains(document.activeElement)) return;
      try { node.focus({ preventScroll: true }); } catch { /* ignore */ }
    }, 60);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener("popstate", onPopState);
      document.removeEventListener("keydown", onKeyDown, true);
      const i = stack.indexOf(token);
      if (i >= 0) stack.splice(i, 1);
      // Closed some other way: drop our history entry quietly.
      if (pushed) {
        suppressPopUntil = Date.now() + 500;
        try { window.history.back(); } catch { /* ignore */ }
      }
      try { previous?.focus?.({ preventScroll: true }); } catch { /* ignore */ }
    };
  }, [open]);

  return containerRef;
}