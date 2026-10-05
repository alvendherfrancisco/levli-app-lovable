import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { REPORT_FIXTURES } from "@/lib/reportFixtures";
import FixtureCard from "@/components/report/FixtureCard";

/**
 * Test-only screen: every report fixture rendered through the real report engine
 * and preview, so the template can be checked against known scenarios — and each
 * one exported as a PDF. It reads nothing from the user's data and is not part of
 * the report flow.
 */
export default function ReportFixturesPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen w-full">
      <header
        className="w-full sticky top-0 z-30 grid items-center px-5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800"
        style={{
          gridTemplateColumns: "1fr auto 1fr",
          paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))",
          paddingBottom: "0.75rem",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="justify-self-start flex items-center gap-1 min-w-[44px] min-h-[44px] text-indigo-600 dark:text-indigo-400"
        >
          <ChevronLeft size={22} /><span className="font-medium">Back</span>
        </button>
        <h1 className="text-center whitespace-nowrap text-[18px] font-semibold text-gray-900 dark:text-white">Report fixtures</h1>
        <span aria-hidden="true" />
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-5">
        <p className="text-xs text-gray-500 dark:text-gray-400 px-1">
          Test data only — nothing here comes from your account. Each report below is built by the real report
          engine, and the PDF button exports that fixture exactly as a user would export their own.
        </p>
        {REPORT_FIXTURES.map((fixture) => (
          <FixtureCard key={fixture.id} fixture={fixture} />
        ))}
        <div style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }} />
      </div>
    </div>
  );
}