import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Settings, HelpCircle, ArrowRight, Maximize2, Minimize2, Crown } from "lucide-react";
import IonIcon from "@/components/IonIcon";
import { SyringeIcon, ClockIcon } from "@/components/CustomIcons";
import InsightCard from "@/components/insights/InsightCard";
import SectionHeader from "@/components/insights/SectionHeader";
import InsightEmptyState from "@/components/insights/InsightEmptyState";
import RangeTabs from "@/components/insights/RangeTabs";
import ProgressPhotoCard from "@/components/insights/ProgressPhotoCard";
import AddMetricModal from "@/components/modals/AddMetricModal";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useAppState } from "@/lib/AppState";
import { parseShotDate, todayKey, toDayKey } from "@/lib/dateUtils";
import { isInvestigational, getHalfLifeDays, getDosingInterval } from "@/lib/medicationData";
import { heightCmOf, shownBmi } from "@/lib/measure";
import { sound } from "@/lib/sounds";
import { isExposureEligible } from "@/lib/medicationConfig";
import SideEffectsPanel from "@/components/insights/SideEffectsPanel";
import WellbeingPanel from "@/components/insights/WellbeingPanel";
import { PK_CALCULATION_VERSION, superposition, recentDoses, steadyStateAmount, exposureSummary } from "@/lib/pkCalculations";
import ExposureHowItWorks from "@/components/insights/ExposureHowItWorks";
import { toast } from "@/lib/toast";
import UpsellBanner from "@/components/UpsellBanner";
import SiteRotationChart from "@/components/insights/SiteRotationChart";
import DoseLegend from "@/components/insights/DoseLegend";
import { getDoseColor, getDoseLegend } from "@/lib/doseColors";
import useDoseColors from "@/hooks/useDoseColors";
import { useSubscription } from "@/lib/SubscriptionContext";
import PageContainer from "@/components/PageContainer";

const CLASS_COLORS = { Semaglutide: "#14B8A6", Tirzepatide: "#6366F1", Liraglutide: "#F59E0B" };

