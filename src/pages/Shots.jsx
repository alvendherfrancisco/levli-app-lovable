import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Settings, FileText, Syringe, Loader2, Crown } from "lucide-react";
import PageContainer from "@/components/PageContainer";
import AppFooterDisclaimer from "@/components/AppFooterDisclaimer";
import Fab from "@/components/Fab";
import ShotCard from "@/components/shots/ShotCard";
import ShotSummaryCards from "@/components/shots/ShotSummaryCards";
import AddShotModal from "@/components/modals/AddShotModal";
import { useAppState } from "@/lib/AppState";
import { useSubscription } from "@/lib/SubscriptionContext";
import { logWords } from "@/lib/medicationForm";
import { isActiveMedication } from "@/lib/medicationLink";

export default function Shots() {
  const [showShot, setShowShot] = useState(false);
  const [editingShot, setEditingShot] = useState(null);
  const { shots, shotsLoading, medications } = useAppState();
  const { isPremium, openPaywall } = useSubscription();
  const navigate = useNavigate();

  const FREE_LIMIT = 10;
  const visibleShots = isPremium ? shots : shots.slice(0, FREE_LIMIT);
  const hiddenCount = isPremium ? 0 : Math.max(0, shots.length - FREE_LIMIT);

  // The screen speaks of doses for a product taken by mouth and of shots for an
  // injected one, following the medication in hand (src/lib/medicationForm.js).
  const last = shots[0] || null;
  const lastMed = last?.medication;
  const lastRegimen = medications.find((m) => m.medication_name === lastMed) || null;
  const focusMed = medications.find(isActiveMedication) || lastRegimen;
  const words = logWords(focusMed?.medication_name || lastMed, {
    route: focusMed?.route || last?.route || "",
    shots,
  });
  const addLabel = words.one === "dose" ? "Log dose" : "Add shot";

  const openEdit = (shot) => { setEditingShot(shot); setShowShot(true); };
  const openNew = () => { setEditingShot(null); setShowShot(true); };

  return (
    <PageContainer bottomInset="fab">
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-950 w-full flex items-center justify-between px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{words.Many}</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/report")}><FileText size={22} className="text-gray-500" /></button>
          <Link to="/settings" aria-label="Settings"><Settings size={22} className="text-gray-600" /></Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto pt-4">
        {/* Summary cards — the same row Home shows, drawn from one component */}
        <ShotSummaryCards />

        <div className="px-4 pb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">History</h2>
          {shotsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={28} className="animate-spin text-indigo-400" />
            </div>
          ) : shots.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 text-center text-gray-400 dark:text-[#9A9DAE] border border-gray-100 dark:border-gray-800">
              <Syringe size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No {words.many} logged yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {visibleShots.map((shot) => (
                <button key={shot.id} onClick={() => openEdit(shot)} className="w-full text-left">
                  <ShotCard {...shot} drugClass={shot.drug_class} />
                </button>
              ))}
              {hiddenCount > 0 && (
                <button onClick={openPaywall} className="w-full bg-white dark:bg-gray-900 rounded-xl p-4 border border-dashed border-indigo-200 dark:border-indigo-500/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Crown size={18} className="text-indigo-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{hiddenCount} more {words.many} in your history</p>
                    <p className="text-xs text-gray-400">Unlock with Levli Premium to view your complete {words.one} history.</p>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <AppFooterDisclaimer />

      <Fab onClick={openNew} label={addLabel} icon={null} />

      <AddShotModal open={showShot} onClose={() => { setShowShot(false); setEditingShot(null); }} editingShot={editingShot} />
    </PageContainer>
  );
}