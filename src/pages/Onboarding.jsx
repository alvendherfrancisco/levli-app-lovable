import React, { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import SignUpStep from "@/components/onboarding/SignUpStep";
import {
  WelcomeIllustration,
  EmpathyIllustration,
  MedicationIllustration,
  ScheduleIllustration,
  TrackingIllustration,
  PrivacyIllustration,
  CompletionIllustration,
} from "@/components/onboarding/OnboardingIllustrations";
import {
  PillIcon,
  MoodIcon,
  HeartIcon,
  ScaleIcon,
  NutritionIcon,
  InjectionSiteIcon,
} from "@/components/onboarding/LevliIcons";
import { useAppState } from "@/lib/AppState";
import { MEDICATIONS } from "@/lib/medicationData";
import { COMPOUNDED_SEMAGLUTIDE, COMPOUNDED_TIRZEPATIDE } from "@/lib/medicationCatalogue";
import { Check } from "lucide-react";

const TOTAL_STEPS = 8;
const PRIVACY_POLICY_VERSION = "1.0";

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

const MED_OPTIONS = [
  { label: "Mounjaro®", generic: "Tirzepatide" },
  { label: "Wegovy®", generic: "Semaglutide" },
  { label: "Ozempic®", generic: "Semaglutide" },
  { label: "Zepbound®", generic: "Tirzepatide" },
  { label: "Saxenda®", generic: "Liraglutide" },
  { label: "Rybelsus®", generic: "Semaglutide" },
  { label: COMPOUNDED_SEMAGLUTIDE, generic: "Semaglutide" },
  { label: COMPOUNDED_TIRZEPATIDE, generic: "Tirzepatide" },
  { label: "Other", generic: null },
];

const FREQUENCY_OPTIONS = [
  { label: "Once weekly", days: "7" },
  { label: "Every two weeks", days: "14" },
  { label: "Once monthly", days: "30" },
  { label: "Daily", days: "1" },
  { label: "Irregular schedule", days: "7" },
];

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

const TRACKING_OPTIONS = [
  { key: "symptoms", label: "Symptoms", desc: "Note how you're feeling day to day", Icon: MoodIcon },
  { key: "mood", label: "Mood", desc: "Track emotional wellbeing", Icon: HeartIcon },
  { key: "weight", label: "Weight", desc: "Monitor progress over time", Icon: ScaleIcon },
  { key: "nutrition", label: "Nutrition", desc: "Log meals, water, and protein", Icon: NutritionIcon },
  { key: "sites", label: "Injection sites", desc: "Rotate with confidence", Icon: InjectionSiteIcon },
];

const UNIT_GROUPS = [
  { key: "weight_unit", label: "Weight", options: [{ value: "lb", label: "lb" }, { value: "kg", label: "kg" }] },
  { key: "height_unit", label: "Height", options: [{ value: "in", label: "ft / in" }, { value: "cm", label: "cm" }] },
  { key: "liquid_unit", label: "Liquids", options: [{ value: "oz", label: "oz" }, { value: "mL", label: "mL" }] },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { setProfile, profile, recordConsent, recordParentalConsent } = useAppState();

  const [selectedMeds, setSelectedMeds] = useState([]);
  const [doseAmount, setDoseAmount] = useState("");
  const [frequency, setFrequency] = useState(null);
  const [shotDay, setShotDay] = useState(null);
  const [tracking, setTracking] = useState([]);
  const [units, setUnits] = useState({ weight_unit: "lb", height_unit: "in", liquid_unit: "oz" });
  const [gdprConsented, setGdprConsented] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [parentalConsentName, setParentalConsentName] = useState("");

  // Restore onboarding state after sign-up reload (sign-up happens at step 3
  // and requires a page reload to initialise the auth session, so we persist
  // the data collected in steps 1–3 to sessionStorage and restore here).
  useEffect(() => {
    const saved = sessionStorage.getItem("onboarding_signup_state");
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      setSelectedMeds(data.selectedMeds || []);
      setDoseAmount(data.doseAmount || "");
      setFrequency(data.frequency || null);
      setShotDay(data.shotDay ?? null);
      setTracking(data.tracking || []);
      setUnits(data.units || { weight_unit: "lb", height_unit: "in", liquid_unit: "oz" });
      setGdprConsented(!!data.gdprConsented);
      setBirthdate(data.birthdate || "");
      setParentalConsentName(data.parentalConsentName || "");
      setFirstName(data.firstName || "");
      setStep(typeof data.step === "number" ? data.step : 4);
    } catch (e) { /* ignore malformed */ }
    sessionStorage.removeItem("onboarding_signup_state");
  }, []);

  if (profile?.onboarding_completed) {
    return <Navigate to="/" replace />;
  }

  const canContinue = (() => {
    if (step === 2) return selectedMeds.length > 0;
    if (step === 4) return gdprConsented && birthdate;
    if (step === 5) return frequency !== null;
    return true;
  })();

  // Sign-up (step 3) requires a page reload to initialise the auth session.
  // Persist the data collected in steps 1–3 so it can be restored after reload.
  const persistOnboardingState = (extra = {}) => {
    sessionStorage.setItem("onboarding_signup_state", JSON.stringify({
      step: 4,
      selectedMeds, doseAmount, frequency, shotDay, tracking, units,
      gdprConsented, birthdate, parentalConsentName,
      ...extra,
    }));
  };

  const next = async () => {
    // After the schedule step (5), request notification permission — this is
    // where the value of the permission is obvious to the user ("we'll remind
    // you on this day").  If the user denies or the browser doesn't support
    // push (e.g. iOS without home-screen install), we continue silently; the
    // Settings page shows the iOS home-screen banner if needed.
    if (step === 5) {
      try {
        const { subscribeToPush } = await import("@/lib/pushSubscription");
        const { subObj, isNew } = await subscribeToPush();
        await setProfile({
          ...profile,
          notifications_enabled: true,
          notif_shot_reminders: true,
          notif_inventory_alerts: true,
        });
      } catch (e) {
        console.log("Notification permission not granted:", e.message);
      }
    }

    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
      return;
    }
    // Completion — record consents + save profile
    if (gdprConsented) await recordConsent(PRIVACY_POLICY_VERSION);
    if (isMinor(birthdate) && parentalConsentName.trim()) await recordParentalConsent(parentalConsentName);

    const realMeds = selectedMeds.filter((m) => m !== "Other");
    let defaultMed = "Ozempic®";
    if (realMeds.length && MEDICATIONS.includes(realMeds[0])) {
      defaultMed = realMeds[0];
    } else if (realMeds.some((m) => MED_OPTIONS.find((o) => o.label === m)?.generic === "Tirzepatide")) {
      defaultMed = "Zepbound®";
    }

    const freqOption = FREQUENCY_OPTIONS.find((f) => f.label === frequency);
    const daysBetween = freqOption ? freqOption.days : "7";

    // Auto-enable weight reminders if the user opted into weight tracking
    const weightOptedIn = tracking.includes("weight");

    await setProfile({
      ...profile,
      first_name: firstName,
      default_medication: defaultMed,
      days_between: daysBetween,
      ...units,
      birthdate,
      onboarding_completed: true,
      weight_tracking_opted_in: weightOptedIn,
      notif_weight_reminders: weightOptedIn,
    });
    navigate("/");
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  const ctaLabel =
    step === 0 ? "Get started" :
    step === 4 ? "Allow & continue" :
    step === 5 ? "Allow reminders" :
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
      secondaryAction={secondaryAction}
    >
      {step === 0 && <WelcomeStep />}
      {step === 1 && <EmpathyStep />}
      {step === 2 && <MedicationStep selectedMeds={selectedMeds} setSelectedMeds={setSelectedMeds} />}
      {step === 3 && <SignUpStep persistState={persistOnboardingState} />}
      {step === 4 && (
        <PrivacyStep
          gdprConsented={gdprConsented}
          setGdprConsented={setGdprConsented}
          birthdate={birthdate}
          setBirthdate={setBirthdate}
          parentalConsentName={parentalConsentName}
          setParentalConsentName={setParentalConsentName}
        />
      )}
      {step === 5 && (
        <ScheduleStep
          doseAmount={doseAmount}
          setDoseAmount={setDoseAmount}
          frequency={frequency}
          setFrequency={setFrequency}
          shotDay={shotDay}
          setShotDay={setShotDay}
        />
      )}
      {step === 6 && (
        <TrackingStep tracking={tracking} setTracking={setTracking} units={units} setUnits={setUnits} />
      )}
      {step === 7 && <CompletionStep />}
    </OnboardingScreen>
  );
}

