import React from "react";
import IphoneFrame from "@/components/brand/IphoneFrame";

/**
 * One App Store screenshot, composed at Apple's 6.9" size.
 *
 * The card is exactly 430 × 932, which is a sixth of the 1290 × 2796 Apple asks
 * for — so exporting it at three times its size gives that size exactly, with no
 * scaling guesswork. The headline sits above a device that holds a full,
 * uncropped Levli screen.
 *
 * Everything here is drawn in fixed colour and at a fixed size, because the card
 * is exported as artwork rather than read on screen.
 */
export default function ShotCard({ title, subtitle, children }) {
  return (
    <div
      className="flex w-[430px] flex-col overflow-hidden font-sans"
      style={{ height: 932, background: "linear-gradient(168deg, #EEF2FF 0%, #F8F8FC 44%, #FFFFFF 100%)" }}
    >
      <div className="min-h-[134px] px-[26px] pt-[22px]">
        <h3 className="max-w-[366px] text-[30px] font-extrabold leading-[1.1] tracking-[-0.02em]" style={{ color: "#111827" }}>
          {title}
        </h3>
        <p className="mt-[9px] max-w-[352px] text-[14px] leading-[1.35]" style={{ color: "#4B5563" }}>
          {subtitle}
        </p>
      </div>

      <div className="mt-[14px] pb-[20px]">
        <IphoneFrame className="h-[764px] w-[390px]">{children}</IphoneFrame>
      </div>
    </div>
  );
}