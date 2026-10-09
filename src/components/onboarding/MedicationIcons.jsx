import React, { useId } from "react";

/**
 * Route icons for the medication chips: a small flat mark that says how the
 * product is taken. Every icon stands upright and is drawn on the same grid, in
 * the same indigo-to-teal gradient, so each chip carries a mark of the same
 * weight and colour.
 *
 * The boxes are taller than they are wide (20 x 40, and 35 x 40 for the pair),
 * and each icon is rendered by its height with the width following the box, so
 * the pen, the capsule and the pair are all exactly the same height on screen
 * and the names beside them line up.
 */

const SINGLE = "0 0 20 40";
const PAIR = "0 0 35 40";

function useGid(prefix) {
  const raw = useId();
  return `${prefix}${raw.replace(/[:]/g, "")}`;
}

function SvgIcon({ height = 30, viewBox = SINGLE, className = "", children }) {
  const [, , vw, vh] = viewBox.split(" ").map(Number);
  return (
    <svg
      width={(height * vw) / vh}
      height={height}
      viewBox={viewBox}
      fill="none"
      className={`flex-shrink-0 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function Grad({ id, x1 = 2, y1 = 4, x2 = 18, y2 = 36 }) {
  return (
    <linearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2} gradientUnits="userSpaceOnUse">
      <stop stopColor="#6366F1" />
      <stop offset="1" stopColor="#14B8A6" />
    </linearGradient>
  );
}

// The pen and the capsule, each drawn once and placed by the component that
// needs it. Both stand upright and run from y 5 to y 35 of the 40-unit box, so
// they are exactly the same height.

// ── Injection pen — needle tip, slim body, plunger cap ────────────────────
function PenGlyph({ gid }) {
  return (
    <g>
      {/* the needle tip, at the top */}
      <rect x="9.2" y="5" width="1.6" height="5" rx="0.8" fill={`url(#${gid})`} />
      {/* the needle hub */}
      <rect x="7" y="10" width="6" height="2" rx="1" fill={`url(#${gid})`} />
      {/* the slim body */}
      <rect x="6" y="12" width="8" height="17" rx="3" fill={`url(#${gid})`} />
      {/* the dose window on the body */}
      <rect x="8" y="14.5" width="4" height="8.5" rx="1.5" fill="white" fillOpacity="0.35" />
      {/* the plunger cap, at the bottom */}
      <rect x="6.5" y="29" width="7" height="6" rx="2.5" fill={`url(#${gid})`} />
    </g>
  );
}

// ── Pill — an upright capsule, taller than it is wide ──────────────────────
function PillGlyph({ gid }) {
  return (
    <g>
      <rect x="5.5" y="5" width="9" height="30" rx="4.5" fill={`url(#${gid})`} />
      {/* the lower half, a step lighter, so the two halves of the capsule read */}
      <path d="M5.5 20 H14.5 V30.5 A4.5 4.5 0 0 1 5.5 30.5 Z" fill="white" fillOpacity="0.32" />
      {/* the join between the halves */}
      <rect x="5.5" y="19.3" width="9" height="1.4" fill="white" fillOpacity="0.8" />
    </g>
  );
}

// ── Injection pen, upright ────────────────────────────────────────────────
export function InjectionIcon({ height = 30, className }) {
  const gid = useGid("inj");
  return (
    <SvgIcon height={height} className={className}>
      <defs><Grad id={gid} /></defs>
      <PenGlyph gid={gid} />
    </SvgIcon>
  );
}

// ── Pill, upright ─────────────────────────────────────────────────────────
export function PillIcon({ height = 30, className }) {
  const gid = useGid("pill");
  return (
    <SvgIcon height={height} className={className}>
      <defs><Grad id={gid} /></defs>
      <PillGlyph gid={gid} />
    </SvgIcon>
  );
}

// ── Both — the capsule and the pen, side by side, the same height ─────────
export function ComboIcon({ height = 30, className }) {
  const gid = useGid("both");
  return (
    <SvgIcon height={height} viewBox={PAIR} className={className}>
      <defs><Grad id={gid} x1={4} y1={4} x2={31} y2={36} /></defs>
      <PillGlyph gid={gid} />
      <g transform="translate(16 0)"><PenGlyph gid={gid} /></g>
    </SvgIcon>
  );
}

// ── Neutral — a plain plus: no route implied, used for "Other" ─────────────
export function NeutralIcon({ height = 30, className }) {
  const gid = useGid("plus");
  return (
    <SvgIcon height={height} className={className}>
      <defs><Grad id={gid} /></defs>
      <rect x="8" y="8" width="4" height="24" rx="2" fill={`url(#${gid})`} />
      <rect x="0" y="18" width="20" height="4" rx="2" fill={`url(#${gid})`} />
    </SvgIcon>
  );
}