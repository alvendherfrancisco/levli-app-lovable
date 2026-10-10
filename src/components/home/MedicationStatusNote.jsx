import React from "react";
import { Link } from "react-router-dom";
import { PauseCircle } from "lucide-react";
import { plainBrandName } from "@/lib/medicationConfig";
import { logWords } from "@/lib/medicationForm";

/**
 * A medication that is not running: paused, stopped or archived. It carries no
 * next-shot date and no reminder — this only says where it stands, so the
 * change can be made in Meds when the user wants to.
 */
export default function MedicationStatusNote({ medication, totalShots = 0 }) {
  const brand = plainBrandName(medication.medication_name);
  // A tablet's logs are doses, an injection's are shots.
  const words = logWords(medication.medication_name, { route: medication.route });
  const status = medication.status;
  const heading = status === "paused" ? "Medication paused"
    : status === "archived" ? "Medication archived"
    : "Medication stopped";

  let line;
  if (status === "paused") {
    line = `You paused ${brand}. Its schedule is on hold.`;
  } else if (status === "archived") {
    line = `${brand} is archived, so it is off your schedule. Its ${totalShots} ${words.one} log${totalShots === 1 ? "" : "s"} are kept.`;
  } else {
    line = `You marked ${brand} as stopped${medication.discontinued_date ? ` on ${medication.discontinued_date}` : ""}. Its schedule is paused.`;
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 mx-4 mb-4">
      <p className="text-sm text-gray-400 dark:text-[#9A9DAE] mb-2">{heading}</p>
      <div className="bg-gray-50 dark:bg-white/[0.05] rounded-xl p-3 flex items-start gap-2">
        <PauseCircle size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm text-gray-700 dark:text-[#E8E9F0]">{line}</p>
          <Link to="/medications" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1 inline-block">
            Change this in Meds
          </Link>
        </div>
      </div>
    </div>
  );
}