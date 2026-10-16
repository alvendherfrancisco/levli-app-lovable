import React from "react";

/** The quiet link at the foot of a card, opening the explanation for curious users. */
export default function HowItWorksLink({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="mx-auto mt-3 flex min-h-[44px] items-center justify-center px-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400"
    >
      How GLP-1s work
    </button>
  );
}