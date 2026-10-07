import React, { useId } from "react";

/**
 * Levli custom icon set — "friendly rounded sticker" style.
 * Soft-gradient blob-based icons with simple white line-art symbols.
 * Reusable across onboarding, Home, Shots, Journal, Insights, etc.
 */

function useGid(prefix) {
  const raw = useId();
  return `${prefix}${raw.replace(/[:]/g, "")}`;
}

function SvgIcon({ size = 48, className = "", children }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {children}
    </svg>
  );
}

function Grad({ id, from, to }) {
  return (
    <linearGradient id={id} x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
      <stop stopColor={from} />
      <stop offset="1" stopColor={to} />
    </linearGradient>
  );
}

// ── Droplet (mascot) ──────────────────────────────────────────────────────
export function DropletIcon({ size = 48, className }) {
  const gid = useGid("drop");
  return (
    <SvgIcon size={size} className={className}>
      <defs><Grad id={gid} from="#6366F1" to="#14B8A6" /></defs>
      <path d="M24 6 C24 6, 12 20, 12 30 a12 12 0 0 0 24 0 C36 20, 24 6, 24 6Z" fill={`url(#${gid})`} />
      <path d="M24 16 C24 16, 18 24, 18 30 a6 6 0 0 0 12 0" fill="white" fillOpacity="0.25" />
    </SvgIcon>
  );
}

// ── Pill capsule ──────────────────────────────────────────────────────────
export function PillIcon({ size = 48, className }) {
  const gid = useGid("pill");
  return (
    <SvgIcon size={size} className={className}>
      <defs><Grad id={gid} from="#14B8A6" to="#6366F1" /></defs>
      <rect x="8" y="14" width="32" height="20" rx="10" fill={`url(#${gid})`} />
      <line x1="24" y1="14" x2="24" y2="34" stroke="white" strokeWidth="2" strokeOpacity="0.5" />
    </SvgIcon>
  );
}

// ── Heart ──────────────────────────────────────────────────────────────────
export function HeartIcon({ size = 48, className }) {
  const gid = useGid("heart");
  return (
    <SvgIcon size={size} className={className}>
      <defs><Grad id={gid} from="#F97316" to="#EC4899" /></defs>
      <path d="M24 38 C24 38, 8 28, 8 18 a8 8 0 0 1 16 -2 a8 8 0 0 1 16 2 C40 28, 24 38, 24 38Z" fill={`url(#${gid})`} />
      <path d="M16 16 a3 3 0 0 1 3 -3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.4" />
    </SvgIcon>
  );
}

// ── Calendar ──────────────────────────────────────────────────────────────
export function CalendarIcon({ size = 48, className }) {
  const gid = useGid("cal");
  return (
    <SvgIcon size={size} className={className}>
      <defs><Grad id={gid} from="#6366F1" to="#3B82F6" /></defs>
      <rect x="8" y="12" width="32" height="28" rx="6" fill={`url(#${gid})`} />
      <rect x="8" y="12" width="32" height="8" rx="6" fill="white" fillOpacity="0.25" />
      <circle cx="16" cy="28" r="2" fill="white" fillOpacity="0.6" />
      <circle cx="24" cy="28" r="2" fill="white" fillOpacity="0.6" />
      <circle cx="32" cy="28" r="2" fill="white" fillOpacity="0.6" />
      <circle cx="16" cy="34" r="2" fill="white" fillOpacity="0.6" />
      <circle cx="24" cy="34" r="2" fill="white" fillOpacity="0.6" />
    </SvgIcon>
  );
}

// ── Chart line ─────────────────────────────────────────────────────────────
export function ChartIcon({ size = 48, className }) {
  const gid = useGid("chart");
  return (
    <SvgIcon size={size} className={className}>
      <defs><Grad id={gid} from="#14B8A6" to="#6366F1" /></defs>
      <rect x="8" y="10" width="32" height="30" rx="6" fill={`url(#${gid})`} />
      <path d="M14 30 L 20 24 L 26 28 L 34 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="34" cy="16" r="2.5" fill="white" />
    </SvgIcon>
  );
}

// ── Shield (friendly, softened) ────────────────────────────────────────────
export function ShieldIcon({ size = 48, className }) {
  const gid = useGid("shield");
  return (
    <SvgIcon size={size} className={className}>
      <defs><Grad id={gid} from="#F97316" to="#EF4444" /></defs>
      <path d="M24 6 L 38 12 V 24 C 38 32, 32 38, 24 42 C 16 38, 10 32, 10 24 V 12 Z" fill={`url(#${gid})`} />
      <path d="M18 24 L 22 28 L 30 18" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </SvgIcon>
  );
}

