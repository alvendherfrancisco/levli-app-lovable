import { useEffect, useState } from "react";

/** The device's current light/dark preference. */
function systemPrefersDark() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * Follows the app's live theme without waiting for it to be applied.
 *
 * The app puts a `dark` class on <html> once it knows the theme, which can be a
 * moment after the first paint. This starts from the device's own setting (what
 * the app uses until a theme is chosen) and then watches that class, so the
 * first screen never paints in the wrong mode or flips mid-way.
 */
export default function useLiveDarkTheme() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === "undefined") return false;
    if (document.documentElement.classList.contains("dark")) return true;
    return systemPrefersDark();
  });

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => setIsDark(root.classList.contains("dark"));
    const observer = new MutationObserver(apply);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}