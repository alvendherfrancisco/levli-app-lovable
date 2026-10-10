/**
 * The one class string every date and time field in the app is drawn with.
 *
 * A native date or time control is the one input that ignores its own width: the
 * browser gives it an intrinsic minimum from the value it prints and the picker
 * button beside it, so `width: 100%` on its own still lets it run past a form's
 * padding and out of a sheet or modal. The reset below is what keeps it inside —
 * appearance turned off, a zero min-width, an explicit border-box, and a full
 * width with no maximum of its own — so a date field's left and right edges line
 * up with every other field and button on the form, at any text size and in
 * either mode.
 *
 * The look is the one the Add shot form has always used: a 48px field, centred,
 * in the app's hairline. See src/components/DateInput.jsx and TimeInput.jsx,
 * which are the only places it is used from.
 */
export const DATE_TIME_FIELD =
  "w-full max-w-full min-w-0 box-border appearance-none outline-none " +
  "h-12 rounded-xl border border-gray-200 px-2 text-center text-base " +
  "dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-[#E8E9F0] " +
  "dark:[color-scheme:dark] focus:border-indigo-300";