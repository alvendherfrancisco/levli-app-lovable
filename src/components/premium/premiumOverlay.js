import { FileText, TrendingUp } from "lucide-react";

/**
 * The words and the mark each Premium overlay carries.
 *
 * One overlay serves both screens (see PremiumUpgradeOverlay), and this is the
 * only thing that differs between them: the small mark at its head, the headline
 * and the one line under it. A screen is added or reworded here — never by
 * copying the overlay.
 *
 * Every line promises only what the app already does. Premium unlocks the whole
 * Insights page — the weight chart and its ranges, the medication level, the side
 * effects summary and the progress photo strip — and the Report screen, whose
 * report is built to be handed to a prescriber ("Make a summary to share with your
 * prescriber", src/lib/reportOptions.js).
 */
export const PREMIUM_OVERLAY_CONTENT = {
  insights: {
    Icon: TrendingUp,
    headline: "Your Progress, at a Glance",
    description: "Unlock deeper insights, track your trends, and see your progress over time.",
  },
  report: {
    Icon: FileText,
    headline: "Reports Made for You",
    description:
      "Unlock your reports and make it easier to review your progress with your healthcare professional.",
  },
};