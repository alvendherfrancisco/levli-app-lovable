import React from "react";

/**
 * One card on the Insights page, drawn with the same shell as the cards on
 * Home, Shots and History: a 2xl surface on the shared hairline, the same
 * padding and the same gap between cards (see src/index.css).
 */
export default function InsightCard({ children, className = "" }) {
  return (
    <div className={`mx-4 mb-4 bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm card-line ${className}`}>
      {children}
    </div>
  );
}