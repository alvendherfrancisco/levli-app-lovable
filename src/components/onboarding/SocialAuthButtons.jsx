import React from "react";
import GoogleIcon from "@/components/GoogleIcon";
import AppleIcon from "@/components/AppleIcon";
import { BUTTON } from "@/components/onboarding/formStyles";
import { sound } from "@/lib/sounds";

/**
 * The provider buttons, and the divider that separates them from the form.
 *
 * Both are built from the same geometry as the fields beneath them — the same
 * width, the same corner radius, the same height — so the three line up exactly.
 * The label sits with its mark rather than beside it, with room at each end, and
 * the button grows if the text ever needs more space instead of clipping.
 *
 * Google is offered first and Apple second, in that order on every screen, so
 * the two are in the same place wherever they appear. `providers` decides which
 * are offered, and `tone` the palette: "light" for the white onboarding card,
 * "theme" for a surface that follows the app's own theme.
 */
const LOOKS = {
  light: {
    google: "border-2 border-gray-200 bg-white text-gray-700 hover:border-gray-300",
    apple: "border-2 border-black bg-black text-white hover:bg-neutral-900",
    rule: "bg-gray-200",
    label: "text-gray-500",
  },
  theme: {
    google: "border border-border bg-card text-foreground hover:bg-muted",
    apple: "border border-foreground bg-foreground text-background hover:opacity-90",
    rule: "bg-border",
    label: "text-muted-foreground",
  },
};

const OFFERS = {
  google: { label: "Continue with Google", Icon: GoogleIcon },
  apple: { label: "Continue with Apple", Icon: AppleIcon },
};

export default function SocialAuthButtons({
  onProvider,
  disabled = false,
  providers = ["google", "apple"],
  tone = "light",
  labels = {},
  divider = true,
}) {
  const look = LOOKS[tone];

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3">
        {providers.map((id) => {
          const offer = OFFERS[id];
          if (!offer) return null;
          const { Icon } = offer;
          const label = labels[id] || offer.label;

          return (
            <button
              key={id}
              type="button"
              disabled={disabled}
              onClick={() => { sound.tap(); onProvider(id); }}
              className={`${BUTTON} ${look[id]}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-center">{label}</span>
            </button>
          );
        })}
      </div>

      {divider && (
        <div className="flex items-center gap-3 my-5">
          <span className={`flex-1 h-px ${look.rule}`} />
          <span className={`text-[12px] font-semibold tracking-wider ${look.label}`}>OR</span>
          <span className={`flex-1 h-px ${look.rule}`} />
        </div>
      )}
    </div>
  );
}