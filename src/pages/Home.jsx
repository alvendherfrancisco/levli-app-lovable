import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Settings, Info, Wind } from "lucide-react";
import { HEADER_ICON, HEADER_GLYPH } from "@/components/longlist/HeaderIconButton";
import PageContainer from "@/components/PageContainer";
import Fab from "@/components/Fab";
import DateStrip from "@/components/home/DateStrip";
import NextShotCard from "@/components/home/NextShotCard";
import RepeatDoseCard from "@/components/home/RepeatDoseCard";
import MetricsGrid from "@/components/home/MetricsGrid";
import WeightProgressCard from "@/components/home/WeightProgressCard";
import AddShotModal from "@/components/modals/AddShotModal";
import SideEffectsModal from "@/components/modals/SideEffectsModal";
import { useAppState } from "@/lib/AppState";
import { toDayKey, todayKey } from "@/lib/dateUtils";
import { logsAsDose } from "@/lib/medicationForm";
import { isActiveMedication } from "@/lib/medicationLink";
import UnitCheckPrompt from "@/components/home/UnitCheckPrompt";
import PushOptInBanner from "@/components/home/PushOptInBanner";
import SharedWithMeCard from "@/components/home/SharedWithMeCard";
import CardTitleRow from "@/components/home/CardTitleRow";
import SupplyAlertBanner from "@/components/SupplyAlertBanner";
import { CARD } from "@/lib/cardStyles";
import { useMountProbe } from "@/lib/perfProbe";

export default function Home() {
  // Reports every mount of this screen when the probe is on (?perf=1). Home
  // mounting more than once per login is exactly what should never happen.
  useMountProbe("Home");
  const [showShot, setShowShot] = useState(false);
  const [shotPreset, setShotPreset] = useState(null);
  const [showSideEffects, setShowSideEffects] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { getSideEffects, adverseEventsByDay, medications, profile, shots } = useAppState();
  const dk = toDayKey(selectedDate);
  // The action, named for the product in hand: a dose is taken, a shot is given.
  // The medication's form decides it (see src/lib/medicationForm.js), and the
  // account's default settles it when nothing is saved yet — the same reading the
  // Next shot card uses below.
  const currentMedication = medications.find(isActiveMedication) || medications[0] || null;
  const actionLabel = logsAsDose(
    currentMedication?.medication_name || profile?.default_medication,
    { route: currentMedication?.route, shots }
  ) ? "Log dose" : "Add shot";
  // Nothing is logged ahead of today, so the button belongs to today and to the
  // days already past.
  const canLogForDay = dk <= todayKey();
  const sideEffects = getSideEffects(dk);
  const dayAdverseEvents = adverseEventsByDay[dk] || [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning!" : hour < 18 ? "Good Afternoon!" : "Good Evening!";

  return (
    <PageContainer bottomInset="banner" disclaimer>
      {/* 16px at the sides, the page's one margin: the title starts on the same
          line as the edge of every card below it. */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-950 w-full flex items-center justify-between px-4 pt-6 pb-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{greeting}</h1>
        <Link to="/settings" aria-label="Settings" className={HEADER_ICON}>
          <Settings size={HEADER_GLYPH} aria-hidden="true" />
        </Link>
      </div>

      {/* Home's spacing, in one place: 16px at the sides — every card keeps the
          same margin, so their edges line up with each other, with the title above
          them and with the cards on the Shots and Journal screens — 16px between
          cards (each card's own mb-4), 12px inside a card between its title row and
          its content, and 24px from the header to the first section (the header's
          own 8px, then 16px here). The room the floating button and the tab bar
          need is the page's own bottom inset (PageContainer), so the last card is
          never left under them. */}
      <div className="w-full max-w-3xl mx-auto pt-4 pb-6">
        {/* A supply reminder sits at the top of the screen, where the eye lands
            first. It never stops a dose being logged. */}
        <SupplyAlertBanner className="mx-4 mb-4" />
        <DateStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        <RepeatDoseCard onEdit={(preset) => { setShotPreset(preset); setShowShot(true); }} />
        <NextShotCard onLogPastShot={(preset) => { setShotPreset(preset); setShowShot(true); }} />
        <div className="mx-4 mb-4 empty:hidden"><PushOptInBanner /></div>
        {/* Records someone else has shared with this account, when there are any.
            It renders nothing at all otherwise. */}
        <SharedWithMeCard />
        <MetricsGrid dayKey={dk} />

        {/* Side Effects card — the page's own card shell, margin and inner
            padding, like every other card on Home. */}
        <div className="mx-4 mb-4">
          <button
            type="button"
            onClick={() => setShowSideEffects(true)}
            className={`${CARD} block w-full p-4 text-left`}
          >
            <CardTitleRow
              icon={<Wind size={16} className="text-indigo-500 dark:text-indigo-400" />}
              label="Side effects"
            />
            {sideEffects || dayAdverseEvents.length > 0 ? (
              <div className="mt-3 rounded-xl border border-transparent bg-indigo-50 p-3 dark:border-indigo-500/15 dark:bg-indigo-500/10">
                {dayAdverseEvents.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1">
                    {dayAdverseEvents.map((e) => (
                      <span key={e.id} className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-xs text-indigo-600 dark:text-indigo-400">
                        {e.symptom} <span className="opacity-60">({e.severity})</span>
                      </span>
                    ))}
                  </div>
                )}
                {sideEffects && <p className="text-sm text-gray-700 dark:text-[#E8E9F0]">{sideEffects}</p>}
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-transparent bg-indigo-50 p-3 dark:border-indigo-500/15 dark:bg-indigo-500/10">
                <Info size={16} className="flex-shrink-0 text-indigo-500 dark:text-indigo-400" />
                <p className="text-sm text-indigo-700 dark:text-indigo-300">Tap to add side effects.</p>
              </div>
            )}
          </button>
        </div>

        {/* Weight Progress — the weight now, what has been lost since the first
            weight logged and how far the goal on Profile still is. It reads the
            same weight history the Insights page reads, so the two always agree. */}
        <WeightProgressCard dayKey={dk} />
      </div>

      {canLogForDay && (
        <Fab
          onClick={() => { setShotPreset(null); setShowShot(true); }}
          label={actionLabel}
          icon={null}
        />
      )}

      <AddShotModal open={showShot} onClose={() => { setShowShot(false); setShotPreset(null); }} initialValues={shotPreset} />
      <SideEffectsModal open={showSideEffects} onClose={() => setShowSideEffects(false)} dayKey={dk} />
      <UnitCheckPrompt />
    </PageContainer>
  );
}