// Builds one curve per drug class using BRAND-SPECIFIC half-lives.
// Investigational classes are excluded so no curve is shown for unapproved products.
// Every number here comes from the doses actually logged; a class with no dose
// inside the last five half-lives has nothing to model and is left out.
function buildMedLevelData(shots, days, isDark) {
  const nothing = {
    data: [], classes: [], disabled: false, empty: true, markers: [], doseLegend: [],
    summary: null, primaryClass: null, primaryHL: null, interval: null, medication: null, doseUnit: "mg",
  };
  if (!shots.length) return { ...nothing, empty: false };
  // Only label-verified doses are modelled. An "Other / custom" entry, a
  // compounded strength or an unapproved product is never used for the estimate.
  const modellable = shots.filter((s) => isExposureEligible(s.medication, s.dose_source));
  if (!modellable.length) return { ...nothing, disabled: true };

  const now = new Date(); now.setHours(0,0,0,0);
  const mNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  // Group the logged doses by drug class, each keeping its own product's
  // half-life and the interval from that product's label.
  const groups = {};
  modellable.forEach((s) => {
    const cls = s.drug_class || s.drugClass;
    if (!cls || isInvestigational(cls)) return;
    const sd = parseShotDate(s.date);
    if (!sd) return;
    const route = s.route || getRouteForClass(cls, shots);
    const halfLife = getHalfLifeDays(s.medication, route);
    if (!halfLife) return;
    if (!groups[cls]) {
      groups[cls] = {
        doses: [], halfLife, medication: s.medication,
        interval: getDosingInterval(s.medication) || 7,
        unit: s.dose_unit || "mg",
      };
    }
    groups[cls].doses.push({ date: sd, dose: s.dose || 0, id: s.id, unit: s.dose_unit || "mg" });
  });

  const lastDoseIn = (cls) => recentDoses(groups[cls].doses, groups[cls].halfLife, now);
  const activeClasses = Object.keys(groups).filter((cls) => lastDoseIn(cls).length > 0);
  // No dose within the last five half-lives: there is nothing to model.
  if (!activeClasses.length) return nothing;

  // The 100% reference for each class is that class's current dose taken at its
  // label interval, so the line rises when a bigger dose is logged.
  const referenceAmount = {};
  activeClasses.forEach((cls) => {
    const latest = lastDoseIn(cls).reduce((a, b) => (b.date > a.date ? b : a));
    referenceAmount[cls] = steadyStateAmount(latest.dose, groups[cls].halfLife, groups[cls].interval);
  });

  const points = [];
  for (let i = days; i >= 0; i--) {
    const t = new Date(now); t.setDate(t.getDate() - i);
    const point = { day: `${mNames[t.getMonth()]} ${t.getDate()}` };
    activeClasses.forEach((cls) => {
      const g = groups[cls];
      const amount = superposition(recentDoses(g.doses, g.halfLife, t), g.halfLife, t);
      point[cls] = referenceAmount[cls]
        ? Math.round((amount / referenceAmount[cls]) * 1000) / 10
        : 0;
    });
    points.push(point);
  }

  // The class with the most recent dose leads the summary.
  const lastDoseDay = (cls) => lastDoseIn(cls).reduce((a, b) => (b.date > a.date ? b : a)).date;
  const primaryClass = activeClasses.reduce(
    (best, cls) => (lastDoseDay(cls) > lastDoseDay(best) ? cls : best), activeClasses[0]
  );
  const primary = groups[primaryClass];
  const summary = exposureSummary({
    doses: primary.doses, halfLifeDays: primary.halfLife,
    intervalDays: primary.interval, atDate: now,
  });

  // Dose markers: every shot in the window, coloured by its dose, plus the
  // matching legend.
  const shotsInRange = modellable.filter((s) => {
    const sd = parseShotDate(s.date);
    if (!sd) return false;
    const daysSince = Math.round((now - sd) / 86400000);
    return daysSince >= 0 && daysSince <= days;
  });
  const markers = shotsInRange.map((s) => {
    const sd = parseShotDate(s.date);
    return { key: s.id, day: `${mNames[sd.getMonth()]} ${sd.getDate()}`, color: getDoseColor(s.medication, s.dose, isDark) };
  });

  return {
    data: points, classes: activeClasses, disabled: false, empty: false,
    markers, doseLegend: getDoseLegend(shotsInRange, isDark),
    summary, primaryClass, primaryHL: primary.halfLife, interval: primary.interval,
    medication: primary.medication, doseUnit: primary.unit,
  };
}

// Helper: the route most often used for a generic class in the user's shots
function getRouteForClass(cls, shots) {
  const s = shots.find((x) => (x.drug_class || x.drugClass) === cls && x.route);
  return s?.route || "subcutaneous";
}

function buildWeightData(weightHistory, daysBack) {
  if (!weightHistory.length) return [];
  const mNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const byDay = {};
  weightHistory.forEach(({ date, weight }) => { if (weight != null) byDay[date] = weight; });

  // A continuous day-by-day axis from the start of the selected range up to
  // TODAY. Days with no entry carry null, so the chart shows a real gap and
  // never ends at the last entry.
  const end = new Date(); end.setHours(0,0,0,0);
  const start = new Date(end); start.setDate(start.getDate() - (daysBack - 1));
  const points = [];
  for (const day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
    const key = toDayKey(day);
    points.push({
      date: `${mNames[day.getMonth()]} ${day.getDate()}`,
      weight: byDay[key] != null ? byDay[key] : null,
      _isoDate: key,
    });
  }

  // 7-day rolling average over the logged entries themselves.
  const entries = points.filter((p) => p.weight != null);
  entries.forEach((point, i) => {
    const window = entries.slice(Math.max(0, i - 6), i + 1);
    const avg = window.reduce((a, p) => a + p.weight, 0) / window.length;
    point.rollingAvg = Math.round(avg * 10) / 10;
  });
  return points;
}

