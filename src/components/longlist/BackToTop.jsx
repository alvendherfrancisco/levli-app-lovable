import React, { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// "Back to top", for a list that has been scrolled through.
//
// It is not on the screen while the top of the list is still in view: it arrives
// once the reader is a long way down, and it sits clear of the bottom tab bar and
// of the floating button every list page carries. It is drawn from the app's own
// button tokens, a size smaller than a main action, so it reads as a small
// shortcut rather than as something asking to be pressed.
// ─────────────────────────────────────────────────────────────────────────────

export default function BackToTop({ threshold = 700, className = "" }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`btn-pill btn-pill-sm btn-secondary fixed right-4 z-20 shadow-card ${className}`}
      style={{ bottom: "calc(var(--tabbar-h) + 4.5rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <ArrowUp size={16} aria-hidden="true" />
      Back to top
    </button>
  );
}