// ── Syringe ────────────────────────────────────────────────────────────────
export function SyringeIcon({ size = 48, className }) {
  const gid = useGid("syr");
  return (
    <SvgIcon size={size} className={className}>
      <defs><Grad id={gid} from="#14B8A6" to="#3B82F6" /></defs>
      <rect x="6" y="6" width="36" height="36" rx="10" fill={`url(#${gid})`} />
      <g transform="rotate(-35 24 24)">
        <rect x="14" y="18" width="20" height="6" rx="1" fill="white" fillOpacity="0.9" />
        <rect x="33" y="19" width="3" height="4" fill="white" fillOpacity="0.7" />
        <rect x="36" y="20" width="6" height="2" fill="white" fillOpacity="0.5" />
        <rect x="12" y="17" width="3" height="8" rx="1" fill="white" fillOpacity="0.8" />
        <line x1="18" y1="18" x2="18" y2="24" stroke="#14B8A6" strokeWidth="0.8" />
        <line x1="22" y1="18" x2="22" y2="24" stroke="#14B8A6" strokeWidth="0.8" />
        <line x1="26" y1="18" x2="26" y2="24" stroke="#14B8A6" strokeWidth="0.8" />
        <line x1="30" y1="18" x2="30" y2="24" stroke="#14B8A6" strokeWidth="0.8" />
      </g>
    </SvgIcon>
  );
}

// ── Mood / smile ───────────────────────────────────────────────────────────
export function MoodIcon({ size = 48, className }) {
  const gid = useGid("mood");
  return (
    <SvgIcon size={size} className={className}>
      <defs><Grad id={gid} from="#F59E0B" to="#F97316" /></defs>
      <circle cx="24" cy="24" r="18" fill={`url(#${gid})`} />
      <circle cx="18" cy="20" r="2" fill="white" />
      <circle cx="30" cy="20" r="2" fill="white" />
      <path d="M17 28 Q 24 35 31 28" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </SvgIcon>
  );
}

// ── Scale (weight) ─────────────────────────────────────────────────────────
export function ScaleIcon({ size = 48, className }) {
  const gid = useGid("scale");
  return (
    <SvgIcon size={size} className={className}>
      <defs><Grad id={gid} from="#8B5CF6" to="#6366F1" /></defs>
      <rect x="8" y="14" width="32" height="24" rx="6" fill={`url(#${gid})`} />
      <circle cx="24" cy="26" r="7" fill="white" fillOpacity="0.2" />
      <circle cx="24" cy="26" r="5" fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" />
      <line x1="24" y1="26" x2="28" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="26" r="1.5" fill="white" />
    </SvgIcon>
  );
}

// ── Nutrition (leaf) ───────────────────────────────────────────────────────
export function NutritionIcon({ size = 48, className }) {
  const gid = useGid("nut");
  return (
    <SvgIcon size={size} className={className}>
      <defs><Grad id={gid} from="#10B981" to="#14B8A6" /></defs>
      <circle cx="24" cy="24" r="18" fill={`url(#${gid})`} />
      <path d="M16 30 C 16 22, 22 16, 32 16 C 32 24, 26 30, 16 30Z" fill="white" fillOpacity="0.85" />
      <path d="M18 28 C 20 24, 24 22, 28 20" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </SvgIcon>
  );
}

// ── Injection site ─────────────────────────────────────────────────────────
export function InjectionSiteIcon({ size = 48, className }) {
  const gid = useGid("site");
  return (
    <SvgIcon size={size} className={className}>
      <defs><Grad id={gid} from="#14B8A6" to="#3B82F6" /></defs>
      <circle cx="24" cy="24" r="18" fill={`url(#${gid})`} />
      <circle cx="24" cy="24" r="10" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.4" />
      <circle cx="24" cy="24" r="5" fill="white" fillOpacity="0.9" />
      <circle cx="24" cy="24" r="2" fill="#14B8A6" />
    </SvgIcon>
  );
}

// ── Sparkle ────────────────────────────────────────────────────────────────
export function SparkleIcon({ size = 16, className }) {
  const gid = useGid("spark");
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs><Grad id={gid} from="#F59E0B" to="#F97316" /></defs>
      <path d="M8 1 L 9.5 6 L 14 7.5 L 9.5 9 L 8 14 L 6.5 9 L 2 7.5 L 6.5 6 Z" fill={`url(#${gid})`} />
    </svg>
  );
}