const WEIGHT_RANGES = { "30 Days": 30, "180 Days": 180, "1 Year": 365 };
const MED_RANGES = { "7 Days": 7, "30 Days": 30, "90 Days": 90 };

export default function Insights() {
  const { shots, weightHistory, profile, dayMetrics, progressPhotosList, addProgressPhotoRecord, updateProgressPhotoRecord, deleteProgressPhotoRecord, getWeight, unitCheck } = useAppState();
  const { isPremium, openPaywall } = useSubscription();
  const [weightRange, setWeightRange] = useState("180 Days");
  const [medRange, setMedRange] = useState("30 Days");
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [siteRange, setSiteRange] = useState("30 Days");
  const [viewAllPhotos, setViewAllPhotos] = useState(false);
  const [photoModal, setPhotoModal] = useState(null);
  const weightUnit = profile?.weight_unit || "lb";
  // Markers and the legend follow the theme, so they repaint with it.
  const { isDark } = useDoseColors();

  const medLevel = useMemo(() => buildMedLevelData(shots, MED_RANGES[medRange], isDark), [shots, medRange, isDark]);
  const weightData = useMemo(() => buildWeightData(weightHistory, WEIGHT_RANGES[weightRange]), [weightHistory, weightRange]);

  const formatPhotoDate = (isoDate) => {
    const [y, m, d] = isoDate.split("-").map(Number);
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return { month: `${months[m-1]} ${d}`, year: String(y) };
  };

  const photosAsc = useMemo(() =>
    [...progressPhotosList].sort((a, b) => a.day_key.localeCompare(b.day_key)),
    [progressPhotosList]
  );
  const latestPhoto = photosAsc.length ? photosAsc[photosAsc.length - 1] : null;

  const distinctDayKeys = useMemo(() => {
    const seen = [];
    photosAsc.forEach((p) => { if (!seen.includes(p.day_key)) seen.push(p.day_key); });
    return seen;
  }, [photosAsc]);

  const journeyDays = distinctDayKeys.length >= 2
    ? Math.round((new Date(distinctDayKeys[distinctDayKeys.length - 1]) - new Date(distinctDayKeys[0])) / 86400000)
    : 0;

  const latestPhotoDate = latestPhoto ? formatPhotoDate(latestPhoto.day_key) : null;
  // Uses getWeight so each entry is converted from the unit it was logged in.
  const getWeightLabel = (dayKey) => {
    const w = getWeight(dayKey);
    return w != null ? `${w.toFixed(1)} ${weightUnit}` : null;
  };

  const prevDayKey = distinctDayKeys.length >= 2 ? distinctDayKeys[distinctDayKeys.length - 2] : null;
  const prevDayPhoto = prevDayKey ? [...photosAsc].reverse().find((p) => p.day_key === prevDayKey) : null;
  const gapDays = prevDayKey && latestPhoto
    ? Math.round((new Date(latestPhoto.day_key) - new Date(prevDayKey)) / 86400000)
    : null;

  const openAddPhoto = () => setPhotoModal({ mode: "add", dayKey: todayKey() });
  const openEditPhoto = (photo) => setPhotoModal({ mode: "edit", id: photo.id, dayKey: photo.day_key, url: photo.url });

  const handleSavePhotoModal = async (url, newDayKey) => {
    const dayKey = newDayKey || photoModal.dayKey;
    if (photoModal.mode === "add") {
      await addProgressPhotoRecord(dayKey, url);
      toast.success("Progress photo added");
    } else {
      await updateProgressPhotoRecord(photoModal.id, dayKey, url);
      toast.success("Progress photo updated");
    }
  };
  const handleDeletePhotoModal = async () => {
    sound.delete();
    await deleteProgressPhotoRecord(photoModal.id, photoModal.dayKey);
    toast.deleted("Progress photo deleted");
  };

  // ── Weight stats (over the entries actually logged) ─────────────────────────
  const weightEntries = weightData.filter((p) => p.weight != null);
  const firstEntry = weightEntries[0] || null;
  const lastEntry = weightEntries[weightEntries.length - 1] || null;

  const weightLoss = weightEntries.length >= 2
    ? firstEntry.weight - lastEntry.weight
    : null;

  const actualWeeks = weightEntries.length >= 2
    ? Math.max(1, (() => {
        const [y1,m1,d1] = firstEntry._isoDate.split("-").map(Number);
        const [y2,m2,d2] = lastEntry._isoDate.split("-").map(Number);
        const msElapsed = new Date(y2,m2-1,d2) - new Date(y1,m1-1,d1);
        return msElapsed / (7 * 86400000);
      })())
    : 1;
  const ratePerWeek = weightLoss != null ? (weightLoss / actualWeeks) : null;

  // Percentage weight change: [(baseline - current) / baseline] × 100
  const baselineWeight = firstEntry ? firstEntry.weight : null;
  const currentWeight = lastEntry ? lastEntry.weight : null;
  const pctWeightChange = (baselineWeight != null && currentWeight != null && baselineWeight > 0)
    ? Math.round(((baselineWeight - currentWeight) / baselineWeight) * 1000) / 10
    : null;

  // ── BMI — canonical values, shown only when the result is plausible ─────────
  const latestWeightKg = weightHistory.length ? weightHistory[weightHistory.length - 1].kg : null;
  const heightCm = heightCmOf(profile);
  const rawBmi = shownBmi(latestWeightKg, heightCm);
  // A very low value while the kg/lb question is still open is not shown as a
  // number — the user is asked to check their units instead.
  const bmiSuspicious = !!(unitCheck?.needsPrompt && rawBmi != null && rawBmi < 15);
  const bmi = bmiSuspicious ? null : rawBmi;
  const heightMissing = !heightCm && latestWeightKg != null;
  const bmiNeedsCheck = bmiSuspicious || !!(latestWeightKg != null && heightCm && bmi == null);

  // A plain-language summary of the weight chart, for screen readers and small
  // screens: "Down 3.8 lb over 180 days".
  const weightSummary = weightEntries.length >= 2
    ? `${weightLoss >= 0 ? "Down" : "Up"} ${Math.abs(weightLoss).toFixed(1)} ${weightUnit} over ${weightRange.toLowerCase()}`
    : "";

  // Shots inside the injection-site range, used for its empty state.
  const siteRangeDays = MED_RANGES[siteRange];
  const shotsInSiteRange = shots.filter((s) => {
    const sd = parseShotDate(s.date);
    if (!sd) return false;
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
    const daysSince = Math.round((startOfToday - sd) / 86400000);
    return daysSince >= 0 && daysSince <= siteRangeDays;
  }).length;

  return (
    <PageContainer bottomInset="banner" disclaimer>
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-950 w-full flex items-center justify-between px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Insights</h1>
        <Link to="/settings" aria-label="Settings"><Settings size={22} className="text-gray-600 dark:text-gray-400" /></Link>
      </div>

      <div className="w-full max-w-3xl mx-auto pt-4">
        {/* Weight Change Panel */}
        <InsightCard className="overflow-hidden">
          <SectionHeader
            icon={<IonIcon name="trending-down" size={20} className="text-indigo-600 dark:text-indigo-400" />}
            title="Weight Change"
          />

          <RangeTabs options={Object.keys(WEIGHT_RANGES)} value={weightRange} onChange={setWeightRange} />

          {/* Summary chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            <div className="bg-teal-50 dark:bg-teal-500/10 rounded-2xl p-2.5 text-center min-w-0 border border-transparent dark:border-teal-500/15">
              <IonIcon name="trending-down" size={16} className="text-teal-500 dark:text-teal-400 mb-1" />
              <p className="text-gray-500 dark:text-[#9A9DAE] text-[11px]">Weight Loss</p>
              <p className="font-bold text-teal-600 dark:text-teal-400 text-sm">
                {weightLoss != null ? `${weightLoss >= 0 ? "-" : "+"}${Math.abs(weightLoss).toFixed(1)} ${weightUnit}` : "—"}
              </p>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl p-2.5 text-center min-w-0 border border-transparent dark:border-indigo-500/15">
              <IonIcon name="flash" size={16} className="text-indigo-500 dark:text-indigo-400 mb-1" />
              <p className="text-gray-500 dark:text-[#9A9DAE] text-[11px]">% Change</p>
              <p className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                {pctWeightChange != null ? `${pctWeightChange >= 0 ? "-" : "+"}${Math.abs(pctWeightChange)}%` : "—"}
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-500/10 rounded-2xl p-2.5 text-center min-w-0 border border-transparent dark:border-purple-500/15">
              <ClockIcon size={16} className="text-purple-500 dark:text-purple-400 mb-1" />
              <p className="text-gray-500 dark:text-[#9A9DAE] text-[11px]">Rate/Week</p>
              <p className="font-bold text-purple-600 dark:text-purple-400 text-sm">
                {ratePerWeek != null ? `${ratePerWeek >= 0 ? "-" : "+"}${Math.abs(ratePerWeek).toFixed(1)} ${weightUnit}` : "—"}
              </p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-500/10 rounded-2xl p-2.5 text-center min-w-0 border border-transparent dark:border-orange-500/15">
              <IonIcon name="speedometer" size={16} className="text-orange-500 dark:text-orange-400 mb-1" />
              <p className="text-gray-500 dark:text-[#9A9DAE] text-[11px]">Current BMI</p>
              <p className="font-bold text-orange-600 dark:text-orange-400 text-sm">
                {bmi || (bmiNeedsCheck ? <span className="text-xs font-medium">Not shown — check units</span> : heightMissing ? <span className="text-xs font-medium">Add height in Profile</span> : "—")}
              </p>
            </div>
          </div>

          {bmiNeedsCheck && (
            <div className="mb-3 rounded-xl border border-orange-200 dark:border-orange-500/20 bg-orange-50 dark:bg-orange-500/10 px-3 py-2">
              <p className="text-[12px] text-orange-700 dark:text-orange-300">
                The height and weight on file do not produce a plausible BMI, so no number is shown. Check your height and weight units in Profile.
              </p>
              <Link to="/profile" className="mt-1.5 inline-block text-xs font-semibold text-indigo-600 dark:text-indigo-400">Fix in Profile</Link>
            </div>
          )}

          {bmi && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-3">
              BMI is a screening measure, not a diagnostic tool. It does not account for body composition.
            </p>
          )}

          {weightEntries.length >= 2 ? (
            <div className="h-52" role="img" aria-label={weightSummary || "Weight chart"}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" />
                  {/* 4–6 readable ticks rather than a label per entry */}
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#767676" }} stroke="#767676" interval={Math.max(0, Math.floor(weightData.length / 5))} />
                  <YAxis tick={{ fontSize: 12, fill: "#767676" }} stroke="#767676" domain={["auto", "auto"]} width={40} />
                  <Tooltip
                    formatter={(v, name) => [`${v} ${weightUnit}`, name === "rollingAvg" ? "7-day avg" : "Weight"]}
                    contentStyle={{ background: "rgba(20,22,32,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#E8E9F0" }}
                  />
                  <Line type="monotone" dataKey="weight" stroke="#6366F1" strokeWidth={2} dot={{ fill: "#6366F1", r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="rollingAvg" stroke="#8B5CF6" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <InsightEmptyState
              icon={<IonIcon name="trending-down" size={30} className="text-gray-400 dark:text-[#9A9DAE] opacity-40" />}
              action={<Link to="/" className="btn-pill btn-primary">Log your weight</Link>}
            >
              {weightHistory.length === 0 ? "No weight entries yet." : "Only one weight entry in this range."}
            </InsightEmptyState>
          )}
          <p className="text-xs text-gray-500 dark:text-[#9A9DAE] mt-2">
            {weightSummary ? `${weightSummary} · ` : ""}Solid line: daily entries · Dashed: 7-day rolling average · Days with no entry are left blank
          </p>
        </InsightCard>

        {/* Progress Pictures Panel */}
        <InsightCard>
          <SectionHeader
            icon={<IonIcon name="camera" size={20} className="text-indigo-600 dark:text-indigo-400" />}
            title="Progress Pictures"
          />

          {photosAsc.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="rounded-2xl p-2.5 text-center" style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.15)" }}>
                <IonIcon name="images" size={16} className="text-indigo-400 mb-1" />
                <p className="text-[11px] text-gray-500 dark:text-[#9A9DAE]">Total Photos</p>
                <p className="font-bold text-indigo-500 dark:text-indigo-400 text-sm">{photosAsc.length}</p>
              </div>
              <div className="rounded-2xl p-2.5 text-center" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.15)" }}>
                <ClockIcon size={16} className="text-teal-400 mb-1" />
                <p className="text-[11px] text-gray-500 dark:text-[#9A9DAE]">Journey Days</p>
                <p className="font-bold text-teal-500 dark:text-teal-400 text-sm">{journeyDays}</p>
              </div>
              <div className="rounded-2xl p-2.5 text-center" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.15)" }}>
                <IonIcon name="camera" size={16} className="text-orange-400 mb-1" />
                <p className="text-[11px] text-gray-500 dark:text-[#9A9DAE]">Latest</p>
                <p className="font-bold text-orange-500 dark:text-orange-400 text-sm">{latestPhotoDate ? latestPhotoDate.month : "—"}</p>
              </div>
            </div>
          )}

          {photosAsc.length === 0 ? (
            <div className="space-y-3">
              <InsightEmptyState icon={<IonIcon name="camera" size={30} className="text-gray-400 dark:text-[#9A9DAE] opacity-40" />}>
                No progress pictures yet. Tap to add your first photo!
              </InsightEmptyState>
              <button onClick={openAddPhoto} className="btn-pill btn-primary w-full">
                Add Picture
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {viewAllPhotos ? (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {photosAsc.map((p) => (
                    <ProgressPhotoCard key={p.id} photo={p} dateLabel={formatPhotoDate(p.day_key)} weightLabel={getWeightLabel(p.day_key)}
                      tag={p.id === latestPhoto.id ? "latest" : (p.day_key === latestPhoto.day_key ? "same-day" : null)} onClick={() => openEditPhoto(p)} />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5 sm:gap-3">
                  {prevDayPhoto && (
                    <>
                      <ProgressPhotoCard photo={prevDayPhoto} dateLabel={formatPhotoDate(prevDayPhoto.day_key)} weightLabel={getWeightLabel(prevDayPhoto.day_key)} tag={null} onClick={() => openEditPhoto(prevDayPhoto)} />
                      <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                        <ArrowRight size={16} sm={18} className="text-indigo-500" />
                        <span className="text-xs sm:text-sm text-indigo-500 dark:text-indigo-400 whitespace-nowrap">{gapDays}d</span>
                      </div>
                    </>
                  )}
                  <ProgressPhotoCard photo={latestPhoto} dateLabel={formatPhotoDate(latestPhoto.day_key)} weightLabel={getWeightLabel(latestPhoto.day_key)} tag="latest" onClick={() => openEditPhoto(latestPhoto)} />
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={openAddPhoto}
                  className="btn-pill btn-primary flex-1 text-sm">
                  Add Photo
                </button>
                {photosAsc.length >= 2 && (
                  <button onClick={() => setViewAllPhotos((v) => !v)}
                    className="flex-1 py-3 bg-gray-100 dark:bg-white/[0.07] text-indigo-600 dark:text-indigo-400 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-white/[0.12] transition-colors text-sm">
                    {viewAllPhotos ? <><Minimize2 size={16} /> Collapse</> : <><Maximize2 size={16} /> View All</>}
                  </button>
                )}
              </div>
            </div>
          )}
          <AddMetricModal open={!!photoModal} onClose={() => setPhotoModal(null)} label="Progress" unit="pic"
            value={photoModal?.mode === "edit" ? photoModal.url : "–"} dayKey={photoModal?.dayKey}
            onSave={handleSavePhotoModal} onDelete={photoModal?.mode === "edit" ? handleDeletePhotoModal : undefined} />
        </InsightCard>

        {/* Medication Exposure Panel */}
        <InsightCard>
          <SectionHeader
            icon={<SyringeIcon size={18} className="text-indigo-600 dark:text-indigo-400" />}
            title="Modelled Medication Exposure"
            subtitle="Illustrative relative-exposure estimate (not a blood-level measurement)."
            action={(
              <button onClick={() => setShowHowItWorks(true)} aria-label="How this works" className="flex-shrink-0 p-1">
                <HelpCircle size={18} className="text-indigo-400" />
              </button>
            )}
          />

          <RangeTabs options={Object.keys(MED_RANGES)} value={medRange} onChange={setMedRange} />

          <div className="relative">
            <div className={isPremium ? "" : "blur-sm pointer-events-none select-none opacity-60"}>
          {shots.length > 0 ? (
            medLevel.empty ? (
              <InsightEmptyState
                icon={<ClockIcon size={30} className="text-gray-400 dark:text-[#9A9DAE] opacity-40" />}
                action={<button onClick={() => setShowHowItWorks(true)} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">How this works</button>}
              >
                No recent doses logged, so there's nothing to model.
              </InsightEmptyState>
            ) : medLevel.disabled ? (
              <InsightEmptyState icon={<IonIcon name="information-circle" size={30} className="text-gray-400 dark:text-[#9A9DAE] opacity-40" />}>
                Exposure estimation is not available for this medication. This appears for investigational or unsupported products.
              </InsightEmptyState>
            ) : (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={medLevel.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" />
                      <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#767676" }} stroke="#767676" interval={Math.floor(medLevel.data.length / 5)} />
                      <YAxis tick={{ fontSize: 12, fill: "#767676" }} stroke="#767676" width={40} domain={[0, (dataMax) => Math.max(100, Math.ceil(dataMax))]} />
                      <Tooltip formatter={(v, name) => [`${v}% of steady state`, name]} contentStyle={{ background: "rgba(20,22,32,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#E8E9F0" }} />
                      {medLevel.classes.map((cls) => (
                        <Area key={cls} type="monotone" dataKey={cls} stroke={CLASS_COLORS[cls] || "#6366F1"} fill={CLASS_COLORS[cls] || "#6366F1"} fillOpacity={0.08} strokeWidth={2} />
                      ))}
                      {medLevel.markers.map((m) => (
                        <ReferenceLine key={m.key} x={m.day} stroke={m.color} strokeWidth={1.5} strokeOpacity={0.45} />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {/* Dose colour legend for the shot markers */}
                <DoseLegend items={medLevel.doseLegend} />
                {/* Steady state and the most recent dose, both from the logged doses */}
                {medLevel.summary?.hasRecentDose && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl p-2.5 text-center border border-transparent dark:border-indigo-500/15">
                      <p className="text-[11px] text-gray-500 dark:text-[#9A9DAE]">Steady state reached</p>
                      <p className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">{medLevel.summary.steadyStatePercent}%</p>
                      <p className="text-xs text-gray-500 dark:text-[#9A9DAE]">
                        of {medLevel.primaryClass} at {medLevel.summary.referenceDose} {medLevel.doseUnit} every {medLevel.interval}d
                      </p>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl p-2.5 text-center border border-transparent dark:border-indigo-500/15">
                      <p className="text-[11px] text-gray-500 dark:text-[#9A9DAE]">Last dose</p>
                      <p className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                        {medLevel.summary.lastDoseDaysAgo === 0 ? "Today" : `${medLevel.summary.lastDoseDaysAgo}d ago`}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-[#9A9DAE]">
                        {medLevel.summary.dosesInWindow} dose{medLevel.summary.dosesInWindow === 1 ? "" : "s"} inside the last 5 half-lives
                      </p>
                    </div>
                  </div>
                )}
              </>
            )
          ) : (
            <InsightEmptyState icon={<SyringeIcon size={28} className="text-gray-400 dark:text-[#9A9DAE] opacity-40" />}>
              Log your first shot to see relative exposure here.
            </InsightEmptyState>
            )}
            </div>
            {!isPremium && (
              <button onClick={openPaywall} className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center mb-3">
                  <Crown size={26} className="text-indigo-600" />
                </div>
                <p className="font-bold text-gray-900 dark:text-white">Unlock with Levli Premium</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs">Upgrade to premium to view estimated medication levels.</p>
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-[#9A9DAE] text-center mt-2">Time vs modelled exposure, as % of the steady-state level for your current dose</p>
          <p className="text-[11px] text-gray-400 dark:text-[#9A9DAE] text-center mt-1 px-2">Illustrative estimate only — not a blood-level measurement. Do not use it to adjust your dose. Confirm any decisions with your prescriber.</p>
          <button onClick={() => setShowHowItWorks(true)} className="w-full text-xs text-gray-500 dark:text-[#9A9DAE] text-center mt-1">How this works · model {PK_CALCULATION_VERSION}</button>
          {!medLevel.disabled && medLevel.classes.length > 0 && (
            <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
              {medLevel.classes.map((cls) => (
                <div key={cls} className="flex items-center gap-1.5">
                  <div className="w-4 h-0.5 rounded" style={{ background: CLASS_COLORS[cls] || "#6366F1" }} />
                  <span className="text-xs text-gray-500 dark:text-[#9A9DAE]">{cls}</span>
                </div>
              ))}
            </div>
          )}
        </InsightCard>

        <ExposureHowItWorks
          open={showHowItWorks}
          onClose={() => setShowHowItWorks(false)}
          medication={medLevel.medication}
          halfLifeDays={medLevel.primaryHL}
          intervalDays={medLevel.interval}
        />

        {/* Injection Site Rotation Panel */}
        <InsightCard>
          <SectionHeader
            icon={<IonIcon name="location" size={20} className="text-indigo-600 dark:text-indigo-400" />}
            title="Injection Site Rotation"
          />

          <RangeTabs options={Object.keys(MED_RANGES)} value={siteRange} onChange={setSiteRange} />

          <div className="relative">
            <div className={isPremium ? "" : "blur-sm pointer-events-none select-none opacity-60"}>
              {shotsInSiteRange === 0 ? (
                <InsightEmptyState
                  icon={<IonIcon name="location" size={30} className="text-gray-400 dark:text-[#9A9DAE] opacity-40" />}
                  action={siteRange !== "90 Days" ? (
                    <button onClick={() => setSiteRange("90 Days")} className="btn-pill btn-primary">
                      Try 90 days
                    </button>
                  ) : (
                    <Link to="/shots" className="btn-pill btn-primary">
                      Log a shot
                    </Link>
                  )}
                >
                  No shots in the last {siteRangeDays} days.
                </InsightEmptyState>
              ) : (
                <SiteRotationChart shots={shots} range={MED_RANGES[siteRange]} />
              )}
            </div>
            {!isPremium && (
              <button onClick={openPaywall} className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center mb-3">
                  <Crown size={26} className="text-indigo-600" />
                </div>
                <p className="font-bold text-gray-900 dark:text-white">Unlock with Levli Premium</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs">Upgrade to premium to view your injection site rotation.</p>
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-[#9A9DAE] text-center mt-2">Rotate sites to support absorption and reduce irritation.</p>
        </InsightCard>

        <WellbeingPanel />
        <SideEffectsPanel />

        <UpsellBanner />
      </div>
    </PageContainer>
  );
}