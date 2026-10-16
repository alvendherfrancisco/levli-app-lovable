import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
import IonIcon from "@/components/IonIcon";
import StatTile from "@/components/insights/StatTile";
import { FOOTNOTE } from "@/components/insights/insightUi";
import InsightCard from "@/components/insights/InsightCard";
import SectionHeader from "@/components/insights/SectionHeader";
import InsightEmptyState from "@/components/insights/InsightEmptyState";
import RangeTabs from "@/components/insights/RangeTabs";
import ProgressPhotoCard from "@/components/insights/ProgressPhotoCard";
import WeightProgressChart from "@/components/insights/WeightProgressChart";
import SideEffectsCard from "@/components/insights/SideEffectsCard";
import HowItWorksLink from "@/components/insights/HowItWorksLink";
import AddMetricModal from "@/components/modals/AddMetricModal";
import { useAppState } from "@/lib/AppState";
import { todayKey } from "@/lib/dateUtils";
import { getHalfLifeDays, getDosingInterval } from "@/lib/medicationData";
import { fromKg, heightCmOf, shownBmi, weightUnitLabel } from "@/lib/measure";
import { buildWeightProgress } from "@/lib/expectedProgress";
import { sound } from "@/lib/sounds";
import ExposureHowItWorks from "@/components/insights/ExposureHowItWorks";
import WellbeingPanel from "@/components/insights/WellbeingPanel";
import { toast } from "@/lib/toast";
import useDoseColors from "@/hooks/useDoseColors";
import PageContainer from "@/components/PageContainer";

/**
 * The ranges the card offers: how far back each one reaches, and whether the
 * expected curve is drawn on it. "Since start" runs from the first logged weight
 * instead, and every range draws the curve but the 30-day one — over four weeks
 * it is a flat line that adds nothing.
 */
const WEIGHT_RANGES = {
  "30 Days": { days: 30, curve: false },
  "180 Days": { days: 180, curve: true },
  "1 Year": { days: 365, curve: true },
  "Since start": { days: null, curve: true },
};