// ── Step components ─────────────────────────────────────────────────────────

function WelcomeStep() {
  return (
    <div className="flex flex-col items-center text-center flex-1 justify-center">
      <WelcomeIllustration />
      <h1 className="text-2xl sm:text-[28px] font-bold text-gray-800 mt-5 mb-3 leading-tight px-2">
        You're starting a journey — we're here for it.
      </h1>
      <p className="text-gray-500 text-sm sm:text-base leading-relaxed px-3">
        Levli helps you track your shots, symptoms, and progress, so you can feel more in control, one day at a time.
      </p>
    </div>
  );
}

function EmpathyStep() {
  return (
    <div className="flex flex-col items-center text-center flex-1 justify-center">
      <EmpathyIllustration />
      <h1 className="text-2xl sm:text-[28px] font-bold text-gray-800 mt-5 mb-3 leading-tight px-2">
        GLP-1 journeys aren't always linear.
      </h1>
      <p className="text-gray-500 text-sm sm:text-base leading-relaxed px-3">
        Good days, hard days, plateaus — Levli helps you notice the patterns, so you're never guessing alone.
      </p>
    </div>
  );
}

function MedicationStep({ selectedMeds, setSelectedMeds }) {
  const toggle = (med) => {
    setSelectedMeds((prev) =>
      prev.includes(med) ? prev.filter((m) => m !== med) : [...prev, med]
    );
  };
  return (
    <div className="flex flex-col flex-1">
      <MedicationIllustration />
      <div className="text-center mt-3 mb-5">
        <h1 className="text-2xl sm:text-[28px] font-bold text-gray-800 mb-2 leading-tight px-2">
          Which medication are you on?
        </h1>
        <p className="text-gray-500 text-sm">This helps us tailor your dose schedule and inventory reminders.</p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {MED_OPTIONS.map((opt) => {
          const selected = selectedMeds.includes(opt.label);
          return (
            <button
              key={opt.label}
              onClick={() => toggle(opt.label)}
              className={`flex items-center gap-1.5 pl-2.5 pr-3.5 py-2.5 rounded-full border-2 text-sm font-medium transition-all active:scale-95 ${
                selected
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              <PillIcon size={20} />
              {opt.label}
              {selected && <Check size={14} className="text-indigo-600 ml-0.5" strokeWidth={3} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ScheduleStep({ doseAmount, setDoseAmount, frequency, setFrequency, shotDay, setShotDay }) {
  return (
    <div className="flex flex-col flex-1">
      <ScheduleIllustration />
      <div className="text-center mt-3 mb-4">
        <h1 className="text-2xl sm:text-[28px] font-bold text-gray-800 mb-2 leading-tight px-2">
          Let's set your shot schedule.
        </h1>
        <p className="text-gray-500 text-sm px-2">
          We'll gently remind you — no more wondering "did I already take it this week?"
        </p>
      </div>
      {/* Dose amount */}
      <div className="mb-4">
        <label className="text-sm font-semibold text-gray-600 mb-2 block">Your dose (optional)</label>
        <input
          type="text"
          value={doseAmount}
          onChange={(e) => setDoseAmount(e.target.value)}
          placeholder="e.g. 0.5 mg"
          className="w-full border-2 border-gray-200 bg-white rounded-xl px-4 py-3 text-base text-gray-700 outline-none focus:border-indigo-500 transition-colors"
        />
      </div>
      {/* Frequency */}
      <div className="mb-4">
        <label className="text-sm font-semibold text-gray-600 mb-2 block">How often?</label>
        <div className="flex flex-wrap gap-2">
          {FREQUENCY_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => setFrequency(opt.label)}
              className={`px-3.5 py-2.5 rounded-xl border-2 text-sm font-medium transition-all active:scale-95 ${
                frequency === opt.label
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      {/* Day of week */}
      <div>
        <label className="text-sm font-semibold text-gray-600 mb-2 block">Preferred day</label>
        <div className="flex gap-1.5 justify-between">
          {DAYS.map((d, i) => (
            <button
              key={i}
              onClick={() => setShotDay(i)}
              className={`w-10 h-10 rounded-full text-sm font-medium transition-all active:scale-95 ${
                shotDay === i
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrackingStep({ tracking, setTracking, units, setUnits }) {
  const toggle = (key) => {
    setTracking((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };
  return (
    <div className="flex flex-col flex-1">
      <TrackingIllustration />
      <div className="text-center mt-3 mb-4">
        <h1 className="text-2xl sm:text-[28px] font-bold text-gray-800 mb-2 leading-tight px-2">
          What would you like to keep an eye on?
        </h1>
        <p className="text-gray-500 text-sm px-2">
          Log symptoms, mood, weight, or injection sites — as much or as little as feels right for you.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 mb-4">
        {TRACKING_OPTIONS.map((opt) => {
          const selected = tracking.includes(opt.key);
          return (
            <button
              key={opt.key}
              onClick={() => toggle(opt.key)}
              className={`flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
                selected
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                <opt.Icon size={32} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${selected ? "text-indigo-700" : "text-gray-700"}`}>
                  {opt.label}
                </p>
                <p className="text-xs text-gray-400">{opt.desc}</p>
              </div>
              {selected && <Check size={18} className="text-indigo-600 flex-shrink-0" strokeWidth={3} />}
            </button>
          );
        })}
      </div>
      {/* Units */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-sm font-semibold text-gray-600 mb-3">Measurement preferences</p>
        <div className="space-y-2.5">
          {UNIT_GROUPS.map((group) => (
            <div key={group.key} className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{group.label}</span>
              <div className="flex gap-2">
                {group.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setUnits((prev) => ({ ...prev, [group.key]: opt.value }))}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      units[group.key] === opt.value
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PrivacyStep({ gdprConsented, setGdprConsented, birthdate, setBirthdate, parentalConsentName, setParentalConsentName }) {
  const minor = isMinor(birthdate);
  return (
    <div className="flex flex-col flex-1">
      <PrivacyIllustration />
      <div className="text-center mt-3 mb-4">
        <h1 className="text-2xl sm:text-[28px] font-bold text-gray-800 mb-2 leading-tight px-2">
          Your data stays yours.
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed px-3">
          Everything you log is private to you. Levli is a personal tracking companion — it doesn't replace your care team, and it never shares your journey without your say-so.
        </p>
      </div>
      {/* GDPR consent */}
      <label className="flex items-start gap-3 cursor-pointer bg-gray-50 rounded-2xl p-3.5 border border-gray-100 mb-3">
        <input
          type="checkbox"
          checked={gdprConsented}
          onChange={(e) => setGdprConsented(e.target.checked)}
          className="w-5 h-5 mt-0.5 accent-indigo-600 flex-shrink-0"
        />
        <span className="text-sm text-gray-600">
          I consent to Levli processing my special-category health data as described in the Privacy Policy.
        </span>
      </label>
      {/* Birthdate */}
      <div className="mb-3">
        <label className="text-sm font-semibold text-gray-600 mb-2 block">Date of birth</label>
        <input
          type="date"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          className="w-full border-2 border-gray-200 bg-white rounded-xl px-4 py-3 text-base text-gray-700 outline-none focus:border-indigo-500 transition-colors"
        />
      </div>
      {/* Parental consent (if minor) */}
      {minor && (
        <div className="mb-3">
          <label className="text-sm font-semibold text-gray-600 mb-2 block">Parent / guardian name</label>
          <input
            type="text"
            value={parentalConsentName}
            onChange={(e) => setParentalConsentName(e.target.value)}
            placeholder="Full name"
            className="w-full border-2 border-gray-200 bg-white rounded-xl px-4 py-3 text-base text-gray-700 outline-none focus:border-indigo-500 transition-colors"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            A parent or guardian must consent for you to use Levli with health data tracking.
          </p>
        </div>
      )}
    </div>
  );
}

function CompletionStep() {
  return (
    <div className="flex flex-col items-center text-center flex-1 justify-center">
      <div className="animate-onb-bounce">
        <CompletionIllustration />
      </div>
      <h1 className="text-2xl sm:text-[28px] font-bold text-gray-800 mt-5 mb-3 leading-tight px-2">
        You're all set.
      </h1>
      <p className="text-gray-500 text-sm sm:text-base leading-relaxed px-3">
        Your Home is ready — next shot, mood, and progress, all in one calm place.
      </p>
    </div>
  );
}