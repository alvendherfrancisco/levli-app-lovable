import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { toDayKey, todayKey, parseShotDate, byShotMomentDesc } from "@/lib/dateUtils";
import { getPendingDoses, buildShotFromSchedule } from "@/lib/repeatSchedule";
import {
  kgOfEntry, toKg, fromKg, roundKg, heightCmOf,
  detectUnitMismatch, heightCmFromParts, waterText,
} from "@/lib/measure";
import { useAuth } from "@/lib/AuthContext";
import { getIntervalDays, getMedicationConfig } from "@/lib/medicationConfig";
import { scheduleMatchesMedication } from "@/lib/medicationLink";
import { suggestedSite } from "@/lib/injectionSites";
import { supplyUnitOr } from "@/lib/supplyTracking";
import { readCachedProfile, writeCachedProfile, clearCachedProfile } from "@/lib/profileCache";
import { resolveProfileRecords } from "@/lib/profileRecords";
import { perfMark } from "@/lib/perfProbe";
import useAuthEpoch from "@/hooks/useAuthEpoch";
import { listSharedWithMe } from "@/lib/caregiverShare";

const AppStateContext = createContext(null);

/** The device's current light/dark preference. */
function systemPrefersDark() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

const DEFAULT_PROFILE = {
  // Canonical measurements (kg / cm). A new profile starts empty rather than
  // with a made-up height and goal.
  height_cm: null, goal_weight_kg: null,
  height_ft: "", height_in: "", goal_weight: "",
  unit_check_status: "", units_migrated_at: "",
  days_between: "7",
  liquid_unit: "oz", height_unit: "in", weight_unit: "lb",
  default_medication: "Ozempic®", dark_mode: false,
  birthdate: "", gdpr_consent_date: "", gdpr_privacy_policy_version: "",
  age_confirmed_at: "",
  parental_consent_date: "", parental_consent_name: "",
  first_name: "",
  weight_tracking_opted_in: false,
  custom_doses: [],
  prescriber_name: "",
  prescriber_contact: "",
};

// The profile this device last loaded. It answers "Home or onboarding?" and
// "which units?" on the very first frame, so the first screen never waits on a
// round-trip; the fresh copy replaces it a moment later.
const CACHED_PROFILE = readCachedProfile();