export default function Insights() {
  const { shots, weightHistory, profile, progressPhotosList, addProgressPhotoRecord, updateProgressPhotoRecord, deleteProgressPhotoRecord, getWeight, unitCheck } = useAppState();
  const [weightRange, setWeightRange] = useState("180 Days");
  // The expected curve is on to begin with; the toggle above the graph turns it off.
  const [showExpected, setShowExpected] = useState(true);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [photoModal, setPhotoModal] = useState(null);
  const weightUnit = profile?.weight_unit || "lb";
  // Markers and the chart's axis labels follow the theme, so they repaint with it.
  const { isDark } = useDoseColors();
  const tickFill = isDark ? "#B4B8C7" : "#767676";

  // The sheet behind "How GLP-1s work" describes the product in hand.
  const latestShot = shots[0] || null;
  const howItWorks = {
    medication: latestShot?.medication || "",
    halfLifeDays: latestShot ? getHalfLifeDays(latestShot.medication, latestShot.route || "subcutaneous") : null,
    intervalDays: latestShot ? getDosingInterval(latestShot.medication) || null : null,
  };

  // Everything the one graph draws: the weights logged in the range, their
  // 7-day average, the expected curve and the goal.
  const progress = useMemo(
    () => buildWeightProgress({
      weightHistory, profile, shots,
      unit: weightUnit,
      daysBack: WEIGHT_RANGES[weightRange].days,
      showCurve: WEIGHT_RANGES[weightRange].curve,
    }),
    [weightHistory, profile, shots, weightUnit, weightRange]
  );
  const rows = progress?.rows || [];

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

  // Uses getWeight so each entry is converted from the unit it was logged in.
  const getWeightLabel = (dayKey) => {
    const w = getWeight(dayKey);
    return w != null ? `${w.toFixed(1)} ${weightUnit}` : null;
  };

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

  // ── Weight stats (over the entries actually logged in the range) ────────────
  const weightEntries = rows.filter((r) => r.weight != null);
  const firstEntry = weightEntries[0] || null;
  const lastEntry = weightEntries[weightEntries.length - 1] || null;

  const weightLoss = weightEntries.length >= 2
    ? firstEntry.weight - lastEntry.weight
    : null;

  const actualWeeks = weightEntries.length >= 2
    ? Math.max(1, (() => {
        const [y1,m1,d1] = firstEntry.isoDate.split("-").map(Number);
        const [y2,m2,d2] = lastEntry.isoDate.split("-").map(Number);
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
    ? `${weightLoss >= 0 ? "Down" : "Up"} ${Math.abs(weightLoss).toFixed(1)} ${weightUnit} ${
        weightRange === "Since start" ? "since your first logged weight" : `over ${weightRange.toLowerCase()}`
      }`
    : "";

  return (
    <PageContainer bottomInset="default" disclaimer>
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-950 w-full flex items-center justify-between px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Insights</h1>
        <Link to="/settings" aria-label="Settings" className="-mr-2 flex h-11 w-11 items-center justify-center"><Settings size={22} className="text-gray-600 dark:text-gray-400" /></Link>
      </div>

      <div className="w-full max-w-3xl mx-auto pt-4">
        {/* Weight Change Panel */}
        <InsightCard className="overflow-hidden">
          <SectionHeader
            icon={<IonIcon name="trending-down" size={20} className="text-indigo-600 dark:text-indigo-400" />}
            title="Weight Change"
          />

          <RangeTabs options={Object.keys(WEIGHT_RANGES)} value={weightRange} onChange={setWeightRange} />

          {/* Summary tiles: one row of four, each drawn identically */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
            <StatTile
              tone="teal"
              icon="arrow-down-circle"
              label="Weight Loss"
              value={weightLoss != null ? `${weightLoss >= 0 ? "-" : "+"}${Math.abs(weightLoss).toFixed(1)} ${weightUnit}` : "—"}
            />
            <StatTile
              tone="indigo"
              icon="flash"
              label="% Change"
              value={pctWeightChange != null ? `${pctWeightChange >= 0 ? "-" : "+"}${Math.abs(pctWeightChange)}%` : "—"}
            />
            <StatTile
              tone="purple"
              icon="time"
              label="Rate/Week"
              value={ratePerWeek != null ? `${ratePerWeek >= 0 ? "-" : "+"}${Math.abs(ratePerWeek).toFixed(1)} ${weightUnit}` : "—"}
            />
            <StatTile
              tone="orange"
              icon="speedometer"
              label="Current BMI"
              value={bmi || (bmiNeedsCheck ? <span className="text-xs font-medium">Not shown, check units</span> : heightMissing ? <span className="text-xs font-medium">Add height in Profile</span> : "—")}
            />
          </div>

          {/* The BMI note is the first thing under the tiles it belongs to. */}
          {bmi && (
            <p className={`mb-4 ${FOOTNOTE}`}>
              BMI is a screening measure, not a diagnostic tool. It does not account for body composition.
            </p>
          )}

          {bmiNeedsCheck && (
            <div className="mb-4 rounded-xl border border-orange-200 dark:border-orange-500/20 bg-orange-50 dark:bg-orange-500/10 px-4 py-3">
              <p className="text-[12px] leading-relaxed text-orange-700 dark:text-orange-300">
                The height and weight on file do not produce a plausible BMI, so no number is shown. Check your height and weight units in Profile.
              </p>
              <Link to="/profile" className="-ml-1 flex min-h-[44px] w-fit items-center px-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">Fix in Profile</Link>
            </div>
          )}

          {/* The expected curve is offered only where it can be read: the 30-day
              range hides it, because four weeks of a two-year curve is a flat
              line that adds nothing. */}
          {progress?.showCurve && weightEntries.length > 0 && (
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                role="switch"
                aria-label="Show expected progress"
                aria-checked={showExpected}
                onClick={() => setShowExpected((v) => !v)}
                className="inline-flex min-h-[44px] items-center gap-2.5 rounded-full border border-cardline pl-4 pr-3 text-[13px] font-medium text-gray-600 dark:text-gray-300"
              >
                Expected
                <span className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors ${showExpected ? "bg-indigo-600" : "bg-gray-300 dark:bg-white/20"}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${showExpected ? "left-[18px]" : "left-0.5"}`} />
                </span>
              </button>
            </div>
          )}

          {weightEntries.length > 0 ? (
            <>
              <WeightProgressChart
                rows={rows}
                startKey={progress.startKey}
                windowStart={progress.windowStart}
                windowEnd={progress.windowEnd}
                goal={fromKg(progress.goalKg, weightUnit)}
                showCurve={progress.showCurve && showExpected}
                unitLabel={weightUnitLabel(weightUnit)}
                tickFill={tickFill}
                ariaLabel={weightSummary || "Weight chart"}
              />
              <p className={`mt-3 text-center ${FOOTNOTE}`}>
                Illustrative only. Everyone responds differently. Not medical advice.
              </p>
              <p className={`mt-2 text-center ${FOOTNOTE}`}>Dots: your logged weights · Dashed: 7-day average</p>
              {weightEntries.length === 1 && (
                <div className="mt-4 flex justify-center">
                  <Link to="/" className="btn-pill btn-pill-sm btn-primary">Log your weight</Link>
                </div>
              )}
            </>
          ) : (
            <InsightEmptyState
              message="No weights in this range yet."
              action={<Link to="/" className="btn-pill btn-pill-sm btn-primary">Log your weight</Link>}
            />
          )}

          <HowItWorksLink onClick={() => setShowHowItWorks(true)} />
        </InsightCard>

        {/* The gentle check-in, when the weight trend itself calls for one. It
            draws nothing at all unless a safeguard is active, and sits directly
            above the side effects it belongs beside. */}
        <WellbeingPanel />

        {/* What keeps coming back over the last 30 or 90 days — logged in one
            place, read here, under the weight and the check-in it sits beside. */}
        <SideEffectsCard />

        {/* Progress Pictures Panel — a strip of thumbnails with the Add button in
            the header, so the card stays one row tall. */}
        <InsightCard>
          <SectionHeader
            icon={<IonIcon name="camera" size={20} className="text-indigo-600 dark:text-indigo-400" />}
            title="Progress Pictures"
            action={<button onClick={openAddPhoto} className="btn-pill btn-pill-sm btn-primary">Add</button>}
          />

          {photosAsc.length === 0 ? (
            <InsightEmptyState message="No progress pictures yet." />
          ) : (
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {photosAsc.map((p) => (
                <ProgressPhotoCard
                  key={p.id}
                  photo={p}
                  dateLabel={formatPhotoDate(p.day_key)}
                  weightLabel={getWeightLabel(p.day_key)}
                  tag={p.id === latestPhoto.id ? "latest" : null}
                  onClick={() => openEditPhoto(p)}
                />
              ))}
            </div>
          )}

          <AddMetricModal open={!!photoModal} onClose={() => setPhotoModal(null)} label="Progress" unit="pic"
            value={photoModal?.mode === "edit" ? photoModal.url : "–"} dayKey={photoModal?.dayKey}
            onSave={handleSavePhotoModal} onDelete={photoModal?.mode === "edit" ? handleDeletePhotoModal : undefined} />
        </InsightCard>

        {/* The explainer behind the "How GLP-1s work" link on Expected Progress. */}
        <ExposureHowItWorks
          open={showHowItWorks}
          onClose={() => setShowHowItWorks(false)}
          medication={howItWorks.medication}
          halfLifeDays={howItWorks.halfLifeDays}
          intervalDays={howItWorks.intervalDays}
        />
      </div>
    </PageContainer>
  );
}