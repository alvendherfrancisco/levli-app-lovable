import React from "react";
import PageBackground from "@/components/PageBackground";

/**
 * The shared sign-in shell.
 *
 * `scrollable` is on by default. A page that sets it false instead fills exactly
 * one viewport with no scrolling at all: the page cannot be dragged, and no
 * rubber-band or scroll chain is passed on to it from a control inside it. Pages
 * with more on them than fits a short phone leave it on and keep scrolling.
 */
export default function AuthLayout({ icon: Icon, iconNode, title, subtitle, footer, children, scrollable = true }) {
  return (
    <div
      className={`${
        scrollable ? "min-h-screen" : "h-[100dvh] overflow-hidden overscroll-none"
      } flex items-center justify-center bg-background px-4 relative`}
    >
      <PageBackground />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 sm:mb-10">
          {/* The brand mark sits above the title with a clear gap. Nothing here
              sets a height or hides overflow, so a taller mark is never cut. */}
          {iconNode ? (
            <div className="mb-6 flex justify-center">{iconNode}</div>
          ) : (
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-6">
              <Icon className="w-7 h-7 text-primary-foreground" aria-hidden="true" />
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2 text-sm sm:text-base px-2">{subtitle}</p>}
        </div>
        <div className="bg-card rounded-2xl shadow-sm border border-border p-5 sm:p-8">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}