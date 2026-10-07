import React, { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { PRIVACY_POLICY_VERSION } from "@/lib/appInfo";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import SignUpStep from "@/components/onboarding/SignUpStep";
import WelcomeStep from "@/components/onboarding/steps/WelcomeStep";
import EmpathyStep from "@/components/onboarding/steps/EmpathyStep";
import MedicationStep from "@/components/onboarding/steps/MedicationStep";
import PrivacyStep from "@/components/onboarding/steps/PrivacyStep";
import ScheduleStep from "@/components/onboarding/steps/ScheduleStep";
import TrackingStep from "@/components/onboarding/steps/TrackingStep";
import CompletionStep from "@/components/onboarding/steps/CompletionStep";
import { useAppState } from "@/lib/AppState";
import { OTHERS_LABEL } from "@/lib/medicationConfig";
import {
  buildMedicationWrites, doseSummaryFor, newCatalogueEntry, selectionIsComplete,
} from "@/lib/onboardingMeds";

const TOTAL_STEPS = 8;
// Where the flow is kept while it is being filled in. It is written to the
// device as the answers change, so the app can resume the same step after being
// closed, and cleared the moment onboarding is completed.
const RESUMED_KEY = "levli_onboarding_state";
// Written only across the sign-up reload, which carries the answers collected
// before the account existed.
const SIGNUP_KEY = "onboarding_signup_state";

const FREQUENCY_OPTIONS = [
  { label: "Once weekly", days: "7" },
  { label: "Every two weeks", days: "14" },
  { label: "Once monthly", days: "30" },
  { label: "Daily", days: "1" },
  { label: "Irregular schedule", days: "7" },
];

function isMinor(birthdate) {
  if (!birthdate) return false;
  const [y, m, d] = birthdate.split("-").map(Number);
  const birth = new Date(y, m - 1, d);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age < 18;
}

/**
 * The onboarding flow: a short welcome, the medications and their doses, account
 * creation, consent, the schedule, what to track, and a closing screen.
 *
 * Two things are deliberate here:
 *  - Nothing is written until the last step. The welcome, medication and schedule
 *    answers are held in this one place, so the flow can be walked back and forth
 *    without anything half-saved. The medications become records in a single pass
 *    when the flow is completed, and a medication already saved under the same
 *    name is linked to instead of created again.
 *  - The flow survives the sign-up reload. Signing up has to reload the page so
 *    the session initialises; the answers so far are kept in sessionStorage and
 *    restored, which resumes the flow where it was left off.
 */
export default function Onboarding() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { setProfile, profile, medications, addMedication, updateMedication } = useAppState();

  const [meds, setMeds] = useState([]);
  const [frequency, setFrequency] = useState(null);
  const [shotDay, setShotDay] = useState(null);
  const [tracking, setTracking] = useState([]);
  const [units, setUnits] = useState({ weight_unit: "lb", height_unit: "in", liquid_unit: "oz" });
  const [gdprConsented, setGdprConsented] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  // Signing up reloads the page. Coming back from that reload, going "back" to
  // the sign-up form would try to register an account that already exists, so
  // the back button is withheld for that one step.
  const [resumedAfterSignup, setResumedAfterSignup] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const signup = sessionStorage.getItem(SIGNUP_KEY);
    const stored = signup || localStorage.getItem(RESUMED_KEY);
    if (!stored) return;
    try {
      const data = JSON.parse(stored);
      if (Array.isArray(data.meds)) {
        setMeds(data.meds);
      } else if (Array.isArray(data.selectedMeds)) {
        // Answers saved before the medication step carried doses. Keep them.
        setMeds(data.selectedMeds.filter((n) => n !== OTHERS_LABEL).map((n) => newCatalogueEntry(n)));
      }
      setFrequency(data.frequency || null);
      setShotDay(data.shotDay ?? null);
      setTracking(data.tracking || []);
      setUnits(data.units || { weight_unit: "lb", height_unit: "in", liquid_unit: "oz" });
      setGdprConsented(!!data.gdprConsented);
      setAgeConfirmed(!!data.ageConfirmed);
      setBirthdate(data.birthdate || "");
      setFirstName(data.firstName || "");
      setStep(typeof data.step === "number" ? data.step : 4);
      // The sign-up reload is the only case where going back would re-open a
      // form whose account already exists.
      if (signup) setResumedAfterSignup(true);
    } catch (e) { /* ignore malformed */ }
    sessionStorage.removeItem(SIGNUP_KEY);
  }, []);

  // Keep the answers on the device as the flow moves: closing and reopening the
  // app resumes the step that was left, with everything already filled in.
  useEffect(() => {
    try {
      localStorage.setItem(RESUMED_KEY, JSON.stringify({
        step, meds, frequency, shotDay, tracking, units,
        gdprConsented, birthdate, ageConfirmed, firstName,
      }));
    } catch (e) { /* storage unavailable — the flow still works in memory */ }
  }, [step, meds, frequency, shotDay, tracking, units, gdprConsented, birthdate, ageConfirmed, firstName]);

  if (profile?.onboarding_completed) {
    return <Navigate to="/" replace />;
  }

  const canContinue = (() => {
    if (saving) return false;
    if (step === 2) return selectionIsComplete(meds);
    if (step === 4) return gdprConsented && !!birthdate && ageConfirmed && !isMinor(birthdate);
    if (step === 5) return frequency !== null;
    return true;
  })();

  // Sign-up requires a page reload to initialise the auth session, so the
  // answers collected so far are kept and restored after it.
  const persistOnboardingState = (extra = {}) => {
    sessionStorage.setItem(SIGNUP_KEY, JSON.stringify({
      step: 4,
      meds, frequency, shotDay, tracking, units,
      gdprConsented, birthdate, ageConfirmed,
      ...extra,
    }));
  };

  const next = async () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
      return;
    }

    // Completion. The profile is saved first; the medications are written in one
    // pass straight after, so a failure never leaves medications behind without
    // the account that explains them.
    setSaveError("");
    setSaving(true);
    try {
      const freqOption = FREQUENCY_OPTIONS.find((f) => f.label === frequency);
      const daysBetween = freqOption ? freqOption.days : "7";
      const namedMeds = meds.filter((m) => m.name.trim());
      // "Others" only ever names a medication the user typed; with nothing typed
      // there is no medication to prefer, so the first real one is used.
      const defaultMed = (namedMeds.find((m) => !m.isCustom) || namedMeds[0])?.name || "Ozempic®";

      await setProfile({
        ...profile,
        ...(gdprConsented
          ? { gdpr_consent_date: new Date().toISOString(), gdpr_privacy_policy_version: PRIVACY_POLICY_VERSION }
          : {}),
        first_name: firstName,
        default_medication: defaultMed,
        days_between: daysBetween,
        ...units,
        birthdate,
        age_confirmed_at: ageConfirmed ? new Date().toISOString() : "",
        onboarding_completed: true,
        weight_tracking_opted_in: tracking.includes("weight"),
      });

      const { creates, updates } = buildMedicationWrites(meds, {
        frequency: frequency || "",
        savedRegimens: medications,
      });
      await Promise.all([
        ...creates.map((record) => addMedication(record)),
        ...updates.map(({ id, ...patch }) => updateMedication(id, patch)),
      ]);

      // The flow is done: nothing is left to resume.
      try { localStorage.removeItem(RESUMED_KEY); } catch (e) { /* ignore */ }
      navigate("/");
    } catch (err) {
      setSaveError(err?.message || "We couldn't finish setting up. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  const ctaLabel =
    saving ? "Setting up…" :
    step === 0 ? "Get started" :
    step === 4 ? "Allow & continue" :
    step === 7 ? "Go to Home" : "Next";

  const secondaryAction =
    step === 0
      ? { label: "I already have an account", onClick: () => navigate("/login") }
      : null;

  return (
    <OnboardingScreen
      step={step}
      totalSteps={TOTAL_STEPS}
      onContinue={next}
      onBack={back}
      ctaLabel={ctaLabel}
      canContinue={canContinue}
      hideFooter={step === 3}
      hideBack={step === 4 && resumedAfterSignup}
      secondaryAction={secondaryAction}
      errorMessage={saveError}
    >
      {step === 0 && <WelcomeStep />}
      {step === 1 && <EmpathyStep />}
      {step === 2 && <MedicationStep meds={meds} setMeds={setMeds} savedRegimens={medications} />}
      {step === 3 && <SignUpStep persistState={persistOnboardingState} />}
      {step === 4 && (
        <PrivacyStep
          gdprConsented={gdprConsented}
          setGdprConsented={setGdprConsented}
          birthdate={birthdate}
          setBirthdate={setBirthdate}
          ageConfirmed={ageConfirmed}
          setAgeConfirmed={setAgeConfirmed}
          minor={isMinor(birthdate)}
        />
      )}
      {step === 5 && (
        <ScheduleStep
          frequency={frequency}
          setFrequency={setFrequency}
          shotDay={shotDay}
          setShotDay={setShotDay}
          frequencyOptions={FREQUENCY_OPTIONS}
          doseSummary={doseSummaryFor(meds)}
        />
      )}
      {step === 6 && (
        <TrackingStep tracking={tracking} setTracking={setTracking} units={units} setUnits={setUnits} />
      )}
      {step === 7 && <CompletionStep />}
    </OnboardingScreen>
  );
}