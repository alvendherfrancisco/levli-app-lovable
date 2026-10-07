import React from "react";
import { Loader2 } from "lucide-react";
import { SignUpIllustration } from "@/components/onboarding/OnboardingIllustrations";
import { firstNameError } from "@/lib/accountValidation";
import { sound } from "@/lib/sounds";

/**
 * The short account step for someone who signed in with a provider that gave no
 * name. Email and password are already settled — this asks for the one thing
 * Levli still needs to greet them, and nothing else.
 */
export default function FirstNameStep({ firstName, setFirstName, onContinue, loading, error }) {
  const missing = !!firstNameError(firstName);

  const submit = (e) => {
    e.preventDefault();
    if (missing) return;
    sound.tap();
    onContinue();
  };

  return (
    <form onSubmit={submit} className="flex flex-col items-center">
      <SignUpIllustration />
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
          What should we call you?
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed mt-2">
          You're signed in. Just your first name and you're set.
        </p>
      </div>

      {error && (
        <p className="w-full mb-3 text-sm text-red-600 text-center bg-red-50 rounded-xl px-3 py-2">{error}</p>
      )}

      <input
        type="text"
        placeholder="First name"
        aria-label="First name"
        autoComplete="given-name"
        enterKeyHint="go"
        autoFocus
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        className="w-full border-2 border-border bg-background rounded-xl px-3.5 py-3 text-base text-foreground outline-none focus:border-primary transition-colors"
      />

      {/* Docked, so the button stays in view however tall the step grows. */}
      <div className="sticky bottom-0 z-10 w-full pt-3 pb-1 bg-background/85 backdrop-blur-sm">
        <button
          type="submit"
          disabled={loading || missing}
          className="onb-cta-btn w-full max-w-[320px] mx-auto rounded-full font-semibold text-base bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 disabled:opacity-50 transition-all active:scale-95"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Saving...
            </span>
          ) : "Continue"}
        </button>
        {missing && <p className="text-sm text-muted-foreground mt-2 text-center">Add your first name to continue.</p>}
      </div>
    </form>
  );
}