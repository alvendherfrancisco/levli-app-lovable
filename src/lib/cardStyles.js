/**
 * The app's card, in one place: one rounded panel, one hairline, one soft shadow
 * — the same shell every list card and form card is drawn in, so a screen built
 * from several of them lines up.
 *
 * `CARD_DIVIDED` is the same shell with the hairline between its rows, for a list
 * whose rows are its direct children (add the padding the panel needs, e.g.
 * `px-4`). `SECTION_LABEL` is the small uppercase heading that sits over a card;
 * it carries no horizontal padding, so it starts exactly on the card's own edge.
 */
export const CARD = "rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900";

export const CARD_DIVIDED = `${CARD} divide-y divide-gray-100 dark:divide-white/[0.07]`;

export const SECTION_LABEL = "text-[13px] font-semibold uppercase tracking-wide text-gray-500 dark:text-[#9A9DAE]";