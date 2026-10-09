import React, { useId } from "react";

/**
 * Route icons for the medication chips: a small, flat mark that says how the
 * product is taken. They are drawn on the same 48-unit grid, in the same
 * indigo-to-teal gradient as the pill icon (src/components/onboarding/
 * LevliIcons.jsx), so every chip carries an icon of the same weight and colour.
 */

function useGid(prefix) {
  const raw = useId();
  return `${prefix}${raw.replace(/[:]/g, "")}`;
}

function SvgIcon({ size = 14, className = "", children }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {children}
    </svg>
  );
}

function Grad({ id }) {
  return (
    <linearGradient id={id} x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
      <stop stopColor="#14B8A6" />
      <stop offset="1" stopColor="#6366F1" />
    </linearGradient>
  );
}

// ── Injection pen — dose dial, body with its window, then the needle ───────
export function InjectionIcon({ size = 28, className }) {
  const gid = useGid("inj");
  return (
    <SvgIcon size={size} className={className}>
      <defs><Grad id={gid} /></defs>
      <rect x="4" y="19" width="9" height="10" rx="4" fill={`url(#${gid})`} />
      <rect x="12" y="16.5" width="24" height="15" rx="7" fill={`url(#${gid})`} />
      <rect x="18" y="20" width="10" height="8" rx="2.5" fill="white" fillOpacity="0.35" />
      <rect x="35" y="22.5" width="10" height="3" rx="1.5" fill={`url(#${gid})`} />
    </SvgIcon>
  );
}

// ── Neutral — a plain plus: no route implied, used for "Other" ─────────────
export function NeutralIcon({ size = 28, className }) {
  const gid = useGid("plus");
  return (
    <SvgIcon size={size} className={className}>
      <defs><Grad id={gid} /></defs>
      <rect x="20.5" y="11" width="7" height="26" rx="3.5" fill={`url(#${gid})`} />
      <rect x="11" y="20.5" width="26" height="7" rx="3.5" fill={`url(#${gid})`} />
    </SvgIcon>
  );
}