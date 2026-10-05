import React from "react";

/**
 * Custom filled SVG icons requested for Levli (nav + metrics).
 * All use fill="currentColor" so they inherit the parent text color.
 */

export function ShotsFilledIcon({ size = 20, className = "", style }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style} aria-hidden="true" role="img">
      <path fill="currentColor" d="M7.707 3c.188 0 .367.074.5.207l4.586 4.586a.708.708 0 0 1-1 1L11 8l-5 5H4l-2 2H1v-1l2-2v-2l5-5l-.793-.793A.707.707 0 0 1 7.707 3m3-2c.188 0 .367.074.5.207l3.586 3.586a.708.708 0 0 1-1 1L13 5l-.797.796l-2-2L11 3l-.793-.793a.708.708 0 0 1 .5-1.207" />
    </svg>
  );
}

export function MedsFilledIcon({ size = 20, className = "", style }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden="true" role="img">
      <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M12.657 2.757a6 6 0 1 1 8.485 8.486l-9.9 9.9a6 6 0 1 1-8.485-8.486zm7.07 7.071l-4.242 4.243l-5.657-5.657l4.243-4.242a4 4 0 1 1 5.657 5.656" />
    </svg>
  );
}

export function WeightFilledIcon({ size = 20, className = "", style }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden="true" role="img">
      <path fill="currentColor" d="M12 3a4 4 0 0 1 4 4c0 .73-.19 1.41-.54 2H18c.95 0 1.75.67 1.95 1.56C21.96 18.57 22 18.78 22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2c0-.22.04-.43 2.05-8.44C4.25 9.67 5.05 9 6 9h2.54A3.9 3.9 0 0 1 8 7a4 4 0 0 1 4-4m0 2a2 2 0 0 0-2 2a2 2 0 0 0 2 2a2 2 0 0 0 2-2a2 2 0 0 0-2-2" />
    </svg>
  );
}