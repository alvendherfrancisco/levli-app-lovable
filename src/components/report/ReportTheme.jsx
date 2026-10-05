import React, { createContext, useContext, useEffect, useState } from "react";
import { reportTokens, PDF_TOKENS } from "@/components/report/reportTokens";

const ReportThemeContext = createContext(PDF_TOKENS);

/** The tokens for the report currently being rendered. */
export function useReportTokens() {
  return useContext(ReportThemeContext);
}

/**
 * Follows the app's live theme: it watches the `dark` class the app puts on
 * <html> (and the system setting, in case the app follows it), so switching
 * theme while the Report screen is open updates the preview with no reload.
 */
export function useIsDarkTheme() {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const root = document.documentElement;
    const read = () => setIsDark(root.classList.contains("dark"));
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    media?.addEventListener?.("change", read);
    return () => {
      observer.disconnect();
      media?.removeEventListener?.("change", read);
    };
  }, []);

  return isDark;
}

/**
 * Supplies one token set to everything inside the report.
 * mode="app" follows the live theme; mode="pdf" forces the light PDF tokens.
 */
export function ReportThemeProvider({ mode = "app", children }) {
  const isDark = useIsDarkTheme();
  const tokens = reportTokens(mode, isDark);
  return <ReportThemeContext.Provider value={tokens}>{children}</ReportThemeContext.Provider>;
}