export function AppStateProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const authEpoch = useAuthEpoch();
  const [shots, setShots] = useState([]);
  const [shotsLoading, setShotsLoading] = useState(true);
  const [dayMetrics, setDayMetrics] = useState({}); // key: day_key → record
  const [progressPhotosList, setProgressPhotosList] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [profile, setProfileState] = useState(() => (CACHED_PROFILE ? { ...DEFAULT_PROFILE, ...CACHED_PROFILE } : DEFAULT_PROFILE));
  // Seeded from the cached profile, so a save made before the fresh copy lands
  // updates the existing record instead of creating a second one.
  const [profileId, setProfileId] = useState(() => CACHED_PROFILE?.id || null);
  // The same id, readable the instant it is known. Two saves in a row (consent,
  // then the rest of onboarding) must never both see "no profile yet" and each
  // create one, so the id and any create in flight live in refs, not just state.
  const profileIdRef = useRef(CACHED_PROFILE?.id || null);
  const profileCreateRef = useRef(null);
  const rememberProfileId = (id) => {
    profileIdRef.current = id;
    setProfileId(id);
  };
  // The theme the person chose, when the cached profile carries one; until they
  // choose, the device setting governs. index.html resolves the same rule before
  // the first paint, so the window, the splash and this screen already agree.
  const savedThemeChosen = CACHED_PROFILE?.theme_chosen === true;
  const [darkMode, setDarkModeState] = useState(() => (
    savedThemeChosen ? CACHED_PROFILE.dark_mode === true : systemPrefersDark()
  ));
  // Dark mode follows the device setting until the user picks a theme.
  const themeChosenRef = useRef(savedThemeChosen);
  // null means "not known yet" — that is what holds the launch. A cached answer
  // is known already, so the app opens on Home and syncs behind it.
  const [onboardingCompleted, setOnboardingCompleted] = useState(() => (CACHED_PROFILE ? !!CACHED_PROFILE.onboarding_completed : null));

  // ── New entity states ─────────────────────────────────────────────────────
  const [medications, setMedications] = useState([]);
  const [adverseEvents, setAdverseEvents] = useState([]);
  const [proxyAccess, setProxyAccess] = useState([]);
  // Records other people have shared with this account (the caregiver's side).
  const [sharedWithMe, setSharedWithMe] = useState([]);
  const [repeatSchedules, setRepeatSchedules] = useState([]);

  // ── Dark mode ──────────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    // The window chrome (status bar, address bar) takes the colour of the screen
    // behind it, so the top edge never shows a seam. Same two values as the
    // first-paint rule in index.html and --launch-bg in src/index.css.
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", darkMode ? "#15171e" : "#fdfcff");
  }, [darkMode]);

  // Follows the device's light/dark setting until the user chooses a theme.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      if (themeChosenRef.current) return;
      setDarkModeState(query.matches);
      setProfileState((prev) => (prev.dark_mode === query.matches ? prev : { ...prev, dark_mode: query.matches }));
    };
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, [profileId]);

  // Keeps the cached profile in step, so the next launch opens on the right
  // screen without waiting for the network.
  useEffect(() => {
    if (onboardingCompleted === null) return;
    // theme_chosen rides along so the next launch can tell a theme the person
    // picked from one that merely followed the device setting.
    writeCachedProfile({
      ...profile,
      onboarding_completed: onboardingCompleted,
      theme_chosen: themeChosenRef.current,
    });
  }, [profile, onboardingCompleted]);

  // ── One-time migration onto canonical units (kg / cm) ───────────────────────
  // Legacy rows keep their weight, expressed in kilograms, and record the unit
  // they were entered in. Nothing is deleted and nothing is reinterpreted.
  // Reuses the profile and day-metric rows the startup fan-out has already read,
  // so the one-time migration costs no round-trips of its own.
  const migrateUnits = async (profileRow, metricRows) => {
    try {
      const p = profileRow || null;
      if (!p || p.units_migrated_at) return;
      const prefUnit = p.weight_unit || "lb";
      const cm = parseFloat(p.height_cm) || heightCmOf(p) || null;
      const goalKg = parseFloat(p.goal_weight_kg) || toKg(p.goal_weight, prefUnit) || null;
      const stamp = new Date().toISOString();

      await base44.entities.UserProfile.update(p.id, {
        height_cm: cm, goal_weight_kg: goalKg, units_migrated_at: stamp,
      });
      setProfileState((prev) => ({ ...prev, height_cm: cm, goal_weight_kg: goalKg, units_migrated_at: stamp }));

      const updates = (metricRows || [])
        .filter((m) => m.weight != null && (m.weight_unit || prefUnit) !== "kg")
        .map((row) => {
          const kg = kgOfEntry(row, prefUnit);
          if (kg == null) return null;
          return {
            id: row.id,
            weight: kg,
            weight_unit: "kg",
            weight_source_unit: row.weight_unit || prefUnit,
            weight_unit_check: row.weight_unit_check || "migrated",
          };
        })
        .filter(Boolean);
      if (updates.length) await base44.entities.DayMetric.bulkUpdate(updates);
    } catch (err) {
      console.error("Unit migration failed:", err);
    }
  };

  // ── Load all data once authenticated ────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      // Everything independent starts in the same tick. Nothing waits for
      // anything it does not need, and the first screen waits for none of it —
      // the profile it opens from is already on the device.
      const profilePromise = loadProfile();
      const metricsPromise = loadDayMetrics();
      loadJournal();
      loadProgressPhotos();
      loadAdverseEvents();
      loadProxyAccess();
      // Someone else's records, if any have been shared with this account. The
      // call also links an invite addressed to this email, so a share is live the
      // first time the invited person signs in with that address.
      loadSharedWithMe();
      loadRepeatSchedules();
      // Shots and medications are loaded together, so every log can be linked to
      // a regimen before the screens read them.
      const dataPromise = Promise.all([loadShots(), loadMedications()])
        .then(([shotList, medList]) => linkOrphanShots(shotList, medList).then(() => medList))
        .catch((err) => { console.error("Startup data load failed:", err); return []; })
        .then((medList) => { perfMark("startup data loaded"); return medList; });

      const [profileRow, metricRows] = await Promise.all([profilePromise, metricsPromise]);
      // The one-time unit migration writes to the profile and to the day
      // metrics, so it starts once those reads are in — behind the first screen,
      // never in front of it.
      migrateUnits(profileRow, metricRows);
      // The old Stock screen's numbers move onto the medications they name. It
      // writes to the medications, so it waits for them — and like the unit
      // migration it runs behind the first screen, never in front of it.
      migrateSupply(profileRow, await dataPromise);
      // An interval override still held on the profile moves onto the medication
      // it was set for, once, and the profile's copy is cleared.
      migrateIntervalOverride(profileRow, await dataPromise);
    })();
  }, [isAuthenticated, authEpoch]);

  const loadShots = async () => {
    setShotsLoading(true);
    const data = await base44.entities.Shot.list("-date", 500);
    data.sort(byShotMomentDesc);
    setShots(data);
    setShotsLoading(false);
    return data;
  };

  const loadJournal = async () => {
    const data = await base44.entities.JournalEntry.list("-date", 200);
    setJournalEntries(data);
  };

  const loadProfile = async () => {
    const rows = await base44.entities.UserProfile.list("-created_date", 20);
    // One record is kept deterministically (the completed one), never "whichever
    // came first"; any extras are folded into it and removed.
    const { keeper, patch, extras } = resolveProfileRecords(rows);
    const data = keeper ? [{ ...keeper, ...patch }] : [];
    if (keeper && extras.length) mergeDuplicateProfiles(keeper, patch, extras);
    if (data.length > 0) {
      const p = data[0];
      rememberProfileId(p.id);
      // A stored true/false is the user's own choice; anything else follows the
      // device's light/dark setting.
      const hasChoice = p.dark_mode === true || p.dark_mode === false;
      const resolvedDark = hasChoice ? p.dark_mode : systemPrefersDark();
      themeChosenRef.current = hasChoice;
      setProfileState({ ...DEFAULT_PROFILE, ...p, dark_mode: resolvedDark });
      setDarkModeState(resolvedDark);
      setOnboardingCompleted(!!p.onboarding_completed);
    } else {
      themeChosenRef.current = false;
      const prefersDark = systemPrefersDark();
      setProfileState((prev) => ({ ...prev, dark_mode: prefersDark }));
      setDarkModeState(prefersDark);
      setOnboardingCompleted(false);
    }
    return data[0] || null;
  };

  // Folds the values a duplicate holds into the kept record, then deletes the
  // duplicates. The kept record is updated first; if that fails nothing is deleted.
  const mergeDuplicateProfiles = async (keeper, patch, extras) => {
    try {
      if (Object.keys(patch).length) await base44.entities.UserProfile.update(keeper.id, patch);
      await Promise.all(extras.map((e) => base44.entities.UserProfile.delete(e.id)));
    } catch (err) {
      console.error("Could not merge duplicate profile records:", err);
    }
  };

  const loadDayMetrics = async () => {
    const data = await base44.entities.DayMetric.list("-day_key", 500);
    const map = {};
    data.forEach((d) => { map[d.day_key] = d; });
    setDayMetrics(map);
    return data;
  };

  const loadProgressPhotos = async () => {
    const data = await base44.entities.ProgressPhoto.list("created_date", 1000);
    setProgressPhotosList(data);
  };

  const loadMedications = async () => {
    const data = await base44.entities.Medication.list("-created_date", 200);
    setMedications(data);
    return data;
  };

  // ── One source of truth ────────────────────────────────────────────────────
  // Every shot log points at a medication record. A log whose medication is not
  // in Meds yet gets one created from the log itself — from the same name, dose
  // and unit that were recorded — so no entry is orphaned. The log keeps its own
  // snapshot; nothing about it is rewritten.
  const linkOrphanShots = async (shotList = [], medList = []) => {
    const unlinked = shotList.filter((s) => !s.medication_id && s.medication);
    if (!unlinked.length) return;
    let meds = [...medList];

    for (const name of [...new Set(unlinked.map((s) => s.medication))]) {
      if (meds.some((m) => m.medication_name === name)) continue;
      const mine = unlinked.filter((s) => s.medication === name);
      const latest = mine[0];
      const oldest = mine[mine.length - 1];
      const entry = getMedicationConfig(name);
      const interval = getIntervalDays(name);
      try {
        const rec = await base44.entities.Medication.create({
          medication_name: name,
          generic_name: entry?.genericName || entry?.generic || "",
          route: latest.route || "",
          prescribed_dose: latest.dose ?? null,
          dose_unit: latest.dose_unit || "mg",
          frequency: interval === 7 ? "once weekly" : interval === 1 ? "once daily" : "",
          start_date: oldest?.date ? toDayKey(parseShotDate(oldest.date)) : "",
          status: "active",
          regimen_source: "shot-history",
          shots_linked_count: mine.length,
        });
        meds = [rec, ...meds];
      } catch (err) {
        console.error("Could not create the medication for", name, err);
      }
    }

    const updates = unlinked
      .map((s) => {
        const rec = meds.find((m) => m.medication_name === s.medication);
        return rec?.id ? { id: s.id, medication_id: rec.id } : null;
      })
      .filter(Boolean);

    setMedications(meds);
    if (!updates.length) return;
    try {
      await base44.entities.Shot.bulkUpdate(updates.slice(0, 500));
      const byId = {};
      updates.forEach((u) => { byId[u.id] = u.medication_id; });
      setShots((prev) => prev.map((s) => (byId[s.id] ? { ...s, medication_id: byId[s.id] } : s)));
    } catch (err) {
      console.error("Could not link shot logs to their medication:", err);
    }
  };

  const loadAdverseEvents = async () => {
    const data = await base44.entities.AdverseEvent.list("-created_date", 500);
    setAdverseEvents(data);
  };

  // ── One-time move of the old Stock screen onto the medications ─────────────
  // The Stock screen kept a product's count, expiry date and lot number in
  // records of its own. Those records are left exactly as they are: each one's
  // numbers are copied onto the medication it names, which is where they are
  // read now (see src/lib/supplyTracking.js). The profile carries the stamp, so
  // the copy happens once and can never overwrite a count the user has since
  // corrected by hand.
  const migrateSupply = async (profileRow, medList) => {
    try {
      const p = profileRow || null;
      if (!p || p.inventory_migrated_at) return;
      const rows = await base44.entities.Inventory.list("-created_date", 200);
      const stamp = new Date().toISOString();

      for (const row of rows) {
        const name = String(row.product_name || "").trim().toLowerCase();
        const med = (medList || []).find((m) => (row.medication_id && m.id === row.medication_id)
          || (name && String(m.medication_name || "").trim().toLowerCase() === name));
        // A row with no medication to hold it, or one that is already tracking
        // its own supply, is left as it is.
        if (!med || med.track_supply) continue;

        const patch = { track_supply: true };
        const left = Number(row.remaining_quantity);
        if (row.remaining_quantity != null && Number.isFinite(left)) {
          patch.doses_left = Math.max(0, left);
        }
        if (row.quantity_unit) patch.supply_unit = supplyUnitOr(row.quantity_unit, med.medication_name);
        // An opened product is dated by its beyond-use date; the pack expiry is
        // used when the record holds no beyond-use date.
        const expiry = row.in_use_expiry || row.expiry_date || "";
        if (expiry) patch.supply_expiry_date = expiry;
        if (row.lot_number) patch.lot_number = row.lot_number;

        const rec = await base44.entities.Medication.update(med.id, patch);
        setMedications((prev) => prev.map((m) => (m.id === med.id ? { ...m, ...rec } : m)));
      }

      await base44.entities.UserProfile.update(p.id, { inventory_migrated_at: stamp });
      setProfileState((prev) => ({ ...prev, inventory_migrated_at: stamp }));
    } catch (err) {
      console.error("Supply migration failed:", err);
    }
  };

  // ── One-time move of an old interval override onto its medication ──────────
  // The Profile's old Shot Preferences card held a prescriber's interval for the
  // whole account. It belongs to the regimen it was set for, so it is carried
  // onto that medication — which is where the next dose date reads it from now —
  // and the profile's copy is cleared. The stamp makes it a once-only move, so it
  // can never overwrite an interval the user has since set on the regimen.
  const migrateIntervalOverride = async (profileRow, medList) => {
    try {
      const p = profileRow || null;
      if (!p || p.interval_migrated_at) return;
      const legacy = parseInt(String(p.days_between_override ?? ""), 10);
      if (!Number.isFinite(legacy) || legacy <= 0) return;
      const list = medList || [];
      // Nothing to carry it onto yet: leave the stamp unset so it can run later.
      if (!list.length) return;

      const active = list.filter((m) => (m.status || "active") === "active");
      const target = active.find((m) => m.medication_name === p.default_medication)
        || active[0]
        || list[0];
      const stamp = new Date().toISOString();

      if (target && target.custom_interval_days == null) {
        const rec = await base44.entities.Medication.update(target.id, { custom_interval_days: legacy });
        setMedications((prev) => prev.map((m) => (m.id === target.id ? { ...m, ...rec } : m)));
      }
      await base44.entities.UserProfile.update(p.id, { days_between_override: "", interval_migrated_at: stamp });
      setProfileState((prev) => ({ ...prev, days_between_override: "", interval_migrated_at: stamp }));
    } catch (err) {
      console.error("Interval override migration failed:", err);
    }
  };

  const loadProxyAccess = async () => {
    const data = await base44.entities.ProxyAccess.list("-created_date", 100);
    setProxyAccess(data);
  };

  // ── Records shared with this account (the caregiver's side) ────────────────
  // The list comes from the backend, which is also what decides access: only a
  // share that is still active is ever returned. The same call links any invite
  // addressed to this email, which is why accepting one needs no code. A failure
  // here leaves the caregiver's card off Home and never disturbs the rest.
  const loadSharedWithMe = async () => {
    try {
      setSharedWithMe(await listSharedWithMe());
    } catch (err) {
      console.error("Could not load shared records:", err);
    }
  };

  // ── Repeat schedules ──────────────────────────────────────────────────────
  const loadRepeatSchedules = async () => {
    const data = await base44.entities.RepeatSchedule.list("-created_date", 100);
    setRepeatSchedules(data);
  };

  const addRepeatSchedule = async (data) => {
    const rec = await base44.entities.RepeatSchedule.create(data);
    setRepeatSchedules((prev) => [rec, ...prev]);
    return rec;
  };

  const updateRepeatSchedule = async (id, updates) => {
    const rec = await base44.entities.RepeatSchedule.update(id, updates);
    setRepeatSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, ...rec } : s)));
    return rec;
  };

  // One-tap confirm: logs a complete dose for the scheduled occurrence date.
  // Nothing is written until the user confirms.
  const confirmRepeatDose = async (schedule, dayKey) => {
    const injectable = ["subcutaneous", "intramuscular", "intradermal"].includes(schedule.route);
    const shot = buildShotFromSchedule(schedule, dayKey, injectable ? getRecommendedSite(schedule.route) : schedule.site);
    const rec = await addShot(shot);
    await updateRepeatSchedule(schedule.id, { last_confirmed_date: dayKey });
    return rec;
  };

  const skipRepeatDose = async (schedule, dayKey) => {
    const skipped = Array.from(new Set([...(schedule.skipped_dates || []), dayKey]));
    await updateRepeatSchedule(schedule.id, { skipped_dates: skipped });
  };

  // ── Shots CRUD ─────────────────────────────────────────────────────────────
  // Persists ALL fields including route, molecular_class, dose_unit,
  // device_type, reconstitution, and route-specific capture fields.
  const SHOT_FIELDS = [
    "medication", "medication_id", "dose", "dose_unit", "drug_class", "molecular_class",
    "route", "device_type", "concentration", "date", "time", "site", "pain", "notes",
    "dose_source",
    "reconstitution_date", "in_use_expiry",
    "infusion_duration", "clinic_location", "premedication",
    "spray_count", "nostril", "priming",
    "taken_with_food",
    "patch_site", "application_date",
    "body_area", "application_notes",
    "insertion_date", "pump_rate", "site_change_date",
  ];

  /**
   * The record a dose is counted against: by link when the log carries one, by
   * the name it was logged with otherwise.
   */
  const supplyMedication = (idOrName) => medications.find((m) => m.id === idOrName)
    || medications.find((m) => m.medication_name === idOrName)
    || null;

  /**
   * Takes one off (delta -1) or puts one back (delta +1) on a medication's own
   * supply count. Only a medication that is tracking its supply is touched, and
   * one with no count yet has nothing to adjust.
   */
  const adjustSupply = async (idOrName, delta) => {
    const med = supplyMedication(idOrName);
    if (!med?.track_supply) return;
    const left = Number(med.doses_left);
    if (!Number.isFinite(left)) return;
    try {
      const rec = await base44.entities.Medication.update(med.id, {
        doses_left: Math.max(0, left + delta),
      });
      setMedications((prev) => prev.map((m) => (m.id === med.id ? { ...m, ...rec } : m)));
    } catch (err) {
      // The count is a convenience: it is never a reason a log fails to save.
      console.error("Could not update the supply count:", err);
    }
  };

  const addShot = async (shot) => {
    const payload = {};
    SHOT_FIELDS.forEach((f) => {
      if (shot[f] !== undefined && shot[f] !== null) payload[f] = shot[f];
    });
    // Backward-compat: drug_class may arrive as drugClass
    if (shot.drugClass && !payload.drug_class) payload.drug_class = shot.drugClass;
    if (shot.molecularClass && !payload.molecular_class) payload.molecular_class = shot.molecularClass;
    // The local date/time is kept exactly as logged, and the device timezone
    // plus the UTC instant are recorded with it so the entry stays unambiguous.
    try {
      payload.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch (e) {
      payload.timezone = "";
    }
    payload.logged_at_utc = new Date().toISOString();
    // Every shot is linked to its medication record in Meds where one exists.
    if (!payload.medication_id && payload.medication) {
      const regimen = medications.find((m) => m.medication_name === payload.medication && m.status === "active")
        || medications.find((m) => m.medication_name === payload.medication);
      if (regimen) payload.medication_id = regimen.id;
    }
    const rec = await base44.entities.Shot.create(payload);
    setShots((prev) => [rec, ...prev].sort(byShotMomentDesc));
    // The dose counts off the medication's own supply, when it tracks one.
    await adjustSupply(rec.medication_id || rec.medication, -1);
    return rec;
  };

  const updateShot = async (id, updates) => {
    const before = shots.find((s) => s.id === id) || null;
    const rec = await base44.entities.Shot.update(id, updates);
    // Re-sorted, because a moved date changes where the log belongs on the
    // timeline — and so which dose is the latest one.
    setShots((prev) => prev.map((s) => (s.id === id ? { ...s, ...rec } : s)).sort(byShotMomentDesc));
    // A dose edited onto a different medication is counted there instead, so the
    // medication it left gets its one back.
    const wasOn = before ? supplyMedication(before.medication_id || before.medication) : null;
    const nowOn = supplyMedication(rec.medication_id || rec.medication);
    if (wasOn && nowOn && wasOn.id !== nowOn.id) {
      await adjustSupply(wasOn.id, 1);
      await adjustSupply(nowOn.id, -1);
    }
  };

  const deleteShot = async (id) => {
    const shot = shots.find((s) => s.id === id) || null;
    await base44.entities.Shot.delete(id);
    setShots((prev) => prev.filter((s) => s.id !== id));
    // The dose leaves the history, so its one goes back on the supply count.
    if (shot) await adjustSupply(shot.medication_id || shot.medication, 1);
  };

  // ── Day Metrics ────────────────────────────────────────────────────────────
  const getDayMetric = (dayKey) => dayMetrics[dayKey] || null;

  const saveDayMetric = async (dayKey, updates) => {
    const existing = dayMetrics[dayKey];
    let rec;
    if (existing) {
      rec = await base44.entities.DayMetric.update(existing.id, updates);
    } else {
      rec = await base44.entities.DayMetric.create({ day_key: dayKey, ...updates });
    }
    setDayMetrics((prev) => ({ ...prev, [dayKey]: { ...(existing || {}), ...rec } }));
    return rec;
  };

  const getNutrition = (dayKey) => {
    const m = dayMetrics[dayKey];
    // Every one of the five reads as a whole number, water included — only fluid
    // ounces keep a decimal, where the amount was poured in halves (see
    // src/lib/measure.js).
    const whole = (v) => String(Math.round(Number(v) || 0));
    if (!m) return { calories: "0", protein: "0", water: "0", fiber: "0", carbs: "0" };
    return {
      calories: whole(m.calories),
      protein: whole(m.protein),
      water: waterText(m.water, profile?.liquid_unit),
      fiber: whole(m.fiber),
      carbs: whole(m.carbs),
    };
  };

  const saveNutrition = (dayKey, values) => saveDayMetric(dayKey, {
    calories: parseFloat(values.calories) || 0,
    protein: parseFloat(values.protein) || 0,
    water: parseFloat(values.water) || 0,
    fiber: parseFloat(values.fiber) || 0,
    carbs: parseFloat(values.carbs) || 0,
  });

  const getSideEffects = (dayKey) => dayMetrics[dayKey]?.side_effects || "";
  const saveSideEffects = (dayKey, text) => saveDayMetric(dayKey, { side_effects: text });

  // Weight is stored in kilograms; the profile unit is applied for display only.
  const displayWeightUnit = profile?.weight_unit || "lb";
  const getWeightKg = (dayKey) => kgOfEntry(dayMetrics[dayKey], displayWeightUnit);
  const getWeight = (dayKey) => {
    const kg = getWeightKg(dayKey);
    return kg == null ? null : fromKg(kg, displayWeightUnit);
  };
  const saveWeight = (dayKey, val) => {
    const kg = toKg(val, displayWeightUnit);
    if (kg == null) return saveDayMetric(dayKey, { weight: null });
    return saveDayMetric(dayKey, {
      weight: kg,
      weight_unit: "kg",
      weight_source_unit: displayWeightUnit,
      weight_unit_check: "",
    });
  };

  const getExercise = (dayKey) => dayMetrics[dayKey]?.exercise_min ?? null;
  const saveExercise = (dayKey, val) => saveDayMetric(dayKey, { exercise_min: parseFloat(val) || 0 });

  const getProgressPhoto = (dayKey) => dayMetrics[dayKey]?.progress_photo || null;

  // ── Progress Photos (multiple per day) ────────────────────────────────────
  const getPhotosForDay = (dayKey) => progressPhotosList.filter((p) => p.day_key === dayKey);

  const addProgressPhotoRecord = async (dayKey, url) => {
    const rec = await base44.entities.ProgressPhoto.create({ day_key: dayKey, url });
    setProgressPhotosList((prev) => [...prev, rec]);
    await saveDayMetric(dayKey, { progress_photo: url });
    return rec;
  };

  const updateProgressPhotoRecord = async (id, dayKey, url) => {
    const rec = await base44.entities.ProgressPhoto.update(id, { url, day_key: dayKey });
    const dayPhotos = getPhotosForDay(dayKey);
    const isLatest = dayPhotos.length > 0 && dayPhotos[dayPhotos.length - 1].id === id;
    setProgressPhotosList((prev) => prev.map((p) => (p.id === id ? { ...p, ...rec } : p)));
    if (isLatest) await saveDayMetric(dayKey, { progress_photo: url });
    return rec;
  };

  const deleteProgressPhotoRecord = async (id, dayKey) => {
    await base44.entities.ProgressPhoto.delete(id);
    let remainingForDay = [];
    setProgressPhotosList((prev) => {
      const next = prev.filter((p) => p.id !== id);
      remainingForDay = next.filter((p) => p.day_key === dayKey);
      return next;
    });
    const newLatestUrl = remainingForDay.length ? remainingForDay[remainingForDay.length - 1].url : null;
    await saveDayMetric(dayKey, { progress_photo: newLatestUrl });
  };

  const deleteLatestProgressPhoto = async (dayKey) => {
    const dayPhotos = getPhotosForDay(dayKey);
    if (dayPhotos.length > 0) {
      const latest = dayPhotos[dayPhotos.length - 1];
      await deleteProgressPhotoRecord(latest.id, dayKey);
    } else {
      await saveDayMetric(dayKey, { progress_photo: null });
    }
  };

  // ── Journal CRUD ───────────────────────────────────────────────────────────
  const addJournalEntry = async (entry) => {
    const rec = await base44.entities.JournalEntry.create({
      text: entry.text, date: entry.date, time: entry.time,
      mood: entry.mood, mood_color: entry.moodColor || entry.mood_color || "",
      category: entry.category,
    });
    setJournalEntries((prev) => [rec, ...prev]);
    return rec;
  };

  const updateJournalEntry = async (id, updates) => {
    const rec = await base44.entities.JournalEntry.update(id, {
      text: updates.text, date: updates.date, time: updates.time,
      mood: updates.mood, mood_color: updates.moodColor || updates.mood_color || "",
      category: updates.category,
    });
    setJournalEntries((prev) => prev.map((e) => e.id === id ? { ...e, ...rec } : e));
  };

  const deleteJournalEntry = async (id) => {
    await base44.entities.JournalEntry.delete(id);
    setJournalEntries((prev) => prev.filter((e) => e.id !== id));
  };

  // ── Medication (regimen) CRUD ─────────────────────────────────────────────
  const addMedication = async (data) => {
    const rec = await base44.entities.Medication.create(data);
    setMedications((prev) => [rec, ...prev]);
    return rec;
  };

  const updateMedication = async (id, updates) => {
    const before = medications.find((m) => m.id === id) || null;
    const rec = await base44.entities.Medication.update(id, updates);
    setMedications((prev) => prev.map((m) => m.id === id ? { ...m, ...rec } : m));
    // A rename carries the repeat schedule with it — a schedule is future setup,
    // not history. Every shot log keeps the name it was recorded with.
    if (before && rec?.medication_name && rec.medication_name !== before.medication_name) {
      const mine = repeatSchedules.filter((s) => scheduleMatchesMedication(s, before));
      for (const s of mine) {
        await updateRepeatSchedule(s.id, { medication: rec.medication_name, medication_id: id });
      }
    }
    return rec;
  };

  // Archiving keeps the history: the medication leaves the pickers and stops
  // generating schedule dates, and every logged shot stays exactly as it is.
  const archiveMedication = async (id) => {
    const med = medications.find((m) => m.id === id) || null;
    const rec = await base44.entities.Medication.update(id, {
      status: "archived",
      archived_date: todayKey(),
    });
    setMedications((prev) => prev.map((m) => m.id === id ? { ...m, ...rec } : m));
    if (med) {
      const running = repeatSchedules.filter((s) => s.status === "active" && scheduleMatchesMedication(s, med));
      for (const s of running) await updateRepeatSchedule(s.id, { status: "cancelled" });
    }
    return rec;
  };

  // A dose typed through "Other" is remembered on the medication itself, so it
  // is offered as a chip next time that medication is logged.
  const addMedicationCustomDose = async (medicationId, dose) => {
    const med = medications.find((m) => m.id === medicationId);
    const value = Number(dose);
    if (!med || !Number.isFinite(value) || value <= 0) return;
    const next = [...new Set([...(med.custom_doses || []).map(Number), value])].sort((a, b) => a - b);
    await updateMedication(medicationId, { custom_doses: next });
  };

  const deleteMedication = async (id) => {
    await base44.entities.Medication.delete(id);
    setMedications((prev) => prev.filter((m) => m.id !== id));
  };

  // Links existing shot logs to a medication record, so every shot points at
  // the regimen it belongs to. Used when Meds is filled in from shot history.
  const linkShotsToMedication = async (medicationName, medicationId) => {
    const unlinked = shots.filter((s) => s.medication === medicationName && !s.medication_id);
    if (!unlinked.length) return 0;
    const saved = await base44.entities.Shot.bulkUpdate(
      unlinked.slice(0, 500).map((s) => ({ id: s.id, medication_id: medicationId }))
    );
    const list = Array.isArray(saved) ? saved : (saved?.records || saved?.items || []);
    const byId = {};
    list.forEach((r) => { if (r?.id) byId[r.id] = r; });
    setShots((prev) => prev.map((s) => (byId[s.id] ? { ...s, ...byId[s.id] } : s)));
    return list.length;
  };

  // "I stopped this medication": the regimen is marked inactive with the date,
  // and any running repeat is cancelled, so nothing keeps prompting for it.
  const stopMedication = async (medicationName) => {
    const stamped = todayKey();
    let regimen = medications.find((m) => m.medication_name === medicationName && m.status === "active")
      || medications.find((m) => m.medication_name === medicationName);
    if (regimen) {
      const rec = await base44.entities.Medication.update(regimen.id, {
        status: "discontinued", discontinued_date: stamped,
      });
      setMedications((prev) => prev.map((m) => (m.id === regimen.id ? { ...m, ...rec } : m)));
      regimen = { ...regimen, ...rec };
    } else {
      const rec = await base44.entities.Medication.create({
        medication_name: medicationName, status: "discontinued", discontinued_date: stamped,
      });
      setMedications((prev) => [rec, ...prev]);
      regimen = rec;
    }
    const running = repeatSchedules.filter((s) => s.status === "active" && s.medication === medicationName);
    for (const s of running) await updateRepeatSchedule(s.id, { status: "cancelled" });
    return regimen;
  };

  // ── AdverseEvent CRUD ──────────────────────────────────────────────────────
  const addAdverseEvent = async (data) => {
    const rec = await base44.entities.AdverseEvent.create(data);
    setAdverseEvents((prev) => [rec, ...prev]);
    return rec;
  };

  const updateAdverseEvent = async (id, updates) => {
    const rec = await base44.entities.AdverseEvent.update(id, updates);
    setAdverseEvents((prev) => prev.map((e) => e.id === id ? { ...e, ...rec } : e));
  };

  const deleteAdverseEvent = async (id) => {
    await base44.entities.AdverseEvent.delete(id);
    setAdverseEvents((prev) => prev.filter((e) => e.id !== id));
  };

  // ── ProxyAccess CRUD ──────────────────────────────────────────────────────
  const addProxyAccess = async (data) => {
    const rec = await base44.entities.ProxyAccess.create(data);
    setProxyAccess((prev) => [rec, ...prev]);
    return rec;
  };

  const revokeProxyAccess = async (id) => {
    const rec = await base44.entities.ProxyAccess.update(id, {
      status: "revoked", revoked_date: new Date().toISOString(),
    });
    setProxyAccess((prev) => prev.map((p) => p.id === id ? { ...p, ...rec } : p));
  };

  // ── Profile ────────────────────────────────────────────────────────────────
  const setProfile = async (updater) => {
    const next = typeof updater === "function" ? updater(profile) : { ...profile, ...updater };
    setProfileState(next);
    if (next.dark_mode !== undefined) setDarkModeState(!!next.dark_mode);
    if (next.onboarding_completed !== undefined) setOnboardingCompleted(!!next.onboarding_completed);
    const payload = {
      height_cm: next.height_cm ?? null,
      goal_weight_kg: next.goal_weight_kg ?? null,
      unit_check_status: next.unit_check_status || "",
      units_migrated_at: next.units_migrated_at || "",
      days_between: next.days_between,
      days_between_override: next.days_between_override || "",
      liquid_unit: next.liquid_unit, height_unit: next.height_unit,
      weight_unit: next.weight_unit, default_medication: next.default_medication,
      // Only recorded once the user has chosen a theme; until then the device
      // setting governs.
      dark_mode: themeChosenRef.current ? !!next.dark_mode : undefined,
      onboarding_completed: !!next.onboarding_completed,
      birthdate: next.birthdate || "",
      gdpr_consent_date: next.gdpr_consent_date || "",
      gdpr_privacy_policy_version: next.gdpr_privacy_policy_version || "",
      age_confirmed_at: next.age_confirmed_at || "",
      parental_consent_date: next.parental_consent_date || "",
      parental_consent_name: next.parental_consent_name || "",
      first_name: next.first_name || "",
      weight_tracking_opted_in: !!next.weight_tracking_opted_in,
      // Only written once the question has been answered, so a profile saved
      // before it existed stays unanswered rather than reading as "none".
      ...(Array.isArray(next.tracking_modules) ? { tracking_modules: next.tracking_modules } : {}),
      custom_doses: Array.isArray(next.custom_doses) ? next.custom_doses : [],
      prescriber_name: next.prescriber_name || "",
      prescriber_contact: next.prescriber_contact || "",
    };
    await saveProfileRecord(payload);
  };

  // Updates the person's profile record, creating it exactly once. A save that
  // arrives while the first create is still in flight waits for it and updates
  // that record instead of creating a second.
  const saveProfileRecord = async (payload) => {
    if (!profileIdRef.current && profileCreateRef.current) await profileCreateRef.current;
    if (profileIdRef.current) {
      await base44.entities.UserProfile.update(profileIdRef.current, payload);
      return;
    }
    const creating = base44.entities.UserProfile.create(payload).then((rec) => {
      rememberProfileId(rec.id);
      return rec;
    });
    profileCreateRef.current = creating;
    try {
      await creating;
    } finally {
      if (profileCreateRef.current === creating) profileCreateRef.current = null;
    }
  };

  const setDarkMode = (val) => {
    themeChosenRef.current = true;
    setProfile({ ...profile, dark_mode: val });
  };

  // Records GDPR Art. 9 consent with timestamp and privacy-policy version.
  const recordConsent = async (privacyPolicyVersion) => {
    await setProfile({
      ...profile,
      gdpr_consent_date: new Date().toISOString(),
      gdpr_privacy_policy_version: privacyPolicyVersion,
    });
  };

  // Records parental consent for a minor account.
  const recordParentalConsent = async (guardianName) => {
    await setProfile({
      ...profile,
      parental_consent_date: new Date().toISOString(),
      parental_consent_name: guardianName || "",
    });
  };

  const resetState = () => {
    setShots([]); setDayMetrics({}); setProgressPhotosList([]); setJournalEntries([]);
    setMedications([]); setAdverseEvents([]); setProxyAccess([]);
    setRepeatSchedules([]);
    setProfileState(DEFAULT_PROFILE); rememberProfileId(null);
    setDarkModeState(false); setOnboardingCompleted(null);
    clearCachedProfile();
  };

  const completeOnboarding = async () => {
    setOnboardingCompleted(true);
    await setProfile({ ...profile, onboarding_completed: true });
  };

  // ── Computed helpers ───────────────────────────────────────────────────────
  const wDisplayUnit = profile?.weight_unit || "lb";
  const weightHistory = Object.entries(dayMetrics)
    .filter(([, m]) => m.weight != null)
    .map(([key, m]) => {
      const kg = kgOfEntry(m, wDisplayUnit);
      return { date: key, weight: fromKg(kg, wDisplayUnit), kg };
    })
    .filter((row) => row.weight != null)
    .sort((a, b) => a.date.localeCompare(b.date));

  // ── One-time kg/lb check ───────────────────────────────────────────────────
  // Entries kept in pounds that read as a believable weight in kilograms are
  // flagged once. The user decides; nothing is converted silently.
  const unitCheck = (() => {
    const status = profile?.unit_check_status || "";
    if (status && status !== "pending") return { status, needsPrompt: false, count: 0 };
    const cm = heightCmOf(profile);
    const asPounds = Object.values(dayMetrics)
      .filter((m) => m && m.weight != null && (m.weight_source_unit || m.weight_unit || "lb") === "lb")
      .map((m) => fromKg(kgOfEntry(m, "lb"), "lb"));
    const mismatch = detectUnitMismatch(asPounds, "lb", cm);
    return { status, needsPrompt: mismatch.needsPrompt, count: mismatch.count, heightCm: cm };
  })();

  const updateDayMetricRows = async (updates) => {
    if (!updates.length) return;
    const saved = await base44.entities.DayMetric.bulkUpdate(updates);
    const list = Array.isArray(saved) ? saved : (saved?.records || saved?.items || []);
    setDayMetrics((prev) => {
      const next = { ...prev };
      list.forEach((rec) => {
        if (rec?.day_key) next[rec.day_key] = { ...(next[rec.day_key] || {}), ...rec };
      });
      return next;
    });
  };

  // Reads the flagged entries as kilograms instead of pounds. One tap, reversible.
  const convertAssumedKg = async () => {
    const updates = Object.values(dayMetrics)
      .filter((m) => m && m.weight != null && (m.weight_source_unit || m.weight_unit || "lb") === "lb")
      .map((m) => {
        const currentKg = kgOfEntry(m, "lb");
        const asTyped = fromKg(currentKg, "lb");
        if (currentKg == null || asTyped == null) return null;
        return {
          id: m.id,
          weight: roundKg(asTyped),
          weight_unit: "kg",
          weight_unit_check: "converted",
          weight_revert_value: currentKg,
          weight_revert_unit: "kg",
        };
      })
      .filter(Boolean);
    await updateDayMetricRows(updates);
    await setProfile({ ...profile, unit_check_status: "converted" });
    return updates.length;
  };

  const undoUnitConversion = async () => {
    const updates = Object.values(dayMetrics)
      .filter((m) => m && m.weight_unit_check === "converted" && m.weight_revert_value != null)
      .map((m) => ({
        id: m.id,
        weight: m.weight_revert_value,
        weight_unit: m.weight_revert_unit || "kg",
        weight_unit_check: "undone",
      }));
    await updateDayMetricRows(updates);
    // Back to "not yet answered", so the prompt can be raised again.
    await setProfile({ ...profile, unit_check_status: "pending" });
    return updates.length;
  };

  const keepWeightsAsLogged = () => setProfile({ ...profile, unit_check_status: "kept_lb" });

  // Adverse events grouped by day_key for display
  const adverseEventsByDay = adverseEvents.reduce((acc, e) => {
    const dk = e.day_key || e.onset_date || "";
    if (!acc[dk]) acc[dk] = [];
    acc[dk].push(e);
    return acc;
  }, {});

  // The site to suggest next for a route: the one that route offers that was used
  // longest ago, so the rotation keeps moving (src/lib/injectionSites.js).
  const getRecommendedSite = useCallback((route) => suggestedSite(shots, route), [shots]);

  // Repeat doses due today or overdue, awaiting confirmation
  const pendingRepeatDoses = getPendingDoses(repeatSchedules, shots);

  return (
    <AppStateContext.Provider value={{
      // Shots
      shots, shotsLoading, addShot, updateShot, deleteShot, loadShots,
      // Day metrics
      dayMetrics, getDayMetric, saveDayMetric,
      getNutrition, saveNutrition,
      getSideEffects, saveSideEffects,
      getWeight, saveWeight,
      getExercise, saveExercise,
      getProgressPhoto,
      progressPhotosList, getPhotosForDay,
      addProgressPhotoRecord, updateProgressPhotoRecord, deleteProgressPhotoRecord, deleteLatestProgressPhoto,
      // Journal
      journalEntries, addJournalEntry, updateJournalEntry, deleteJournalEntry,
      // Medications (regimen)
      medications, addMedication, updateMedication, deleteMedication, linkShotsToMedication, stopMedication,
      archiveMedication, addMedicationCustomDose,
      // Canonical measurements + one-time unit check
      weightUnit: wDisplayUnit, heightCm: heightCmOf(profile), getWeightKg, unitCheck,
      convertAssumedKg, undoUnitConversion, keepWeightsAsLogged,
      // AdverseEvents
      adverseEvents, adverseEventsByDay, addAdverseEvent, updateAdverseEvent, deleteAdverseEvent,
      // ProxyAccess
      proxyAccess, addProxyAccess, revokeProxyAccess, loadProxyAccess,
      // Records shared with this account (the caregiver's side)
      sharedWithMe, loadSharedWithMe,
      // Repeat schedules
      repeatSchedules, pendingRepeatDoses, addRepeatSchedule, updateRepeatSchedule,
      loadRepeatSchedules, confirmRepeatDose, skipRepeatDose,
      // Profile
      profile, setProfile, recordConsent, recordParentalConsent,
      refreshProfile: loadProfile,
      // Derived
      weightHistory, getRecommendedSite,
      // Dark mode
      darkMode, setDarkMode,
      // Onboarding
      onboardingCompleted, completeOnboarding,
      resetState,
    }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  return useContext(AppStateContext);
}