import React from "react";
import { Link } from "react-router-dom";
import { PauseCircle } from "lucide-react";
import { plainBrandName } from "@/lib/medicationConfig";
import { CARD, BODY_TEXT, BTN_TEXT } from "@/lib/uiStyles";

/**
 * A medication that is not running: paused, stopped or archived. It carries no
 * next-dose date and no reminder, so this only says where it stands, and how the
 * change can be made in Meds when the user wants to.
 */
export default function MedicationStatusNote({ medication, totalShots = 0 }) {
  const brand = plainBrandName(medication.medication_name);
  const status = medication.status;
  const heading = status === "paused" ? "Medication paused"
    : status === "archived" ? "Medication archived"
    : "Medication stopped";

  let line;
  if (status === "paused") {
    line = `You paused ${brand}. Its schedule is on hold.`;
  } else if (status === "archived") {
    line = `${brand} is archived, so it is off your schedule. Its ${totalShots} dose log${totalShots === 1 ? "" : "s"} are kept.`;
  } else {
    line = `You marked ${brand} as stopped${medication.discontinued_date ? ` on ${medication.discontinued_date}` : ""}. Its schedule is paused.`;
  }

  return (
    <div className={CARD}>
      <h3 className="text-[18px] font-medium text-gray-900 dark:text-white">{heading}</h3>
      <div className="mt-3 flex items-start gap-2 rounded-xl bg-gray-50 p-3 dark:bg-white/[0.05]">
        <PauseCircle size={18} className="mt-0.5 flex-shrink-0 text-gray-400" aria-hidden="true" />
        <div>
          <p className={BODY_TEXT}>{line}</p>
          <Link to="/medications" className={`${BTN_TEXT} mt-1`}>Change this in Meds</Link>
        </div>
      </div>
    </div>
  );
}