import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Settings, Syringe, Info, HelpCircle, Wind, ArrowRight } from "lucide-react";
import PageContainer from "@/components/PageContainer";
import AppFooterDisclaimer from "@/components/AppFooterDisclaimer";
import Fab from "@/components/Fab";
import DateStrip from "@/components/home/DateStrip";
import NextShotCard from "@/components/home/NextShotCard";
import RepeatDoseCard from "@/components/home/RepeatDoseCard";
import MetricsGrid from "@/components/home/MetricsGrid";
import AddShotModal from "@/components/modals/AddShotModal";
import SideEffectsModal from "@/components/modals/SideEffectsModal";
import { useAppState } from "@/lib/AppState";
import { toDayKey } from "@/lib/dateUtils";
import LockedFeatureCard from "@/components/LockedFeatureCard";
import FirstRunCard from "@/components/home/FirstRunCard";
import AddMedicationCard from "@/components/home/AddMedicationCard";
import MedicationModal from "@/components/modals/MedicationModal";
import UnitCheckPrompt from "@/components/home/UnitCheckPrompt";
import { useSubscription } from "@/lib/SubscriptionContext";
import { useMountProbe } from "@/lib/perfProbe";

export default function Home() {
  // Reports every mount of this screen when the probe is on (?perf=1). Home
  // mounting more than once per login is exactly what should never happen.
  useMountProbe("Home");
  const [showShot, setShowShot] = useState(false);
  const [shotPreset, setShotPreset] = useState(null);
  const [showSideEffects, setShowSideEffects] = useState(false);
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { getSideEffects, adverseEventsByDay } = useAppState();
  const { isPremium } = useSubscription();
  const dk = toDayKey(selectedDate);
  const sideEffects = getSideEffects(dk);
  const dayAdverseEvents = adverseEventsByDay[dk] || [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning!" : hour < 18 ? "Good Afternoon!" : "Good Evening!";

  return (
    <PageContainer bottomInset="fab">
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-950 w-full flex items-center justify-between px-5 pt-6 pb-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{greeting}</h1>
        <Link to="/settings" aria-label="Settings"><Settings size={24} className="text-gray-600 dark:text-gray-400" /></Link>
      </div>

      <div className="max-w-3xl mx-auto pt-4">
        <DateStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        <FirstRunCard onAddShot={() => { setShotPreset(null); setShowShot(true); }} />
        <AddMedicationCard onAdd={() => setShowAddMedication(true)} />
        <RepeatDoseCard onEdit={(preset) => { setShotPreset(preset); setShowShot(true); }} />
        <NextShotCard onLogPastShot={(preset) => { setShotPreset(preset); setShowShot(true); }} />
        <MetricsGrid dayKey={dk} />

        {/* Side Effects card */}
        <button
          onClick={() => setShowSideEffects(true)}
          className="relative overflow-hidden mx-3 mb-4 bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 w-[calc(100%-1.5rem)] text-left"
        >
          <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:"rgba(99,102,241,0.13)"}}>
              <Wind size={16} className="text-indigo-500" />
            </div>
            <span className="font-semibold text-gray-700 dark:text-gray-300">Side effects</span>
          </div>
          {sideEffects || dayAdverseEvents.length > 0 ? (
            <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-xl p-3 border border-transparent dark:border-indigo-500/15">
              {dayAdverseEvents.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {dayAdverseEvents.map((e) => (
                    <span key={e.id} className="text-xs bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full px-2 py-0.5 border border-indigo-500/20">
                      {e.symptom} <span className="opacity-60">({e.severity})</span>
                    </span>
                  ))}
                </div>
              )}
              {sideEffects && <p className="text-sm text-gray-700 dark:text-[#E8E9F0]">{sideEffects}</p>}
            </div>
          ) : (
            <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-xl p-3 flex items-center gap-2 border border-transparent dark:border-indigo-500/15">
              <Info size={16} className="text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
              <p className="text-sm text-indigo-700 dark:text-indigo-300">Tap to add side effects.</p>
            </div>
          )}
          </div>
        </button>

        {/* Medication Levels card */}
        <div className="mx-3 mb-4 bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:"rgba(99,102,241,0.13)"}}>
                <Syringe size={16} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Modelled Medication Exposure</h3>
                <p className="text-xs text-indigo-500">Illustrative estimate of relative medication exposure (not a blood-level measurement).</p>
              </div>
            </div>
            <HelpCircle size={18} className="text-indigo-400" />
          </div>
          <div className="border-b-2 border-indigo-500 w-12 mb-3" />
          {isPremium ? (
            <Link to="/insights" className="bg-indigo-50 dark:bg-indigo-500/10 rounded-xl p-3 flex items-center gap-2 block border border-transparent dark:border-indigo-500/15">
              <Info size={16} className="text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
              <p className="text-sm text-indigo-700 dark:text-indigo-300">View full exposure chart in Insights <ArrowRight size={12} className="inline" /></p>
            </Link>
          ) : (
            <LockedFeatureCard subtitle="Upgrade to premium to view estimated medication levels.">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {["7 Days", "30 Days", "90 Days"].map((r) => (
                  <span key={r} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-400">{r}</span>
                ))}
              </div>
              <div className="h-32 rounded-xl bg-gradient-to-b from-indigo-50 to-transparent dark:from-indigo-500/10" />
            </LockedFeatureCard>
          )}
        </div>

        <AppFooterDisclaimer />
      </div>

      <Fab onClick={() => { setShotPreset(null); setShowShot(true); }} label="Add Shot" />

      <AddShotModal open={showShot} onClose={() => { setShowShot(false); setShotPreset(null); }} initialValues={shotPreset} />
      <SideEffectsModal open={showSideEffects} onClose={() => setShowSideEffects(false)} dayKey={dk} />
      <MedicationModal open={showAddMedication} onClose={() => setShowAddMedication(false)} editing={null} />
      <UnitCheckPrompt />
    </PageContainer>
  );
}