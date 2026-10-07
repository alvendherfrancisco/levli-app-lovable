import React from "react";
import { Check } from "lucide-react";
import { sound } from "@/lib/sounds";

/**
 * One selectable card, shared by every multi-select step.
 *
 * Every card is the same object apart from its words: one radius, one border
 * width, one padding, one minimum height, and the same 8pt spacing between
 * cards (set by the list that renders them). The border and tint come from the
 * theme's own tokens, so light and dark are the same design.
 *
 * The checkbox on the right is what carries the state — a filled circle with a
 * tick when selected, an empty circle when not — so the choice never depends on
 * colour alone, and `role="checkbox"` + `aria-checked` is what VoiceOver and
 * TalkBack announce. Tapping plays the shared select cue and light haptic, and
 * the press animation is dropped when Reduce Motion is on.
 */
export default function OptionCard({ icon: Icon, label, description, selected, onToggle }) {
  const choose = () => {
    sound.select();
    onToggle();
  };

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={choose}
      className={`w-full min-h-[4.5rem] text-left flex items-center gap-4 rounded-2xl border-2 p-4 transition-colors duration-200 motion-reduce:transition-none active:scale-[0.99] motion-reduce:active:scale-100 ${
        selected
          ? "border-primary bg-primary/5"
          : "border-border bg-background hover:border-muted-foreground/40"
      }`}
    >
      {/* One 44pt circular tinted container, one glyph size, on every card. */}
      <span
        className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
          selected ? "bg-primary/10" : "bg-muted"
        }`}
      >
        <Icon size={26} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold text-foreground leading-snug break-words">{label}</span>
        <span className="block text-sm text-muted-foreground leading-snug mt-1 break-words">{description}</span>
      </span>

      <span
        aria-hidden="true"
        className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
          selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
        }`}
      >
        {selected && <Check size={14} strokeWidth={3} />}
      </span>
    </button>
  );
}