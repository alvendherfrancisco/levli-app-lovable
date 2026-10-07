import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { DISCLAIMER_TEXT, PRIVACY_POLICY_VERSION } from "@/lib/appInfo";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import SignUpStep from "@/components/onboarding/SignUpStep";
import {
  WelcomeIllustration,
  EmpathyIllustration,
  MedicationIllustration,
  PrivacyIllustration,
  CompletionIllustration,
} from "@/components/onboarding/OnboardingIllustrations";
import { PillIcon } from "@/components/onboarding/LevliIcons";
import OnboardingArt from "@/components/onboarding/OnboardingArt";
import TrackingStep, { SUGGESTED_TRACKING } from "@/components/onboarding/TrackingStep";
import { useAppState } from "@/lib/AppState";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import {
  saveDraft, loadDraft, clearDraft, markProviderRedirect, takeProviderRedirect,
  firstNameFromUser,
} from "@/lib/onboardingDraft";
import FirstNameStep from "@/components/onboarding/FirstNameStep";
import ScheduleStep from "@/components/onboarding/ScheduleStep";
import { getDoseUnit, getMedicationConfig } from "@/lib/medicationConfig";
import { NAME_TO_ENTRY, getMolecularClass, COMPOUNDED_SEMAGLUTIDE, COMPOUNDED_TIRZEPATIDE } from "@/lib/medicationCatalogue";
import { toDayKey } from "@/lib/dateUtils";
import {
  emptySchedule, getDayInterval, medicationScheduleFields, validateScheduleSelection,
} from "@/lib/medicationSchedule";
import { Check } from "lucide-react";
import { sound } from "@/lib/sounds";

