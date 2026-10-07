import React from "react";
import { Check } from "lucide-react";
import OptionChips from "@/components/OptionChips";
import { FREQUENCY_LABEL, scheduleOptionsFor, withFrequency } from "@/lib/medicationSchedule";

const CHIP_CLASS =
  "inline-flex items-center max-w-full min-h-[44px] rounded-xl border-2 px-3.5 py-2 text-[14px] font-medium text-left transition-all active:scale-95";
const SELECTED_CLASS = "border-indigo-600 bg-indigo-50 text-indigo-700";
const UNSELECTED_CLASS = "border-gray-200 bg-white text-gray-600";

/** "5 Oct 2026" from a stored YYYY-MM-DD. */
function checkedDate(value) {
  const parts = String(value || "").split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return "";
  return new Date(parts[0], parts[1] - 1, parts[2])
    .toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * How often this medication is taken.
 *
 * The choices are this product's own — read from its catalogue entry, which was
 * checked against its prescribing information. A product with a single interval
 * is shown as settled rather than as a choice, and the source is named under
 * either form. A product with no approved label says so plainly and asks the
 * person for their prescription's schedule instead.
 */
export default function FrequencyField({ medication, schedule, onChange }) {
  const own = scheduleOptionsFor(medication);
  const single = own.allowed.length === 1;
  const confirmed = own.status === "confirmed" && !!own.source;
  const date = checkedDate(own.verified);

  return (
    <div className="mb-4">
      {single ? (
        <div>
          <p className="text-[14px] font-semibold text-gray-600 mb-2">How often</p>
          <div className="flex items-center gap-2.5 rounded-2xl border-2 border-indigo-100 bg-indigo-50/60 px-4 py-3">
            <Check size={16} strokeWidth={3} className="text-indigo-600 flex-shrink-0" />
            <span className="text-[15px] font-semibold text-indigo-700 min-w-0">
              {FREQUENCY_LABEL[own.allowed[0]]}
            </span>
          </div>
        </div>
      ) : (
        <OptionChips
          label="How often"
          labelClass="text-[14px] font-semibold text-gray-600"
          options={own.allowed.map((key) => ({ value: key, label: FREQUENCY_LABEL[key] }))}
          value={schedule.frequency}
          onChange={(key) => onChange(withFrequency(schedule, key))}
          required
          wrapClass="flex flex-col items-stretch gap-2"
          chipClass={CHIP_CLASS}
          selectedClass={SELECTED_CLASS}
          unselectedClass={UNSELECTED_CLASS}
        />
      )}

      <p className="text-[12.5px] text-gray-500 leading-relaxed mt-2.5">
        {confirmed ? (
          <>
            Checked against the manufacturer's prescribing information{" "}
            <a
              href={own.source}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 underline"
            >
              prescribing information
            </a>
            {date ? `, last checked ${date}.` : "."}
          </>
        ) : (
          "Levli has no approved label for this product, so nothing is filled in for you here."
        )}
      </p>
    </div>
  );
}