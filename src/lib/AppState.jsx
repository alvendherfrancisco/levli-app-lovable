import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { toDayKey, todayKey, parseShotDate } from "@/lib/dateUtils";
import { convertWeight } from "@/lib/units";
import { getPendingDoses, buildShotFromSchedule } from "@/lib/repeatSchedule";
import { seedDemoDataIfNeeded } from "@/lib/seedDemoData";
import { useAuth } from "@/lib/AuthContext";

const AppStateContext = createContext(null);

const DEFAULT_PROFILE = {
  height_ft: "5", height_in: "8", goal_weight: "160", days_between: "7",
  liquid_unit: "oz", height_unit: "in", weight_unit: "lb",
  default_medication: "Ozempic®", notifications_enabled: false, dark_mode: false,
  birthdate: "", gdpr_consent_date: "", gdpr_privacy_policy_version: "",
  parental_consent_date: "", parental_consent_name: "",
  first_name: "",
  notif_shot_reminders: true,
  notif_checkin_reminders: false,
  notif_weight_reminders: false,
  notif_inventory_alerts: true,
  notif_reengagement: false,
  weight_tracking_opted_in: false,
};

export function AppStateProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [shots, setShots] = useState([]);
  const [shotsLoading, setShotsLoading] = useState(true);
  const [dayMetrics, setDayMetrics] = useState({}); // key: day_key → record
  const [progressPhotosList, setProgressPhotosList] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [profile, setProfileState] = useState(DEFAULT_PROFILE);
  const [profileId, setProfileId] = useState(null);
  const [darkMode, setDarkModeState] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(null);

  // ── New entity states ─────────────────────────────────────────────────────
  const [medications, setMedications] = useState([]);
  const [adverseEvents, setAdverseEvents] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [storageLogs, setStorageLogs] = useState([]);
  const [proxyAccess, setProxyAccess] = useState([]);
  const [repeatSchedules, setRepeatSchedules] = useState([]);

  // ── Dark mode ──────────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // ── Load all data once authenticated ────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      await seedDemoDataIfNeeded();
      loadShots();
      loadJournal();
      loadProfile();
      loadDayMetrics();
      loadProgressPhotos();
      loadMedications();
      loadAdverseEvents();
      loadInventory();
      loadStorageLogs();
      loadProxyAccess();
      loadRepeatSchedules();
    })();
  }, [isAuthenticated]);

  const loadShots = async () => {
    setShotsLoading(true);
    const data = await base44.entities.Shot.list("-date", 500);
    data.sort((a, b) => parseShotDate(b.date) - parseShotDate(a.date));
    setShots(data);
    setShotsLoading(false);
  };

  const loadJournal = async () => {
    const data = await base44.entities.JournalEntry.list("-date", 200);
    setJournalEntries(data);
  };

  const loadProfile = async () => {
    const data = await base44.entities.UserProfile.list("", 1);
    if (data.length > 0) {
      const p = data[0];
      setProfileId(p.id);
      const merged = { ...DEFAULT_PROFILE, ...p };
      setProfileState(merged);
      setDarkModeState(!!p.dark_mode);
      setOnboardingCompleted(!!p.onboarding_completed);
    } else {
      setOnboardingCompleted(false);
    }
  };

  const loadDayMetrics = async () => {
    const data = await base44.entities.DayMetric.list("-day_key", 500);
    const map = {};
    data.forEach((d) => { map[d.day_key] = d; });
    setDayMetrics(map);
  };

  const loadProgressPhotos = async () => {
    const data = await base44.entities.ProgressPhoto.list("created_date", 1000);
    setProgressPhotosList(data);
  };

  const loadMedications = async () => {
    const data = await base44.entities.Medication.list("-created_date", 200);
    setMedications(data);
  };

  const loadAdverseEvents = async () => {
    const data = await base44.entities.AdverseEvent.list("-created_date", 500);
    setAdverseEvents(data);
  };

  const loadInventory = async () => {
    const data = await base44.entities.Inventory.list("-created_date", 200);
    setInventory(data);
  };

  const loadStorageLogs = async () => {
    const data = await base44.entities.StorageLog.list("-created_date", 200);
    setStorageLogs(data);
  };

  const loadProxyAccess = async () => {
    const data = await base44.entities.ProxyAccess.list("-created_date", 100);
    setProxyAccess(data);
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
    const shot = buildShotFromSchedule(schedule, dayKey, injectable ? getRecommendedSite() : schedule.site);
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
    "reconstitution_date", "in_use_expiry",
    "infusion_duration", "clinic_location", "premedication",
    "spray_count", "nostril", "priming",
    "taken_with_food",
    "patch_site", "application_date",
    "body_area", "application_notes",
    "insertion_date", "pump_rate", "site_change_date",
  ];

  const addShot = async (shot) => {
    const payload = {};
    SHOT_FIELDS.forEach((f) => {
      if (shot[f] !== undefined && shot[f] !== null) payload[f] = shot[f];
    });
    // Backward-compat: drug_class may arrive as drugClass
    if (shot.drugClass && !payload.drug_class) payload.drug_class = shot.drugClass;
    if (shot.molecularClass && !payload.molecular_class) payload.molecular_class = shot.molecularClass;
    const rec = await base44.entities.Shot.create(payload);
    setShots((prev) => [rec, ...prev].sort((a, b) => parseShotDate(b.date) - parseShotDate(a.date)));
    // Decrement matching inventory
    if (rec.medication) {
      const match = inventory.find((i) => i.product_name === rec.medication && i.status === "active" && i.remaining_quantity > 0);
      if (match) {
        try {
          const updated = await base44.entities.Inventory.update(match.id, {
            remaining_quantity: Math.max(0, match.remaining_quantity - 1),
          });
          setInventory((prev) => prev.map((i) => i.id === match.id ? { ...i, ...updated } : i));
        } catch (e) { /* inventory update is best-effort */ }
      }
    }
    return rec;
  };

  const updateShot = async (id, updates) => {
    const rec = await base44.entities.Shot.update(id, updates);
    setShots((prev) => prev.map((s) => s.id === id ? { ...s, ...rec } : s));
  };

  const deleteShot = async (id) => {
    await base44.entities.Shot.delete(id);
    setShots((prev) => prev.filter((s) => s.id !== id));
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
    if (!m) return { calories: "0.0", protein: "0.0", water: "0.0", fiber: "0.0", carbs: "0.0" };
    return {
      calories: m.calories != null ? String(m.calories) : "0.0",
      protein: m.protein != null ? String(m.protein) : "0.0",
      water: m.water != null ? String(m.water) : "0.0",
      fiber: m.fiber != null ? String(m.fiber) : "0.0",
      carbs: m.carbs != null ? String(m.carbs) : "0.0",
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

  const displayWeightUnit = profile?.weight_unit || "lb";
  const getWeight = (dayKey) => {
    const m = dayMetrics[dayKey];
    if (!m || m.weight == null) return null;
    const storedUnit = m.weight_unit || displayWeightUnit;
    return convertWeight(m.weight, storedUnit, displayWeightUnit);
  };
  const saveWeight = (dayKey, val) => saveDayMetric(dayKey, { weight: parseFloat(val) || null, weight_unit: displayWeightUnit });

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
    const rec = await base44.entities.Medication.update(id, updates);
    setMedications((prev) => prev.map((m) => m.id === id ? { ...m, ...rec } : m));
  };

  const deleteMedication = async (id) => {
    await base44.entities.Medication.delete(id);
    setMedications((prev) => prev.filter((m) => m.id !== id));
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

  // ── Inventory CRUD ─────────────────────────────────────────────────────────
  const addInventory = async (data) => {
    const rec = await base44.entities.Inventory.create(data);
    setInventory((prev) => [rec, ...prev]);
    return rec;
  };

  const updateInventory = async (id, updates) => {
    const rec = await base44.entities.Inventory.update(id, updates);
    setInventory((prev) => prev.map((i) => i.id === id ? { ...i, ...rec } : i));
  };

  const deleteInventory = async (id) => {
    await base44.entities.Inventory.delete(id);
    setInventory((prev) => prev.filter((i) => i.id !== id));
  };

  // ── StorageLog CRUD ────────────────────────────────────────────────────────
  const addStorageLog = async (data) => {
    const rec = await base44.entities.StorageLog.create(data);
    setStorageLogs((prev) => [rec, ...prev]);
    return rec;
  };

  const deleteStorageLog = async (id) => {
    await base44.entities.StorageLog.delete(id);
    setStorageLogs((prev) => prev.filter((s) => s.id !== id));
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
      height_ft: next.height_ft, height_in: next.height_in,
      goal_weight: next.goal_weight, days_between: next.days_between,
      liquid_unit: next.liquid_unit, height_unit: next.height_unit,
      weight_unit: next.weight_unit, default_medication: next.default_medication,
      notifications_enabled: !!next.notifications_enabled,
      dark_mode: !!next.dark_mode,
      onboarding_completed: !!next.onboarding_completed,
      birthdate: next.birthdate || "",
      gdpr_consent_date: next.gdpr_consent_date || "",
      gdpr_privacy_policy_version: next.gdpr_privacy_policy_version || "",
      parental_consent_date: next.parental_consent_date || "",
      parental_consent_name: next.parental_consent_name || "",
      first_name: next.first_name || "",
      notif_shot_reminders: next.notif_shot_reminders !== undefined ? !!next.notif_shot_reminders : true,
      notif_checkin_reminders: !!next.notif_checkin_reminders,
      notif_weight_reminders: !!next.notif_weight_reminders,
      notif_inventory_alerts: next.notif_inventory_alerts !== undefined ? !!next.notif_inventory_alerts : true,
      notif_reengagement: !!next.notif_reengagement,
      weight_tracking_opted_in: !!next.weight_tracking_opted_in,
    };
    if (profileId) {
      await base44.entities.UserProfile.update(profileId, payload);
    } else {
      const rec = await base44.entities.UserProfile.create(payload);
      setProfileId(rec.id);
    }
  };

  const setDarkMode = (val) => setProfile({ ...profile, dark_mode: val });

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
    setMedications([]); setAdverseEvents([]); setInventory([]); setStorageLogs([]); setProxyAccess([]);
    setRepeatSchedules([]);
    setProfileState(DEFAULT_PROFILE); setProfileId(null);
    setDarkModeState(false); setOnboardingCompleted(null);
  };

  const completeOnboarding = async () => {
    setOnboardingCompleted(true);
    await setProfile({ ...profile, onboarding_completed: true });
  };

  // ── Computed helpers ───────────────────────────────────────────────────────
  const wDisplayUnit = profile?.weight_unit || "lb";
  const weightHistory = Object.entries(dayMetrics)
    .filter(([, m]) => m.weight != null)
    .map(([key, m]) => ({ date: key, weight: convertWeight(m.weight, m.weight_unit || wDisplayUnit, wDisplayUnit) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Adverse events grouped by day_key for display
  const adverseEventsByDay = adverseEvents.reduce((acc, e) => {
    const dk = e.day_key || e.onset_date || "";
    if (!acc[dk]) acc[dk] = [];
    acc[dk].push(e);
    return acc;
  }, {});

  const getRecommendedSite = useCallback(() => {
    const sites = [
      "Stomach – Upper Left", "Stomach – Upper Right",
      "Stomach – Lower Left", "Stomach – Lower Right",
      "Thigh – Left", "Thigh – Right",
      "Upper Arm – Left", "Upper Arm – Right",
    ];
    if (shots.length === 0) return sites[0];
    const lastSite = shots[0].site;
    const lastIdx = sites.indexOf(lastSite);
    return sites[(lastIdx + 1) % sites.length];
  }, [shots]);

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
      medications, addMedication, updateMedication, deleteMedication,
      // AdverseEvents
      adverseEvents, adverseEventsByDay, addAdverseEvent, updateAdverseEvent, deleteAdverseEvent,
      // Inventory
      inventory, addInventory, updateInventory, deleteInventory,
      // StorageLogs
      storageLogs, addStorageLog, deleteStorageLog,
      // ProxyAccess
      proxyAccess, addProxyAccess, revokeProxyAccess,
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