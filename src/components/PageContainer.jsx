import React from "react";
import AppFooterDisclaimer from "@/components/AppFooterDisclaimer";

const PADDING = {
  default: "pb-safe-content",
  fab: "pb-safe-fab",
  banner: "pb-safe-banner",
};

/**
 * The page's own shell: the room it must keep clear at the bottom, and — on the
 * pages that carry it — the shared disclaimer.
 *
 * `bottomInset` is that room: the tab bar, plus the floating button where the
 * page has one (see the layout metrics in src/index.css).
 *
 * With `disclaimer`, the page's content fills what is left of that room
 * (.page-fill-fab) and the disclaimer is the true foot of the content: at the
 * bottom of the screen while the page is short — just above the floating button
 * area, clear of both it and the tab bar — and simply the end of the content,
 * scrolling as usual, once the page grows. It is placed here, in one place, so
 * every page that shows it shows it in exactly the same position.
 */
export default function PageContainer({ children, bottomInset = "default", disclaimer = false, className = "" }) {
  const pad = PADDING[bottomInset] || PADDING.default;
  const shell = `min-h-screen w-full ${pad} ${className}`;

  if (!disclaimer) {
    return <div className={shell}>{children}</div>;
  }

  return (
    <div className={`${shell} flex flex-col`}>
      <div className="page-fill-fab">
        {children}
        <div className="mt-auto">
          <AppFooterDisclaimer />
        </div>
      </div>
    </div>
  );
}