const TOTAL_STEPS = 8;

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

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { setProfile, profile, medications, addMedication } = useAppState();
  const { user, isLoadingAuth } = useAuth();

  const [selectedMeds, setSelectedMeds] = useState([]);
  // The primary medication's dose and schedule. Every one of these belongs to
  // the medication it was answered for, so all of it resets when that changes
  // (see selectMedication).
  const [doseAmount, setDoseAmount] = useState("");
  const [doseOther, setDoseOther] = useState(false);
  const [schedule, setSchedule] = useState(() => emptySchedule("", toDayKey(new Date())));
  // Suggestions to start from, not decisions: both are ordinary selections the
  // person can untick, and Next never waits on any of them.
  const [tracking, setTracking] = useState(SUGGESTED_TRACKING);
  const [units, setUnits] = useState({ weight_unit: "lb", height_unit: "in", liquid_unit: "oz" });
  const [gdprConsented, setGdprConsented] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [parentalConsentName, setParentalConsentName] = useState("");
  // The account step's two text fields live here rather than inside that step:
  // they are part of what has to survive a reload, or a trip out to a provider.
  const [accountEmail, setAccountEmail] = useState("");
  // A provider signed in but returned no name, so the account step asks for the
  // first name and nothing else.
  const [nameOnly, setNameOnly] = useState(false);
  const [providerNotice, setProviderNotice] = useState("");
  // What the draft records about the account itself.
  const [verifiedAccount, setVerifiedAccount] = useState(false);
  const [awaitingVerification, setAwaitingVerification] = useState(false);

  // ── The answers, held on the device ───────────────────────────────────────
  // Onboarding is answered before anyone is signed in, and the account step can
  // reload the page (email verification) or leave it altogether (a provider
  // sign-in). So every answer is restored from, and written back to, this
  // device's draft — see src/lib/onboardingDraft.js.
  const firstSaveRef = useRef(true);

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      const restoredMeds = (draft.selectedMeds || []).slice(0, 1);
      setSelectedMeds(restoredMeds);
      setDoseAmount(draft.doseAmount || "");
      setDoseOther(!!draft.doseOther);
      setSchedule(draft.schedule || emptySchedule(restoredMeds[0], toDayKey(new Date())));
      // A draft always carries the person's own choice, including "none of
      // them"; only a draft written before these cards existed falls back to
      // the suggestions.
      setTracking(Array.isArray(draft.tracking) ? draft.tracking : SUGGESTED_TRACKING);
      setUnits(draft.units || { weight_unit: "lb", height_unit: "in", liquid_unit: "oz" });
      setGdprConsented(!!draft.gdprConsented);
      setAgeConfirmed(!!draft.ageConfirmed);
      setBirthdate(draft.birthdate || "");
      setParentalConsentName(draft.parentalConsentName || "");
      setFirstName(draft.firstName || "");
      setAccountEmail(draft.email || "");
      setAwaitingVerification(!!draft.awaitingVerification);
      setVerifiedAccount(draft.verified === true);
      setStep(typeof draft.step === "number" ? draft.step : 0);
    }
  }, []);

  // Written as it is given, so going back, reloading, or leaving the page for a
  // provider can never lose an answer. The first run is the restore above and is
  // skipped, so an empty first render never overwrites what is already stored.
  useEffect(() => {
    if (firstSaveRef.current) { firstSaveRef.current = false; return; }
    saveDraft({
      step, selectedMeds, doseAmount, doseOther, schedule, tracking, units,
      gdprConsented, birthdate, ageConfirmed, parentalConsentName, firstName,
      email: accountEmail, awaitingVerification, verified: verifiedAccount,
    });
  }, [
    step, selectedMeds, doseAmount, doseOther, schedule, tracking, units,
    gdprConsented, birthdate, ageConfirmed, parentalConsentName, firstName,
    accountEmail, awaitingVerification, verifiedAccount,
  ]);

  // ── The account step settles itself ───────────────────────────────────────
  // With a session that step is already answered (a provider sign-in, or an
  // account that already exists), so onboarding carries on at the next step and
  // the account screen is never shown. Without one, this page load is either a
  // cancelled sign-in or a reload before verification, and the account step is
  // exactly where it belongs.
  useEffect(() => {
    if (isLoadingAuth) return;
    const returnedFromProvider = takeProviderRedirect();

    if (user) {
      if (step !== 3) return;
      const name = firstNameFromUser(user);
      if (name) {
        setFirstName((prev) => prev || name);
        setStep(4);
      } else {
        setNameOnly(true);
      }
      return;
    }

    if (returnedFromProvider) {
      setProviderNotice("That sign-in was cancelled, so nothing was saved. Try again, or create your account with your email below.");
    }
    // No session, and this account was never verified: the account step is still
    // the one thing that has to happen before anything more can be saved.
    if (!verifiedAccount && step > 3) setStep(3);
  }, [isLoadingAuth, user, step, verifiedAccount]);

  if (profile?.onboarding_completed) {
    return <Navigate to="/" replace />;
  }

  // The primary medication, and what is still missing from its schedule. Only
  // the controls the chosen frequency shows are ever required.
  const primaryMedication = selectedMeds[0] || "";
  const doseUnit = getDoseUnit(primaryMedication);
  const scheduleIssue = validateScheduleSelection({
    medication: primaryMedication,
    kind: schedule.kind,
    reminderDays: schedule.reminderDays,
    intervalDays: schedule.intervalDays,
    startDate: schedule.startDate,
    needsStartDate: true,
  });

  const canContinue = (() => {
    if (step === 2) return selectedMeds.length > 0;
    if (step === 4) return gdprConsented && birthdate && ageConfirmed && !isMinor(birthdate);
    if (step === 5) return !scheduleIssue;
    return true;
  })();

  /**
   * Picking a medication replaces the answers that belong to the previous one.
   * Onboarding asks about the primary medication only, so this is one choice:
   * the schedule and the dose start again from the new product's own defaults,
   * and nothing from the old one is left behind.
   */
  const selectMedication = (med) => {
    const next = primaryMedication === med ? "" : med;
    setSelectedMeds(next ? [next] : []);
    setSchedule(emptySchedule(next, toDayKey(new Date())));
    setDoseAmount("");
    setDoseOther(false);
  };

  // The account step's hand-off: everything answered so far, plus whatever that
  // step needs carried with it (the first name, the address awaiting a code, the
  // step to resume at).
  const persistOnboardingState = (extra = {}) => {
    saveDraft({
      step: 4,
      selectedMeds, doseAmount, doseOther, schedule, tracking, units,
      gdprConsented, birthdate, ageConfirmed, parentalConsentName,
      firstName, email: accountEmail, verified: verifiedAccount, awaitingVerification,
      ...extra,
    });
  };

  /**
   * Hands off to the provider's own page. Everything answered so far is on the
   * device before we leave, and the marker says a return is pending — so a
   * cancelled sign-in comes back to this screen with its answers intact.
   */
  const startProvider = (provider) => {
    persistOnboardingState({ step: 3, verified: false, awaitingVerification: false });
    markProviderRedirect();
    base44.auth.loginWithProvider(provider, "/onboarding");
  };

  const next = async () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
      return;
    }
    // Completion — one save carries the consent and the rest of the profile, so
    // the consent record is never written separately (or lost) on the way.
    const chosen = selectedMeds[0] || "";
    const realMed = chosen && chosen !== "Other" ? chosen : "";
    let defaultMed = realMed || "Ozempic®";
    if (!realMed && MED_OPTIONS.some((o) => o.label === chosen && o.generic === "Tirzepatide")) {
      defaultMed = "Zepbound®";
    }

    const intervalDays = getDayInterval(schedule);
    const daysBetween = intervalDays ? String(intervalDays) : "7";
    const weightOptedIn = tracking.includes("weight");

    // The primary medication itself is created once, here, from what was just
    // answered — one record for the one medication onboarding asked about, and
    // none at all when "Other" was picked (that name is added in Medications).
    // If a record for it already exists, it is left exactly as it is.
    if (realMed && !medications.some((m) => m.medication_name === realMed)) {
      const doseValue = Number(String(doseAmount).trim());
      await addMedication({
        medication_name: realMed,
        catalogue_id: NAME_TO_ENTRY[realMed]?.id || "",
        generic_name: getMedicationConfig(realMed)?.genericName || "",
        molecular_class: getMolecularClass(realMed) || "",
        route: getMedicationConfig(realMed)?.route || "",
        ...(Number.isFinite(doseValue) && doseValue > 0
          ? { prescribed_dose: doseValue, dose_unit: doseUnit }
          : {}),
        ...medicationScheduleFields(schedule),
        start_date: schedule.kind === "every_x_days" && schedule.startDate
          ? schedule.startDate
          : toDayKey(new Date()),
        status: "active",
        regimen_source: "user-entered",
        needs_details: false,
      });
    }

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
      weight_tracking_opted_in: weightOptedIn,
    });
    // Those answers now live on the account, so the device's copy of them is done.
    clearDraft();
    navigate("/");
  };

  const back = () => {
    if (step <= 0) return;
    // With a session the account step is already answered, so Back steps over it
    // rather than reopening a screen that would bounce straight forward again.
    const target = step - 1 === 3 && user ? 2 : step - 1;
    setStep(Math.max(0, target));
  };

  const ctaLabel =
    step === 0 ? "Get started" :
    step === 4 ? "Allow & continue" :
    step === 5 ? "Next" :
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
      ctaNote={step === 5 && !canContinue ? scheduleIssue : undefined}
      hideFooter={step === 3}
      secondaryAction={secondaryAction}
    >
      {step === 0 && <WelcomeStep />}
      {step === 1 && <EmpathyStep />}
      {step === 2 && <MedicationStep selectedMed={primaryMedication} onSelect={selectMedication} />}
      {step === 3 && (
        isLoadingAuth ? (
          // The session decides whether this screen is needed at all, so the
          // screen waits for it: no flash of a form that is about to be skipped.
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : user ? (
          nameOnly ? (
            <FirstNameStep
              firstName={firstName}
              setFirstName={setFirstName}
              onContinue={next}
            />
          ) : null
        ) : (
          <SignUpStep
            firstName={firstName}
            setFirstName={setFirstName}
            email={accountEmail}
            setEmail={setAccountEmail}
            persistState={persistOnboardingState}
            onProvider={startProvider}
            notice={providerNotice}
            startAtVerify={awaitingVerification}
          />
        )
      )}
      {step === 4 && (
        <PrivacyStep
          gdprConsented={gdprConsented}
          setGdprConsented={setGdprConsented}
          birthdate={birthdate}
          setBirthdate={setBirthdate}
          ageConfirmed={ageConfirmed}
          setAgeConfirmed={setAgeConfirmed}
        />
      )}
      {step === 5 && (
        <ScheduleStep
          medication={primaryMedication}
          dose={doseAmount}
          onDoseChange={setDoseAmount}
          doseOther={doseOther}
          onDoseOtherChange={setDoseOther}
          schedule={schedule}
          onScheduleChange={setSchedule}
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
    <div className="flex flex-col items-center text-center">
      <OnboardingArt>
        <WelcomeIllustration />
      </OnboardingArt>
      <h1 className="text-[24px] sm:text-[28px] font-bold text-gray-800 mb-3 leading-tight px-2">
        You're starting a journey — we're here for it.
      </h1>
      <p className="text-[15px] sm:text-[16px] text-gray-500 leading-relaxed px-3">
        Levli helps you track your shots, symptoms, and progress, so you can feel more in control, one day at a time.
      </p>
    </div>
  );
}

function EmpathyStep() {
  return (
    <div className="flex flex-col items-center text-center">
      <OnboardingArt>
        <EmpathyIllustration />
      </OnboardingArt>
      <h1 className="text-[24px] sm:text-[28px] font-bold text-gray-800 mb-3 leading-tight px-2">
        GLP-1 journeys aren't always linear.
      </h1>
      <p className="text-[15px] sm:text-[16px] text-gray-500 leading-relaxed px-3">
        Good days, hard days, plateaus — Levli helps you notice the patterns, so you're never guessing alone.
      </p>
    </div>
  );
}

/**
 * The primary medication — one choice, not a list. Onboarding sets up the
 * medication a person is mainly on; anything else is added afterwards, from
 * Home or Medications, so every onboarding screen stays the same length.
 */
function MedicationStep({ selectedMed, onSelect }) {
  return (
    <div className="flex flex-col">
      <OnboardingArt>
        <MedicationIllustration />
      </OnboardingArt>
      <div className="text-center mb-3">
        <h1 className="text-[24px] sm:text-[28px] font-bold text-gray-800 mb-2 leading-tight px-2">
          Which medication are you on?
        </h1>
        <p className="text-[15px] text-gray-500 leading-relaxed px-2">This helps us tailor your dose schedule and inventory tracking.</p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center" role="group" aria-label="Which medication are you on?">
        {MED_OPTIONS.map((opt) => {
          const selected = selectedMed === opt.label;
          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => { sound.tap(); onSelect(opt.label); }}
              aria-pressed={selected}
              className={`flex items-center gap-2 pl-3 pr-3.5 py-2.5 rounded-full border-2 text-[14px] font-medium transition-all active:scale-95 ${
                selected
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              <PillIcon size={17} />
              {opt.label}
              {selected && <Check size={14} className="text-indigo-600 ml-0.5" strokeWidth={3} />}
            </button>
          );
        })}
      </div>
      <p className="text-[13px] text-gray-500 text-center mt-3 leading-snug px-2">
        Taking more than one? You can add the others after setup.
      </p>
    </div>
  );
}

function PrivacyStep({ gdprConsented, setGdprConsented, birthdate, setBirthdate, ageConfirmed, setAgeConfirmed }) {
  const minor = isMinor(birthdate);
  return (
    <div className="flex flex-col">
      <OnboardingArt>
        <PrivacyIllustration />
      </OnboardingArt>
      <div className="text-center mb-3">
        <h1 className="text-[24px] sm:text-[28px] font-bold text-gray-800 mb-2 leading-tight px-2">
          Your data stays yours.
        </h1>
        <p className="text-[15px] text-gray-600 leading-relaxed px-3">
          Levli is a personal logbook. It doesn't replace your care team, and it never shares your journey without your say-so.
        </p>
      </div>

      {/* Exactly what is stored, where, and why */}
      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-3">
        <p className="text-[15px] font-semibold text-gray-700 mb-1.5">What Levli stores, and why</p>
        <ul className="text-[13px] text-gray-600 space-y-1.5 list-disc list-inside leading-relaxed">
          <li><span className="font-medium">What:</span> what you log — doses, symptoms and side effects, weight, nutrition, journal entries and progress photos.</li>
          <li><span className="font-medium">Where:</span> in your own account, in our encrypted cloud database. Only your sign-in can read it. It is never sold, never used for advertising, and never shared with another person unless you grant them caregiver access.</li>
          <li><span className="font-medium">Why:</span> to show your history, trends and reports back to you. Nothing else.</li>
          <li><span className="font-medium">Your control:</span> export everything as CSV or PDF, or delete your account and all of its data, from Settings at any time.</li>
        </ul>
      </div>

      {/* Health-data consent */}
      <label className="flex items-start gap-3 cursor-pointer bg-gray-50 rounded-2xl p-3.5 border border-gray-100 mb-3">
        <input
          type="checkbox"
          checked={gdprConsented}
          onChange={(e) => { sound.tap(); setGdprConsented(e.target.checked); }}
          className="w-5 h-5 mt-0.5 accent-indigo-600 flex-shrink-0"
        />
        <span className="text-[14px] text-gray-600 leading-relaxed">
          I consent to Levli processing my health data as described above and in the{" "}
          <Link to="/privacy" className="text-indigo-600 underline">Privacy Policy</Link>.
        </span>
      </label>

      {/* Birthdate — used to check the app's 18+ requirement */}
      <div className="mb-2">
        <label className="text-[14px] font-semibold text-gray-600 mb-2 block">Date of birth</label>
        <input
          type="date"
          value={birthdate}
          onChange={(e) => {
            const next = e.target.value;
            setBirthdate(next);
            // The 18+ notice is a validation result, so it uses the app's own
            // error cue; any other date is just a control tap.
            if (isMinor(next)) sound.warning(); else sound.tap();
          }}
          className="w-full border-2 border-gray-200 bg-white rounded-xl px-3.5 py-3 text-[16px] text-gray-700 outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Adult-only confirmation */}
      {minor ? (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 mb-3">
          <p className="text-[15px] font-semibold text-orange-800">Levli is for adults aged 18 and over.</p>
          <p className="text-[13px] text-orange-700 mt-1.5 leading-relaxed">
            The date of birth entered is under 18, so Levli can't be used for health tracking. Please check the date, or come back when you're 18.
          </p>
        </div>
      ) : (
        <label className="flex items-start gap-3 cursor-pointer bg-gray-50 rounded-2xl p-3.5 border border-gray-100 mb-3">
          <input
            type="checkbox"
            checked={ageConfirmed}
            onChange={(e) => { sound.tap(); setAgeConfirmed(e.target.checked); }}
            className="w-5 h-5 mt-0.5 accent-indigo-600 flex-shrink-0"
          />
          <span className="text-[14px] text-gray-600 leading-relaxed">I confirm that I am 18 years or older.</span>
        </label>
      )}

      <p className="text-[12.5px] text-gray-600 leading-relaxed px-1">
        {DISCLAIMER_TEXT} Read the{" "}
        <Link to="/medical-disclaimer" className="text-indigo-600 underline">full medical disclaimer</Link>.
      </p>
    </div>
  );
}

function CompletionStep() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="animate-onb-bounce w-full">
        <OnboardingArt>
          <CompletionIllustration />
        </OnboardingArt>
      </div>
      <h1 className="text-[24px] sm:text-[28px] font-bold text-gray-800 mb-3 leading-tight px-2">
        You're all set.
      </h1>
      <p className="text-[15px] sm:text-[16px] text-gray-500 leading-relaxed px-3">
        Your Home is ready — next shot, mood, and progress, all in one calm place.
      </p>
    </div>
  );
}