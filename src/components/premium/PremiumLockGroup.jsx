import React from "react";
import { HELP_ON_SCREEN, PRIMARY_BTN, PRIMARY_BTN_ON } from "@/lib/uiStyles";

/**
 * The one lock group every Premium overlay shows.
 *
 * The Report screen, the Insights screen and the rotation card on Shots each put
 * a lock over what Premium opens, and they are all this: one illustration, one
 * headline, one muted line, the flow's own main button (the same pill, at the
 * same width, as the paywall's own subscribe button — see
 * src/components/paywall/PaywallBar.jsx), and the terms of the plan in one small
 * line under it. The spacing is one scale — 16px under the artwork, 8px under the
 * headline, 24px above the button, 8px under it — so the group is the same block
 * on every screen and the three can never drift apart.
 *
 * Where it is shown decides whether it draws its own surface:
 *
 * · `framed` (what the two full-page locks use) — the group stands on a card:
 *   the screen's own 400px column, a rounded panel with the shared hairline, a
 *   soft shadow and a barely-there blur over what is behind it. Under the artwork
 *   a soft indigo wash begins and fades down behind the words, so the picture and
 *   the words it introduces read as one block. The card is what makes the group
 *   legible: behind those two screens is a blurred page that never stops moving,
 *   and words sitting straight on it would be read through it.
 * · `framed={false}` — the rotation card on Shots already is a card, and its own
 *   scrim ends on that card's solid surface. A second panel there would be a box
 *   inside a box, so the group is drawn plain, and the two quiet things that keep
 *   its words legible are the faint radial glow behind the block, fading to nothing
 *   on every side, and a soft shadow on the letters themselves (see
 *   .lock-text-shadow in src/index.css).
 *
 * The artwork is handed in at the group's own size (150px, see the callers) and
 * centred in the slot, so the headline always begins at the same height whether
 * the picture is a wide card, a square or a figure.
 *
 * Missing `onUnlock` means the lock is read only — the caregiver's view of a
 * shared record follows the owner's plan and has nothing to sell — and then the
 * group is this same one, with no button.
 */
export default function PremiumLockGroup({ art, title, subtitle, onUnlock, framed = true }) {
  // On the card the words are already on a surface of their own and need no halo;
  // drawn plain they keep the soft shadow that holds them off what is behind them.
  const word = framed ? "relative" : "lock-text-shadow relative";

  return (
    <div
      className={`lock-group-in relative mx-auto flex w-full max-w-[400px] flex-col items-center text-center ${
        framed
          ? "overflow-hidden rounded-3xl border border-gray-100 bg-white/90 px-6 pt-5 pb-6 shadow-[0_22px_50px_-24px_rgba(16,24,40,0.45)] backdrop-blur-md dark:border-white/[0.08] dark:bg-gray-900/90 dark:shadow-[0_22px_50px_-24px_rgba(0,0,0,0.7)]"
          : ""
      }`}
    >
      {/* The wash: one soft ellipse of indigo behind the artwork and the words it
          introduces, on a layer that covers the whole card. It is drawn this way for
          one reason — it has no edge anywhere. A band starting under the picture
          draws a line across the card at its own top edge, however gentle its colour;
          a wash that grows out of nothing and fades back to nothing (nothing at the
          top of the card, its full strength at the foot of the picture, nothing again
          just under the button) has no edge to be seen, and the picture, the headline
          and the line under it simply sit in it. */}
      {framed && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_190px_at_50%_180px,rgba(99,102,241,0.20),rgba(99,102,241,0.07)_45%,rgba(99,102,241,0)_76%)] dark:bg-[radial-gradient(120%_190px_at_50%_180px,rgba(99,102,241,0.36),rgba(99,102,241,0.13)_45%,rgba(99,102,241,0)_76%)]"
        />
      )}

      <div className="relative flex min-h-[120px] w-full items-center justify-center">{art}</div>

      <div className="relative mt-4">
        {!framed && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-[220%] w-[130%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.92),rgba(255,255,255,0)_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(3,7,18,0.9),rgba(3,7,18,0)_70%)]"
          />
        )}
        <h3 className={`${word} text-[22px] font-bold leading-tight text-gray-900 dark:text-white`}>
          {title}
        </h3>
        <p className={`${word} mt-2 text-[15px] leading-relaxed text-gray-600 dark:text-gray-300`}>
          {subtitle}
        </p>
      </div>

      {onUnlock && (
        <>
          <button type="button" onClick={onUnlock} className={`${PRIMARY_BTN} ${PRIMARY_BTN_ON} relative mt-6`}>
            Unlock
          </button>
          <p className={`${HELP_ON_SCREEN} relative mt-2`}>Cancel anytime</p>
        </>
      )}
    </div>
  );
}