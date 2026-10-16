import React, { useMemo } from "react";
import { Check } from "lucide-react";
import BodyFrames from "@/components/shots/BodyFrames";
import { SHEET_CHIP, SHEET_CHIP_OFF, SHEET_CHIP_ON } from "@/components/modals/shot/sheetUi";
import {
  SITE_VIEWS, siteKey, siteLabel, siteUsage, siteViewLabel, shotsInSiteWindow,
} from "@/lib/injectionSites";
import { sound } from "@/lib/sounds";

/** How far back a site counts as "used recently" on the figures. */
const RECENT_DAYS = 90;

/**
 * Choosing where a dose went, on the body itself: the same two figures the
 * rotation card draws, with a spot for every site the form offers. The chosen
 * spot is filled and ringed, the one the rotation suggests is ringed, and a site
 * used in the last three months carries its own small dot.
 *
 * The chosen site's name reads underneath, with the figure it sits on, and the
 * same sites are listed below by name — grouped under their figure — for anyone
 * who would rather pick that way.
 */
export default function SitePicker({ sites, value, onChange, suggested = "", shots = [] }) {
  const usage = useMemo(() => siteUsage(shotsInSiteWindow(shots, RECENT_DAYS)), [shots]);
  const usedSites = useMemo(() => new Set(usage.map((u) => u.site)), [usage]);

  const selected = siteKey(value);
  const suggestedKey = siteKey(suggested);
  const viewLabel = siteViewLabel(value);

  const choose = (next) => {
    if (siteKey(next) === selected) return;
    sound.tap();
    onChange(next);
  };

  return (
    <div>
      <div className="mx-auto w-full max-w-[260px]">
        <BodyFrames
          className="h-auto w-full"
          ariaLabel="Body outline for choosing the injection site"
          renderMarks={(viewKey, colors) =>
            sites
              .filter((s) => s.view === viewKey)
              .map((s) => {
                const isSelected = s.value === selected;
                const isSuggested = !!suggestedKey && s.value === suggestedKey && !isSelected;
                const wasUsed = usedSites.has(s.value);
                return (
                  <g
                    key={s.value}
                    role="button"
                    tabIndex={0}
                    aria-label={s.label}
                    aria-pressed={isSelected}
                    className="cursor-pointer outline-none"
                    onClick={() => choose(s.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(s.value); }
                    }}
                  >
                    {/* A wider transparent circle, so the spot is easy to hit. */}
                    <circle cx={s.x} cy={s.y} r={13} fill="transparent" />
                    {isSuggested && (
                      <circle cx={s.x} cy={s.y} r={9.5} fill="none" stroke={colors.dotStrong}
                        strokeWidth="1.6" strokeDasharray="3 2.5" />
                    )}
                    {isSelected && (
                      <circle cx={s.x} cy={s.y} r={12} fill={colors.halo} />
                    )}
                    {isSelected ? (
                      <>
                        <circle cx={s.x} cy={s.y} r={7.5} fill={colors.dotStrong} />
                        <circle cx={s.x} cy={s.y} r={11} fill="none" stroke={colors.dotStrong} strokeWidth="2" />
                      </>
                    ) : (
                      <circle
                        cx={s.x}
                        cy={s.y}
                        r={wasUsed ? 5 : 4.5}
                        fill={wasUsed ? colors.dot : "none"}
                        stroke={wasUsed ? "none" : colors.idle}
                        strokeWidth="1.5"
                      />
                    )}
                  </g>
                );
              })
          }
        />
      </div>

      {/* The chosen site, and whether it is the one the rotation suggests. */}
      <p className="mt-2 flex flex-wrap items-center justify-center gap-2 text-center text-sm">
        <span className="font-medium text-gray-900 dark:text-[#E8E9F0]">
          {value ? `${siteLabel(value)}${viewLabel ? ` (${viewLabel})` : ""}` : "No site chosen"}
        </span>
        {!!suggestedKey && selected === suggestedKey && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
            Suggested
          </span>
        )}
      </p>

      {/* The same sites by name, under the figure they sit on. */}
      {SITE_VIEWS.map((view) => {
        const inView = sites.filter((s) => s.view === view.key);
        if (!inView.length) return null;
        return (
          <div key={view.key} className="mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-[#9A9DAE]">
              {view.label}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {inView.map((s) => {
                const active = s.value === selected;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => choose(s.value)}
                    aria-pressed={active}
                    className={`${SHEET_CHIP} ${active ? SHEET_CHIP_ON : SHEET_CHIP_OFF}`}
                  >
                    {active && <Check size={15} strokeWidth={3} aria-hidden="true" />}
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}