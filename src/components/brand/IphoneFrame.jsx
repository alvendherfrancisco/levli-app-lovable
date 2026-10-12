import React from "react";

/**
 * The device the App Store screenshots are shown in: a flat dark bezel, the
 * screen inside it, a dynamic island and a home indicator. It is drawn artwork,
 * not a photograph of a device, so it stays crisp at any export size.
 */
export default function IphoneFrame({ children, className = "" }) {
  return (
    <div
      className={`relative rounded-[54px] p-[7px] ${className}`}
      style={{ background: "#0B0F19", boxShadow: "0 24px 60px -24px rgba(16,24,40,0.5)" }}
    >
      <div className="relative overflow-hidden rounded-[47px] bg-white">
        {children}
        <div className="pointer-events-none absolute left-1/2 top-[10px] h-[25px] w-[104px] -translate-x-1/2 rounded-full" style={{ background: "#0B0F19" }} />
        <div className="pointer-events-none absolute bottom-[7px] left-1/2 h-[5px] w-[118px] -translate-x-1/2 rounded-full bg-black/25" />
      </div>
    </div>
  );
}