import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ExternalLink, BookOpen } from "lucide-react";
import { MEDICAL_SOURCES, MEDICAL_INFO_LAST_REVIEWED, REPORTING_SYSTEMS } from "@/lib/medicalSources";
import { APP_NAME, APP_VERSION, SUPPORT_EMAIL } from "@/lib/appInfo";

const Section = ({ title, children }) => (
  <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 mb-4">
    <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">{title}</h2>
    <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed space-y-2">{children}</div>
  </div>
);

export default function AboutSourcesPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen w-full">
      <div className="w-full flex items-center gap-3 px-5 pt-6 pb-4 bg-gray-50 dark:bg-gray-950 sticky top-0 z-30 border-b border-gray-100 dark:border-gray-800">
        <button onClick={() => navigate(-1)} aria-label="Go back"><ChevronLeft size={24} className="text-gray-600 dark:text-gray-400" /></button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">About &amp; Sources</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        <Section title={`About ${APP_NAME}`}>
          <p>{APP_NAME} is a personal logbook and tracker for people taking a prescribed medication. It records what you enter and shows it back to you. It does not give medical advice.</p>
          <p className="text-xs">Version {APP_VERSION}</p>
        </Section>

        <Section title="Where the medical information comes from">
          <p className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
            <BookOpen size={14} aria-hidden="true" /> Last reviewed: {MEDICAL_INFO_LAST_REVIEWED}
          </p>
          <p>The available strengths, dosing intervals and the half-lives used in the exposure estimate are taken from the regulator's published product information for each medicine:</p>
          <ul className="space-y-2 mt-2">
            {MEDICAL_SOURCES.map((source) => (
              <li key={source.product}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 text-indigo-600 dark:text-indigo-400 underline leading-snug"
                >
                  <span className="flex-1">{source.product} — {source.regulator} product information</span>
                  <ExternalLink size={14} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
          <p className="text-xs mt-2">Only the label's own figures are used, and each entry is re-checked against the source above on the review date shown. Your own medicine's current label always takes precedence.</p>
        </Section>

        <Section title="Reporting a suspected side effect">
          <p>Suspected side effects should be reported to your national scheme. Reporting helps regulators keep medicines safe.</p>
          <ul className="space-y-2 mt-2">
            {REPORTING_SYSTEMS.map((system) => (
              <li key={system.url}>
                <a href={system.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 underline">
                  {system.label} <ExternalLink size={14} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Found an error?">
          <p>If something in Levli does not match your medicine's label, tell us and it will be checked against the source above.</p>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=Medical%20information%20error%20in%20Levli`}
            className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 underline"
          >
            Report an error in medical info <ExternalLink size={14} aria-hidden="true" />
          </a>
        </Section>
      </div>
    </div>
  );
}