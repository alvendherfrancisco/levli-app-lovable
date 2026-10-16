import React from "react";
import { useAppState } from "@/lib/AppState";
import { wellbeingSafeguards, wellbeingMessage } from "@/lib/wellbeing";
import WellbeingNotice from "@/components/wellbeing/WellbeingNotice";

/** The gentle prescriber check-in, when a wellbeing safeguard is active. */
export default function WellbeingPanel() {
  const { weightHistory, profile } = useAppState();
  const flags = wellbeingSafeguards({
    series: weightHistory || [],
    heightCm: profile?.height_cm || null,
    goalKg: profile?.goal_weight_kg || null,
  });
  // The same sideways margin and the same gap under it as the cards it sits
  // between, so the page's rhythm is even whether or not the notice is drawn.
  return <WellbeingNotice message={wellbeingMessage(flags)} className="mx-4 mb-5" />;
}