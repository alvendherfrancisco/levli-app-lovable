import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Settings, Wind, Info } from "lucide-react";
import PageContainer from "@/components/PageContainer";
import AppFooterDisclaimer from "@/components/AppFooterDisclaimer";
import Fab from "@/components/Fab";
import DateStrip from "@/components/home/DateStrip";
import NextShotCard from "@/components/home/NextShotCard";
import RepeatDoseCard from "@/components/home/RepeatDoseCard";
import MetricsGrid from "@/components/home/MetricsGrid";
import MedicationLevelsCard from "@/components/home/MedicationLevelsCard";
import AddShotModal from "@/components/modals/AddShotModal";
import SideEffectsModal from "@/components/modals/SideEffectsModal";
import { useAppState } from "@/lib/AppState";
import { toDayKey } from "@/lib/dateUtils";
import FirstRunCard from "@/components/home/FirstRunCard";
import AddMedicationCard from "@/components/home/AddMedicationCard";
import MedicationModal from "@/components/modals/MedicationModal";
import UnitCheckPrompt from "@/components/home/UnitCheckPrompt";
import { trackingEnabled } from "@/lib/trackingModules";
import { INJECTABLE_ROUTES } from "@/lib/shotDefaults";
import { useMountProbe } from "@/lib/perfProbe";
import { CARD, CARD_TITLE, INFO_BOX } from "@/lib/uiStyles";

export default function Home() {
  // Reports every mount of this screen when the probe is on (?perf=1). Home
  // mounting more than once per login is exactly what should never happen.
  useMountProbe("Home");
  const [showShot, setShowShot] = useState(false);
  const [shotPreset, setShotPreset] = useState(null);
  const [showSideEffects, setShowSideEffects] = useState(false);
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { getSideEffects, adverseEventsByDay, profile, medications } = useAppState();
  const dk = toDayKey(selectedDate);
  const sideEffects = getSideEffects(dk);
  const dayAdverseEvents = adverseEventsByDay[dk] || [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning!" : hour < 18 ? "Good afternoon!" : "Good evening!";

  // The one word for the action follows what this account actually takes: a
  // tablet or a capsule is never a shot.
  const running = (medications || []).filter((m) => (m.status || "active") === "active");
  const tabletsOnly = running.length > 0 && running.every((m) => !INJECTABLE_ROUTES.includes(m.route));
  const addLabel = tabletsOnly ? "Log dose" : "Add shot";

  return (
    <PageContainer bottomInset="fab">
      {/* The page's own gradient runs under this row, so it stays light rather
          than blocking the top of the screen with a solid band. */}
      <div className="sticky top-0 z-30 flex w-full items-center justify-between gap-3 bg-white/70 px-5 pb-3 pt-6 backdrop-blur-md dark:bg-gray-950/70">
        <h1 className="text-xl font-medium text-gray-900 dark:text-white">{greeting}</h1>
        <Link to="/settings" aria-label="Settings" className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full">
          <Settings size={22} strokeWidth={1.8} className="text-gray-500 dark:text-gray-400" />
        </Link>
      </div>

      {/* Every card, tile and section on this screen shares one width and one
          set of edges: the onboarding 20px side margins and the same 12px gap
          between cards. */}
      <div className="mx-auto w-full max-w-3xl space-y-3 px-5 pt-2">
        <DateStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        <FirstRunCard onAddShot={() => { setShotPreset(null); setShowShot(true); }} />
        <AddMedicationCard onAdd={() => setShowAddMedication(true)} />
        <RepeatDoseCard onEdit={(preset) => { setShotPreset(preset); setShowShot(true); }} />
        <NextShotCard onLogPastShot={(preset) => { setShotPreset(preset); setShowShot(true); }} />
        <MetricsGrid dayKey={dk} />

        {/* Side Effects card, shown only when side effects are one of the
            modules this account chose. Otherwise it is added back in Settings. */}
        {trackingEnabled(profile, "symptoms") && (
          <button onClick={() => setShowSideEffects(true)} className={`${CARD} w-full text-left`}>
            <div className="flex items-center gap-2">
              <span
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                style={{ background: "rgba(99,102,241,0.13)" }}
                aria-hidden="true"
              >
                <Wind size={16} className="text-indigo-500" />
              </span>
              <span className={CARD_TITLE}>Side effects</span>
            </div>
            {sideEffects || dayAdverseEvents.length > 0 ? (
              <div className={`${INFO_BOX} mt-3`}>
                {dayAdverseEvents.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1">
                    {dayAdverseEvents.map((e) => (
                      <span
                        key={e.id}
                        className="rounded-full border border-indigo-200 bg-white/70 px-2 py-0.5 text-[13px] text-indigo-700 dark:border-indigo-500/25 dark:bg-white/[0.06] dark:text-indigo-300"
                      >
                        {e.symptom} <span className="opacity-60">({e.severity})</span>
                      </span>
                    ))}
                  </div>
                )}
                {sideEffects && <p>{sideEffects}</p>}
              </div>
            ) : (
              <div className={`${INFO_BOX} mt-3 flex items-center gap-2`}>
                <Info size={16} className="flex-shrink-0" />
                <p>Tap to add</p>
              </div>
            )}
          </button>
        )}

        <MedicationLevelsCard />
        <AppFooterDisclaimer />
      </div>

      <Fab onClick={() => { setShotPreset(null); setShowShot(true); }} label={addLabel} />

      <AddShotModal open={showShot} onClose={() => { setShowShot(false); setShotPreset(null); }} initialValues={shotPreset} />
      <SideEffectsModal open={showSideEffects} onClose={() => setShowSideEffects(false)} dayKey={dk} />
      <MedicationModal open={showAddMedication} onClose={() => setShowAddMedication(false)} editing={null} />
      <UnitCheckPrompt />
    </PageContainer>
  );
}