import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { PRIVACY_POLICY_VERSION } from "@/lib/appInfo";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import SignUpStep from "@/components/onboarding/SignUpStep";
import {
  WelcomeIllustration,
  EmpathyIllustration,
  PrivacyIllustration,
  CompletionIllustration,
} from "@/components/onboarding/OnboardingIllustrations";
import MedicationStep, { MED_OPTIONS } from "@/components/onboarding/MedicationStep";
import OnboardingArt from "@/components/onboarding/OnboardingArt";
import DateField from "@/components/DateField";
import TrackingStep, { SUGGESTED_TRACKING } from "@/components/onboarding/TrackingStep";
import { useAppState } from "@/lib/AppState";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import {
  saveDraft, loadDraft, clearDraft, markProviderRedirect, takeProviderRedirect,
  firstNameFromUser,
} from "@/lib/onboardingDraft";
import ScheduleStep from "@/components/onboarding/ScheduleStep";
import { getDoseUnit, getMedicationConfig } from "@/lib/medicationConfig";
import { NAME_TO_ENTRY, getMolecularClass } from "@/lib/medicationCatalogue";
import { toDayKey } from "@/lib/dateUtils";
import {
  emptySchedule, getDayInterval, medicationScheduleFields, validateScheduleSelection,
} from "@/lib/medicationSchedule";
import { Check, ClipboardList, Settings2, ShieldCheck } from "lucide-react";
import { sound } from "@/lib/sounds";
import {
  CARD, CARD_GAP, CHECK_CIRCLE, CHECK_CIRCLE_OFF, CHECK_CIRCLE_ON,
  HEADING, HEAD_BLOCK, HELP_ON_SCREEN, ICON_CIRCLE, LINK_UNDERLINE, LIST_VALUE, SUBTITLE,
} from "@/lib/uiStyles";

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

// What the privacy screen says, in three short rows: what is stored, where it
// lives, and how it can be taken back.
const PRIVACY_POINTS = [
  { icon: ClipboardList, label: "What", value: "Your doses, symptoms, weight and photos." },
  { icon: ShieldCheck, label: "Where", value: "Encrypted in your account. Never sold or shared." },
  { icon: Settings2, label: "Your control", value: "Export or delete everything anytime." },
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
  const [providerNotice, setProviderNotice] = useState("");
  // What the draft records about the account itself.
  const [verifiedAccount, setVerifiedAccount] = useState(false);
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  // Whether Next has been tapped on the schedule screen while it was not ready.
  // What is still missing is only said after that tap, never before it.
  const [scheduleNudge, setScheduleNudge] = useState(false);

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
      // The name comes from the provider when it gave one. When it did not, the
      // account simply carries on without it: a name is optional, and Profile is
      // where it can be added later.
      setFirstName((prev) => prev || firstNameFromUser(user));
      setStep(4);
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

  // The one line the schedule screen shows when Next is tapped too early: the
  // frequency itself when that is what is missing, otherwise the control that
  // still has to be filled in.
  const scheduleNote = schedule.kind ? scheduleIssue : "Choose how often you take it.";

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
    setScheduleNudge(false);
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

  // Anything tapped on the schedule screen answers what that notice was about,
  // so it goes as soon as a choice is made.
  const changeSchedule = (nextSchedule) => {
    setScheduleNudge(false);
    setSchedule(nextSchedule);
  };

  const ctaLabel =
    step === 0 ? "Get started" :
    step === 4 ? "Allow & continue" :
    step === 5 ? "Next" :
    step === 7 ? "Go to Home" : "Next";

  return (
    <OnboardingScreen
      step={step}
      totalSteps={TOTAL_STEPS}
      onContinue={next}
      onBack={back}
      ctaLabel={ctaLabel}
      canContinue={canContinue}
      ctaNote={step === 5 && scheduleNudge ? scheduleNote : undefined}
      onBlockedContinue={step === 5 ? () => setScheduleNudge(true) : undefined}
      revealIssues={step === 5}
      hideFooter={step === 3}
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
          // A session means this step is already answered, and the effect above
          // has just moved on to the next one.
          null
        ) : (
          <SignUpStep
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
          onScheduleChange={changeSchedule}
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
      <div className={HEAD_BLOCK}>
        <h1 className={HEADING}>You're starting a journey. We're here for it.</h1>
        <p className={SUBTITLE}>Track your shots, symptoms, and progress in one place.</p>
      </div>
    </div>
  );
}

