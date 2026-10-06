import { useEffect, useRef } from "react";
import useScrollLock from "@/hooks/useScrollLock";
import { sound } from "@/lib/sounds";

const FOCUSABLE =
  'a[href], area[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Every open dialog pushes itself here; only the topmost one answers Escape,
// Tab and the back button, so a confirmation opened inside a sheet works.
const stack = [];
// Each sheet's history entry is named after the sheet that pushed it, so a
// sheet can never drop an entry that is not its own (see the close below).
let entrySeq = 0;
// Window after we remove our own history entry, during which popstate events
// from that removal must not close a sheet underneath.
let suppressPopUntil = 0;

const isVisible = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);

/**
 * Shared dialog behaviour for every modal and bottom sheet in the app:
 *  - the page behind it is scroll-locked (useScrollLock, reference counted)
 *  - focus is trapped inside the sheet, and returned to the trigger on close
 *  - Escape and the hardware/Android back button dismiss it
 *  - the sound played on open (openSound, "open" unless the caller says otherwise)
 *
 * Returns the ref to attach to the sheet container (give it tabIndex={-1}).
 */
export default function useModal({ open = true, onDismiss, openSound = "open" }) {
  const containerRef = useRef(null);
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;
  // Read at open time only, so a sheet that changes its tone mid-life cannot
  // replay the sound.
  const openSoundRef = useRef(openSound);
  openSoundRef.current = openSound;

  useScrollLock(open);

  useEffect(() => {
    if (!open) return;

    // Every sheet in the app opens with the same soft tone, unless it names
    // another one — a confirmation, for instance, opens on the warning tone.
    (sound[openSoundRef.current] || sound.open)();

    const token = {};
    stack.push(token);
    const isTop = () => stack[stack.length - 1] === token;
    const previous = document.activeElement;

    // A history entry of our own, so the hardware back button closes the sheet.
    // It carries this sheet's name: the close below may only ever drop the entry
    // this sheet pushed.
    const entryId = `levliModal-${++entrySeq}`;
    const ownsEntryOnTop = () => {
      const state = window.history.state;
      return !!(state && state.levliModal === true && state.id === entryId);
    };
    try {
      window.history.pushState({ levliModal: true, id: entryId }, "");
    } catch {
      /* no entry of our own — the sheet still opens and closes */
    }

    const onPopState = () => {
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
      sound.close();
      clearTimeout(focusTimer);
      window.removeEventListener("popstate", onPopState);
      document.removeEventListener("keydown", onKeyDown, true);
      const i = stack.indexOf(token);
      if (i >= 0) stack.splice(i, 1);
      // Closed some other way: drop our own entry quietly, and only while it is
      // still the one on top. If the person moved on before the sheet closed (a
      // tab, a link, the next screen opening underneath it), our entry now sits
      // below the screen they just opened — and stepping back here would pull
      // them off it, straight back to the previous screen. Leaving the entry in
      // place costs nothing: its URL is the screen they came from, which is
      // exactly where a later back step belongs.
      if (ownsEntryOnTop()) {
        suppressPopUntil = Date.now() + 500;
        try { window.history.back(); } catch { /* ignore */ }
      }
      try { previous?.focus?.({ preventScroll: true }); } catch { /* ignore */ }
    };
  }, [open]);

  return containerRef;
}