// Sizes for the Add / Edit Medication form, in one place so every step matches:
// field labels 20px, body text and inputs 18px, step headings 26px, and every
// tappable element at least 56px tall with at least 12px (gap-3) between them.
//
// All sizes are in rem, so they grow with the phone's own font-size setting and
// nothing overflows at a 373px width.
export const labelCls = "text-xl font-semibold text-gray-900 dark:text-white mb-2 block";
export const helperCls = "text-lg text-gray-600 dark:text-gray-300 leading-snug";
export const stepHeadingCls = "text-[1.625rem] font-bold text-gray-900 dark:text-white leading-tight";
export const stepTitleCls = "text-lg font-bold text-gray-900 dark:text-white";

export const inputCls =
  "w-full min-h-[56px] rounded-2xl border-2 border-gray-400 dark:border-white/40 bg-white dark:bg-white/[0.08] text-gray-900 dark:text-white px-4 py-3 text-lg outline-none focus:border-indigo-500 dark:[color-scheme:dark]";

/** A big option button — selected or not. */
export const choiceCls = (selected) =>
  `min-h-[60px] rounded-2xl border-2 px-3 text-lg font-semibold ${
    selected
      ? "bg-indigo-600 border-indigo-600 text-white"
      : "bg-white dark:bg-white/[0.08] border-gray-400 dark:border-white/40 text-gray-900 dark:text-white"
  }`;

/** The second-choice button ("Other dose", "Other schedule"). */
export const otherChoiceCls =
  "w-full min-h-[56px] rounded-2xl border-2 border-dashed border-gray-500 dark:border-white/50 text-lg font-semibold text-gray-900 dark:text-white bg-white dark:bg-white/[0.05]";

export const primaryBtnCls =
  "w-full min-h-[64px] rounded-2xl bg-indigo-600 text-white text-xl font-bold flex items-center justify-center gap-2 disabled:opacity-60";

export const secondaryBtnCls =
  "w-full min-h-[56px] rounded-2xl border-2 border-gray-400 dark:border-white/40 bg-white dark:bg-white/[0.06] text-lg font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-2";