function EmpathyStep() {
  return (
    <div className="flex flex-col items-center text-center">
      <OnboardingArt>
        <EmpathyIllustration />
      </OnboardingArt>
      <div className={HEAD_BLOCK}>
        <h1 className={HEADING}>GLP-1 journeys aren't always linear.</h1>
        <p className={SUBTITLE}>Good days, hard days, plateaus. Levli helps you notice the patterns.</p>
      </div>
    </div>
  );
}

function PrivacyStep({ gdprConsented, setGdprConsented, birthdate, setBirthdate, setAgeConfirmed }) {
  const minor = isMinor(birthdate);

  // The date itself is the age check: a complete, real date is the whole
  // confirmation, and the one thing this screen refuses is a date under 18.
  const handleBirthdate = (iso) => {
    setBirthdate(iso);
    setAgeConfirmed(!!iso && !isMinor(iso));
    // The 18+ notice is a validation result, so it uses the app's own error
    // cue; any other date is just a control tap.
    if (iso && isMinor(iso)) sound.warning(); else sound.tap();
  };

  return (
    <div className="flex flex-col">
      <OnboardingArt>
        <PrivacyIllustration />
      </OnboardingArt>
      <div className={HEAD_BLOCK}>
        <h1 className={HEADING}>Your data stays yours.</h1>
        <p className={SUBTITLE}>Levli is your personal logbook. Your data stays private.</p>
      </div>

      {/* What, where, and how to take it back — three short rows, no essay. */}
      <div className={`${CARD} ${CARD_GAP}`}>
        <div className="space-y-4">
          {PRIVACY_POINTS.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <span className={ICON_CIRCLE}>
                <Icon size={20} strokeWidth={1.5} className="text-indigo-600" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[16px] font-medium text-gray-900">{label}</p>
                <p className={LIST_VALUE}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Health-data consent — one compact row */}
      <label className={`${CARD} ${CARD_GAP} flex cursor-pointer items-start gap-3`}>
        <input
          type="checkbox"
          checked={gdprConsented}
          onChange={(e) => { sound.tap(); setGdprConsented(e.target.checked); }}
          className="sr-only"
        />
        <span
          aria-hidden="true"
          className={`mt-0.5 ${CHECK_CIRCLE} ${gdprConsented ? CHECK_CIRCLE_ON : CHECK_CIRCLE_OFF}`}
        >
          {gdprConsented && <Check size={13} strokeWidth={2.5} />}
        </span>
        <span className="text-[15px] leading-snug text-gray-500">
          I agree to the processing of my health data.{" "}
          <Link to="/privacy" className={LINK_UNDERLINE}>Privacy Policy</Link>
        </span>
      </label>

      {/* Date of birth — the age check itself */}
      <div className={`${CARD} ${CARD_GAP}`}>
        <DateField
          id="birthdate"
          label="Date of birth"
          value={birthdate}
          onChange={handleBirthdate}
          error={minor ? "You must be 18 or older to use Levli." : ""}
        />
      </div>

      <p className={HELP_ON_SCREEN}>
        Levli is a logbook, not medical advice.{" "}
        <Link to="/medical-disclaimer" className={LINK_UNDERLINE}>Read more</Link>
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
      <div className={HEAD_BLOCK}>
        <h1 className={HEADING}>You're all set.</h1>
        <p className={SUBTITLE}>Your Home is ready. Track your next shot, mood, and progress in one place.</p>
      </div>
    </div>
  );
}