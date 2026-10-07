import React from "react";

/**
 * The one illustration slot every onboarding page uses.
 *
 * One box on every page: one height (clamped, so it only gives a little on a
 * short screen), one width cap, one glow at one size and intensity, centred,
 * and the same 24px gap to the title below. The artwork is scaled to fit inside
 * it (contain, centred), so no page sizes its own illustration and no page can
 * push its title to a different place.
 *
 * The slot is decorative: the step's own words carry the meaning, so it is
 * hidden from screen readers.
 */
export default function IllustrationSlot({ tone, children }) {
  return (
    <div className="onb-slot" aria-hidden="true">
      <div className="onb-slot__glow" style={{ backgroundImage: tone }} />
      <svg
        viewBox="0 0 280 200"
        preserveAspectRatio="xMidYMid meet"
        className="onb-slot__art"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {children}
      </svg>
    </div>
  );
}