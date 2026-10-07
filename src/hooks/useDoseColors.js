import useLiveDarkTheme from "@/hooks/useLiveDarkTheme";
import { getDoseColor, getDoseStyle } from "@/lib/doseColors";

/**
 * Resolves dose colours for the theme in use.
 *
 * Each dose is stored with a light and a dark token, so a chip, badge or chart
 * marker picks the right one for the mode the app is in and repaints the moment
 * the theme changes. Callers read the dose's colour through here rather than
 * holding one of their own, so the same dose is the same colour everywhere.
 */
export default function useDoseColors() {
  const isDark = useLiveDarkTheme();
  return {
    isDark,
    /** A dot or chart marker colour. */
    color: (medication, dose) => getDoseColor(medication, dose, isDark),
    /** A filled chip, or the neutral outline for a typed dose. */
    style: (medication, dose) => getDoseStyle(medication, dose, isDark),
  };
}