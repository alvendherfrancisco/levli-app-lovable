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

// ── Injection — pen body with a plunger behind and a needle in front ───────
export function InjectionIcon({ size = 14, className }) {
  const gid = useGid("inj");
  return (
    <SvgIcon size={size} className={className}>
      <defs><Grad id={gid} /></defs>
      <rect x="6" y="20.5" width="8" height="7" rx="2.5" fill={`url(#${gid})`} />
      <rect x="14" y="17" width="22" height="14" rx="5" fill={`url(#${gid})`} />
      <line x1="21" y1="20" x2="21" y2="28" stroke="white" strokeWidth="2" strokeOpacity="0.5" />
      <rect x="36" y="22.5" width="8" height="3" rx="1.5" fill={`url(#${gid})`} />
    </SvgIcon>
  );
}

// ── Neutral — a plain plus: no route implied, used for "Other" ─────────────
export function NeutralIcon({ size = 14, className }) {
  const gid = useGid("plus");
  return (
    <SvgIcon size={size} className={className}>
      <defs><Grad id={gid} /></defs>
      <rect x="21.5" y="12" width="5" height="24" rx="2.5" fill={`url(#${gid})`} />
      <rect x="12" y="21.5" width="24" height="5" rx="2.5" fill={`url(#${gid})`} />
    </SvgIcon>
  );
}