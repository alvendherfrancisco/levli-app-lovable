import React from "react";
import {
  Home as HomeIcon, Syringe, BarChart3, FileText, MoreHorizontal,
  Signal, Wifi, BatteryFull,
} from "lucide-react";

/**
 * The pieces every App Store screenshot is drawn from.
 *
 * The screens are composed at 376 × 764 — one phone screen — inside the device
 * frame, and they are drawn in the app's own light-theme values written as fixed
 * hex. That is deliberate: an exported screenshot is artwork, so it must render
 * identically on every device and in either theme, and it must survive being
 * rasterised when the team downloads it.
 */
export const UI = {
  ink: "#111827",
  body: "#4B5563",
  muted: "#6B7280",
  faint: "#9CA3AF",
  line: "#E8EAF0",
  surface: "#F7F8FB",
  indigo: "#4F46E5",
  tint: "#EEF2FF",
  teal: "#14B8A6",
  amber: "#F59E0B",
  red: "#DC2626",
  bezel: "#0B0F19",
};

export const SCREEN_W = 376;
export const SCREEN_H = 764;

function StatusBar() {
  return (
    <div className="flex h-[34px] shrink-0 items-center justify-between px-[22px] pt-[6px]">
      <span className="text-[13px] font-semibold tracking-tight text-[#111827]">9:41</span>
      <span className="flex items-center gap-[5px] text-[#111827]">
        <Signal size={13} strokeWidth={2.4} />
        <Wifi size={14} strokeWidth={2.4} />
        <BatteryFull size={17} strokeWidth={2.2} />
      </span>
    </div>
  );
}

const TABS = [
  { label: "Home", Icon: HomeIcon },
  { label: "Shots", Icon: Syringe },
  { label: "Insights", Icon: BarChart3 },
  { label: "Journal", Icon: FileText },
  { label: "More", Icon: MoreHorizontal },
];

function TabBar({ active }) {
  return (
    <div className="flex h-[58px] shrink-0 items-stretch border-t px-[6px]" style={{ borderColor: UI.line }}>
      {TABS.map(({ label, Icon }) => {
        const on = label === active;
        return (
          <div key={label} className="flex flex-1 flex-col items-center justify-center gap-[3px]">
            <Icon size={19} strokeWidth={on ? 2.4 : 1.8} style={{ color: on ? UI.indigo : UI.faint }} />
            <span className="text-[10px] font-medium" style={{ color: on ? UI.indigo : UI.faint }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

/** One phone screen, with the status bar at the top and the tab bar at the foot. */
export function Phone({ tab, children }) {
  return (
    <div
      className="flex flex-col bg-white font-sans"
      style={{ width: SCREEN_W, height: SCREEN_H, color: UI.ink }}
    >
      <StatusBar />
      <div className="min-h-0 flex-1 overflow-hidden px-[16px]">{children}</div>
      {tab ? <TabBar active={tab} /> : null}
    </div>
  );
}

/** The screen's own title bar. */
export function ScreenHead({ title, subtitle, right }) {
  return (
    <div className="flex items-start justify-between gap-2 pb-[12px] pt-[4px]">
      <div>
        <h2 className="text-[22px] font-bold leading-tight tracking-[-0.01em]">{title}</h2>
        {subtitle ? <p className="mt-[2px] text-[12px]" style={{ color: UI.muted }}>{subtitle}</p> : null}
      </div>
      {right}
    </div>
  );
}

export function Card({ children, className = "", style }) {
  return (
    <div
      className={`rounded-2xl bg-white ${className}`}
      style={{ border: `1px solid ${UI.line}`, boxShadow: "0 1px 2px rgba(16,24,40,0.04)", ...style }}
    >
      {children}
    </div>
  );
}

export function Label({ children, className = "" }) {
  return (
    <p className={`text-[11px] font-semibold uppercase tracking-wide ${className}`} style={{ color: UI.faint }}>
      {children}
    </p>
  );
}

/** A read-only field row, as the app's forms draw it. */
export function FieldRow({ value, right, tag }) {
  return (
    <div
      className="flex h-[46px] items-center justify-between rounded-full px-[14px] text-[13px]"
      style={{ border: `1px solid ${UI.line}`, background: "#FFFFFF", color: UI.ink }}
    >
      <span className="flex min-w-0 items-center gap-[8px]">
        <span className="truncate font-medium">{value}</span>
        {tag ? (
          <span className="rounded-full px-[7px] py-[2px] text-[10px]" style={{ background: UI.surface, color: UI.muted }}>
            {tag}
          </span>
        ) : null}
      </span>
      {right}
    </div>
  );
}

export function Stat({ label, value, hint }) {
  return (
    <Card className="px-[12px] py-[10px]">
      <p className="text-[11px]" style={{ color: UI.muted }}>{label}</p>
      <p className="mt-[2px] text-[16px] font-bold">{value}</p>
      {hint ? <p className="text-[11px]" style={{ color: hint.startsWith("-") ? UI.teal : UI.muted }}>{hint}</p> : null}
    </Card>
  );
}

/** The app's main action: one indigo pill. */
export function PillButton({ children, block, style }) {
  return (
    <div
      className={`flex h-[46px] items-center justify-center rounded-full text-[14px] font-semibold ${block ? "w-full" : "px-[22px]"}`}
      style={{ background: UI.indigo, color: "#FFFFFF", ...style }}
    >
      {children}
    </div>
  );
}