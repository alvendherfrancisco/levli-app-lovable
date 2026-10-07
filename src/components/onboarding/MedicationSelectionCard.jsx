import React, { useState } from "react";
import { X, ChevronDown } from "lucide-react";
import MedicationName from "@/components/MedicationName";
import DoseChips from "@/components/modals/DoseChips";
import CustomProductDetails from "@/components/modals/CustomProductDetails";
import { chip, FIELD_SM } from "@/components/onboarding/onboardingStyles";
import { doseChipsFor } from "@/lib/onboardingMeds";
import { getDefaultRoute, getRouteChoices } from "@/lib/shotDefaults";
import { getShotDeviceOptions } from "@/lib/deliveryMethods";
import { sound } from "@/lib/sounds";

const UNIT_CHOICES = ["mg", "mcg", "units", "IU", "mL"];

/**
 * One chosen medication: its name, the dose, and — folded away — the optional
 * extras (how it is delivered, anything worth noting). Everything else on the
 * step stays visible; this is the only part that can be opened.
 *
 * A custom ("Others") entry asks for its own name (required) and generic name
 * (optional) and takes a typed dose, because there is no label to offer chips
 * from. A catalogue product with no listed strengths works the same way.
 */
export default function MedicationSelectionCard({ entry, onChange, onRemove, savedRegimen, duplicateName = false }) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const chips = doseChipsFor(entry, savedRegimen);
  const freeDose = entry.isCustom || chips.length === 0;
  const linked = duplicateName && savedRegimen;

  const route = entry.name ? getDefaultRoute(entry.name) : "";
  const devices = entry.name && !entry.isCustom ? getShotDeviceOptions(entry.name, route) : [];
  const routeLabel = entry.isCustom ? "" : (getRouteChoices(entry.name)[0]?.label || "");

  const doseField = (
    <div className="flex items-center gap-2">
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step="any"
        value={entry.dose}
        onChange={(e) => onChange({ dose: e.target.value })}
        placeholder="Dose"
        aria-label={`Dose for ${entry.name || "this medication"}`}
        className={`${FIELD_SM} min-w-0 flex-1 basis-0`}
      />
      <select
        value={entry.unit}
        onChange={(e) => onChange({ unit: e.target.value })}
        aria-label="Dose unit"
        className="min-h-[44px] w-[104px] flex-shrink-0 rounded-xl border border-border bg-background px-2 text-[15px] text-foreground outline-none focus:border-primary"
      >
        {UNIT_CHOICES.map((u) => <option key={u} value={u}>{u}</option>)}
      </select>
    </div>
  );

  return (
    <div className="rounded-2xl border border-border bg-background p-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          {entry.isCustom && !entry.name ? (
            <p className="text-[15px] font-semibold text-foreground">New medication</p>
          ) : (
            <MedicationName name={entry.name} className="text-[15px] font-semibold text-foreground" />
          )}
          {linked && (
            <p className="mt-0.5 text-[12px] leading-tight text-muted-foreground">
              Already in your Meds{linked.prescribed_dose ? ` · ${linked.prescribed_dose} ${linked.dose_unit || "mg"}` : ""} — this entry links to it, nothing is duplicated.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => { sound.tap(); onRemove(); }}
          aria-label={`Remove ${entry.name || "this medication"}`}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground"
        >
          <X size={18} />
        </button>
      </div>

      {entry.isCustom && (
        <div className="mt-2 space-y-2.5">
          <div>
            <label htmlFor="onb-custom-name" className="mb-1.5 block text-sm font-semibold text-foreground">
              Medication name
            </label>
            <input
              id="onb-custom-name"
              type="text"
              value={entry.name}
              autoComplete="off"
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="Type the name on your prescription"
              className={FIELD_SM}
            />
            {!entry.name.trim() && (
              <p className="mt-1.5 text-[12px] leading-tight text-muted-foreground">
                Enter the name from your prescription to continue.
              </p>
            )}
          </div>
          <CustomProductDetails
            generic={entry.generic}
            onGenericChange={(v) => onChange({ generic: v })}
            strengths={entry.strengths}
            onStrengthsChange={(v) => onChange({ strengths: v })}
            inputClass={FIELD_SM}
            showStrengths={false}
          />
        </div>
      )}

      <div className="mt-2.5">
        {freeDose ? (
          <>
            <p className="mb-1.5 text-sm font-semibold text-foreground">Dose</p>
            {doseField}
          </>
        ) : (
          <DoseChips
            medication={entry.name}
            options={chips}
            value={entry.dose}
            unit={entry.unit}
            onSelect={(v) => onChange({ dose: v === "" || v == null ? "" : String(v) })}
            onAddCustom={async (d) => onChange({
              dose: String(d),
              extraDoses: [...new Set([...(entry.extraDoses || []), Number(d)])].sort((a, b) => a - b),
            })}
          />
        )}
      </div>

      <button
        type="button"
        onClick={() => { sound.tap(); setDetailsOpen((v) => !v); }}
        aria-expanded={detailsOpen}
        className="mt-2 flex min-h-[44px] w-full items-center justify-between rounded-xl px-1 text-left text-[13px] font-medium text-muted-foreground"
      >
        <span>{detailsOpen ? "Hide details" : "Add details (optional)"}</span>
        <ChevronDown size={16} className={detailsOpen ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>

      {detailsOpen && (
        <div className="space-y-2.5 border-t border-border pt-2.5">
          {devices.length > 0 ? (
            <div>
              <p className="mb-1.5 text-sm font-semibold text-foreground">Delivery method</p>
              <div className="flex flex-wrap gap-1.5">
                {devices.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => { sound.tap(); onChange({ deviceType: entry.deviceType === d.value ? "" : d.value }); }}
                    aria-pressed={entry.deviceType === d.value}
                    className={`${chip(entry.deviceType === d.value)} min-h-[44px] rounded-xl px-3 text-[13px]`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            routeLabel && (
              <p className="text-[13px] text-muted-foreground">How it's taken: <span className="font-medium text-foreground">{routeLabel}</span></p>
            )
          )}

          <div>
            <p className="mb-1.5 text-sm font-semibold text-foreground">Notes (optional)</p>
            <input
              type="text"
              value={entry.notes}
              autoComplete="off"
              aria-label={`Notes for ${entry.name || "this medication"}`}
              onChange={(e) => onChange({ notes: e.target.value })}
              placeholder="e.g. left thigh, take with water"
              className={FIELD_SM}
            />
          </div>
        </div>
      )}
    </div>
  );
}