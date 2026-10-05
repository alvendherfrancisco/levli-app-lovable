import React from "react";
import { Syringe, Pill, MoreHorizontal, Settings, CalendarDays, Boxes, User } from "lucide-react";
import IonIcon from "@/components/IonIcon";
import { ShotsFilledIcon, MedsFilledIcon } from "@/components/FilledIcons";

/**
 * One source of truth for navigation. The bottom tab bar, the desktop side rail
 * and the More screen all read from here, so a destination can never drift.
 */
export const PRIMARY_TABS = [
  { path: "/", label: "Home", kind: "ion", outline: "home-outline", active: "home" },
  { path: "/shots", label: "Shots", kind: "shots" },
  { path: "/insights", label: "Insights", kind: "ion", outline: "bar-chart-outline", active: "bar-chart" },
  { path: "/journal", label: "Journal", kind: "ion", outline: "document-text-outline", active: "document-text" },
  { path: "/more", label: "More", kind: "more" },
];

export const MORE_ITEMS = [
  { path: "/history", label: "History", description: "Calendar of doses and daily logs", kind: "lucide", Icon: CalendarDays },
  { path: "/medications", label: "Meds", description: "Your regimens and repeat schedules", kind: "meds" },
  { path: "/inventory", label: "Stock", description: "Pens, vials and expiry dates", kind: "lucide", Icon: Boxes },
  { path: "/profile", label: "Profile", description: "Height, goal weight and units", kind: "lucide", Icon: User },
  { path: "/settings", label: "Settings", description: "Theme, sounds and your data", kind: "lucide", Icon: Settings },
];

export const ALL_NAV_ITEMS = [...PRIMARY_TABS, ...MORE_ITEMS];

/** The icon for a nav destination, filled when it is the current page. */
export function NavIcon({ item, size = 24, active = false, className = "" }) {
  if (item.kind === "ion") {
    return <IonIcon name={active ? item.active : item.outline} size={size} className={className} />;
  }
  if (item.kind === "shots") {
    return active
      ? <ShotsFilledIcon size={size} className={className} />
      : <Syringe size={size} strokeWidth={1.8} className={className} />;
  }
  if (item.kind === "meds") {
    return active
      ? <MedsFilledIcon size={size} className={className} />
      : <Pill size={size} strokeWidth={1.8} className={className} />;
  }
  if (item.kind === "more") {
    return <MoreHorizontal size={size} strokeWidth={active ? 2.6 : 1.8} className={className} />;
  }
  const Icon = item.Icon;
  return <Icon size={size} strokeWidth={1.8} className={className} />;
}

/** Routes that belong to the More group, used to mark the More tab as current. */
export const MORE_PATHS = MORE_ITEMS.map((i) => i.path);