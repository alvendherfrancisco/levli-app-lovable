import React from "react";

/**
 * One card on the Insights page, drawn with the same shell as the cards on
 * Home, Shots and History: a 2xl surface on the shared hairline, the same
 * generous padding and the same gap between cards (see src/index.css). Every
 * card on the page is drawn from here, so no two sections can differ in
 * padding, corner radius or spacing.
 */
export default function InsightCard({ children, className = "", id }) {
  return (
    <div id={id} className={`mx-4 mb-5 bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm card-line ${className}`}>
      {children}
    </div>
  );
}