import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, AlertTriangle } from "lucide-react";
import { DISCLAIMER_TEXT } from "@/lib/appInfo";

const Section = ({ title, children }) => (
  <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 mb-4">
    <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">{title}</h2>
    <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed space-y-2">{children}</div>
  </div>
);

export default function MedicalDisclaimerPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen w-full">
      <div className="w-full flex items-center gap-3 px-5 pt-6 pb-4 bg-gray-50 dark:bg-gray-950 sticky top-0 z-30 border-b border-gray-100 dark:border-gray-800">
        <button onClick={() => navigate(-1)} aria-label="Go back"><ChevronLeft size={24} className="text-gray-600 dark:text-gray-400" /></button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Medical Disclaimer</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 mb-4 flex gap-3">
          <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">{DISCLAIMER_TEXT}</p>
        </div>

        <Section title="What Levli is">
          <p>Levli is a personal logbook and tracker. It records what you tell it — doses, symptoms, weight, nutrition and notes — and presents it back to you as history, trends and a report you can share.</p>
          <p>It is not a medical device, a diagnostic tool, or a treatment service.</p>
        </Section>

        <Section title="What Levli does not do">
          <p>Levli does not diagnose, treat, prevent, monitor or recommend treatment for any condition. It does not tell you what dose to take, when to change a dose, or whether a medication is right for you. It does not give clinical advice and cannot replace your prescriber, pharmacist or care team.</p>
          <p>Estimated medication levels, adherence percentages and exposure charts are illustrative calculations of the doses you have logged. They are not blood-level measurements and must not be used to make dosing decisions.</p>
        </Section>

        <Section title="Always follow your prescriber">
          <p>Follow the dose and schedule your prescriber gave you, and the instructions on your medicine's label. Never change, skip or stop a prescribed medicine because of anything you see in this app.</p>
        </Section>

        <Section title="When to get help">
          <p>If you feel unwell, or you are worried about a symptom, contact your prescriber, your pharmacist, or your local health service. If you have severe or worsening symptoms, contact emergency services immediately.</p>
          <p>The side-effect screen lists official reporting schemes you can use to report a suspected side effect.</p>
        </Section>

        <Section title="Accuracy">
          <p>Dosing information in Levli is transcribed from the official prescribing information for each product, and the sources are listed with their review dates on the About &amp; sources page. Products change; always check your own medicine's current label.</p>
          <p>Spotted an error? Report it from Settings and it will be reviewed.</p>
        </Section>
      </div>
    </div>
  );
}