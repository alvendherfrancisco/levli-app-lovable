import React from "react";
import SheetSelect from "@/components/modals/shot/SheetSelect";

/**
 * The optional Route and Device type fields on a shot log. Both live inside the
 * collapsible "More details" section, so the four things logged every time stay
 * uncluttered. Route arrives pre-filled from the chosen medication and stays
 * changeable; Device type shows "Select" until one is chosen.
 *
 * Both are drawn as the sheet's own field: the same height, the same pill, one
 * down chevron, and wide enough never to spill past the sheet's padding.
 */
export default function ShotRouteDeviceFields({
  route,
  routeOptions,
  onRouteChange,
  deviceType,
  deviceOptions,
  onDeviceChange,
}) {
  return (
    <div className="space-y-6">
      <SheetSelect
        id="shot-route"
        label="Route"
        value={route}
        onChange={onRouteChange}
        options={routeOptions}
      />
      <SheetSelect
        id="shot-device"
        label="Device type"
        value={deviceType}
        onChange={onDeviceChange}
        // A device already on a record stays listed, and stays shut out.
        options={deviceOptions.map((d) => ({ ...d, disabled: !!d.retired }))}
      />
    </div>
  );
}