import React from "react";
import { haptic } from "@/lib/haptics";

const LABEL_CLASS = "text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block";

/**
 * The optional Route and Device type fields on a shot log. Both live inside the
 * collapsible "Add details (optional)" section, so the four things logged every
 * time stay uncluttered. Route arrives pre-filled from the chosen medication and
 * stays changeable; Device type starts empty ("—").
 *
 * Both are native selects on the same rounded, dark-aware input style as the
 * rest of the form, and are width-constrained so they never spill out of the
 * sheet's padding on a small phone.
 */
export default function ShotRouteDeviceFields({
  route,
  routeOptions,
  onRouteChange,
  deviceType,
  deviceOptions,
  onDeviceChange,
  inputClass,
}) {
  const selectClass = `${inputClass} min-w-0 max-w-full`;

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="shot-route" className={LABEL_CLASS}>Route</label>
        <select
          id="shot-route"
          value={route}
          onChange={(e) => { haptic("light"); onRouteChange(e.target.value); }}
          className={selectClass}
        >
          {routeOptions.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="shot-device" className={LABEL_CLASS}>Device type (optional)</label>
        <select
          id="shot-device"
          value={deviceType}
          onChange={(e) => { haptic("light"); onDeviceChange(e.target.value); }}
          className={selectClass}
        >
          <option value="">—</option>
          {deviceOptions.map((d) => (
            <option key={d.value} value={d.value} disabled={!!d.retired}>{d.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}