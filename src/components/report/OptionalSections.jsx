import React from "react";
import SafeImage from "@/components/SafeImage";
import PaperPairs from "@/components/report/PaperPairs";
import SectionBoundary from "@/components/report/SectionBoundary";
import { useReportTokens } from "@/components/report/ReportTheme";

/** One optional section. If its content fails, only this section shows a message. */
function Block({ title, children, t }) {
  return (
    <section className="pt-4 mt-4 border-t" style={{ borderColor: t.divider }}>
      <h3 className="text-base font-bold mb-1" style={{ color: t.ink }}>{title}</h3>
      <div className="h-0.5 w-10 rounded mb-3" style={{ background: t.accent }} />
      <SectionBoundary title={title}>{children}</SectionBoundary>
    </section>
  );
}

function SmallTable({ head, rows, render, t }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: t.tableHeadBg, color: t.muted }}>
            {head.map((h) => <th key={h} className="text-left p-2 font-medium">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t" style={{ borderColor: t.divider, color: t.ink }}>{render(row)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Optional sections — each one only renders when the range holds data for it. */
export default function OptionalSections({ report }) {
  const t = useReportTokens();
  const { sections, optional } = report;
  const has = (id) => sections.includes(id);
  const blocks = [];

  if (has("injectionSites") && optional.injectionSites) {
    const data = optional.injectionSites;
    blocks.push(
      <Block key="sites" title="Injection sites and pain" t={t}>
        <SmallTable
          t={t}
          head={["Site", "Doses", "% of doses"]}
          rows={data.counts}
          render={(row) => (
            <>
              <td className="p-2">{row.site}</td>
              <td className="p-2">{row.count}</td>
              <td className="p-2">{row.pct}%</td>
            </>
          )}
        />
        <p className="text-sm mt-2" style={{ color: t.muted }}>
          {data.sitesUsed} site{data.sitesUsed === 1 ? "" : "s"} used across {data.totalDosesWithSite} doses.
        </p>
        <p className="text-sm mt-1" style={{ color: t.muted }}>
          {data.painReported
            ? `Pain was recorded on ${data.painReported} dose${data.painReported === 1 ? "" : "s"}, average ${data.averagePain}/10.`
            : "No pain was recorded with any dose in this range."}
        </p>
      </Block>,
    );
  }

  if (has("nutrition") && optional.nutrition) {
    const data = optional.nutrition;
    blocks.push(
      <Block key="nutrition" title="Nutrition" t={t}>
        <PaperPairs pairs={[
          ["Days logged", String(data.days)],
          ["Calories (average)", data.calories != null ? `${data.calories} kcal` : "—"],
          ["Protein (average)", data.protein != null ? `${data.protein} g` : "—"],
          ["Fiber (average)", data.fiber != null ? `${data.fiber} g` : "—"],
          ["Carbs (average)", data.carbs != null ? `${data.carbs} g` : "—"],
        ]} />
        {data.weekly.length > 0 && (
          <div className="mt-3">
            <SmallTable
              t={t}
              head={["Week", "Days logged", "Average calories"]}
              rows={data.weekly}
              render={(row) => (
                <>
                  <td className="p-2">{row.label}</td>
                  <td className="p-2">{row.days}</td>
                  <td className="p-2">{row.value} kcal</td>
                </>
              )}
            />
          </div>
        )}
      </Block>,
    );
  }

  if (has("water") && optional.water) {
    const data = optional.water;
    blocks.push(
      <Block key="water" title="Water" t={t}>
        <p className="text-sm" style={{ color: t.muted }}>
          Logged on {data.days} day{data.days === 1 ? "" : "s"} · average {data.average} {data.unit}/day · total {data.total} {data.unit}.
        </p>
        {data.weekly.length > 0 && (
          <div className="mt-3">
            <SmallTable
              t={t}
              head={["Week", "Days logged", "Average"]}
              rows={data.weekly}
              render={(row) => (
                <>
                  <td className="p-2">{row.label}</td>
                  <td className="p-2">{row.days}</td>
                  <td className="p-2">{row.value} {data.unit}</td>
                </>
              )}
            />
          </div>
        )}
      </Block>,
    );
  }

  if (has("exercise") && optional.exercise) {
    const data = optional.exercise;
    blocks.push(
      <Block key="exercise" title="Exercise" t={t}>
        <p className="text-sm" style={{ color: t.muted }}>
          Logged on {data.days} day{data.days === 1 ? "" : "s"} · average {data.average} min/day · total {data.total} min.
        </p>
        {data.weekly.length > 0 && (
          <div className="mt-3">
            <SmallTable
              t={t}
              head={["Week", "Days logged", "Average"]}
              rows={data.weekly}
              render={(row) => (
                <>
                  <td className="p-2">{row.label}</td>
                  <td className="p-2">{row.days}</td>
                  <td className="p-2">{row.value} min</td>
                </>
              )}
            />
          </div>
        )}
      </Block>,
    );
  }

  if (has("journal") && optional.journal) {
    blocks.push(
      <Block key="journal" title="Journal entries" t={t}>
        <div className="space-y-3">
          {optional.journal.map((entry) => (
            <div key={entry.id}>
              <p className="text-sm font-semibold" style={{ color: t.ink }}>
                {[entry.dayLabel, entry.time, entry.mood, entry.category].filter(Boolean).join(" · ")}
              </p>
              <p className="text-sm mt-0.5 break-words" style={{ color: t.ink }}>{entry.text}</p>
            </div>
          ))}
        </div>
        <p className="text-sm mt-2" style={{ color: t.muted }}>Entries are shown exactly as written.</p>
      </Block>,
    );
  }

  if (has("progressPictures") && optional.progressPictures) {
    blocks.push(
      <Block key="pictures" title="Progress pictures" t={t}>
        <p className="text-sm mb-2" style={{ color: t.muted }}>Personal photos, included because this section was selected.</p>
        <div className="grid grid-cols-3 gap-3">
          {optional.progressPictures.map((photo) => (
            <div key={photo.id} className="min-w-0">
              <div className="aspect-square rounded-lg overflow-hidden border" style={{ borderColor: t.cardBorder, background: t.tableZebraBg }}>
                <SafeImage src={photo.url} alt={`Progress ${photo.dayKey}`} className="w-full h-full object-cover" />
              </div>
              <p className="text-sm mt-1" style={{ color: t.muted }}>{photo.dayLabel}</p>
            </div>
          ))}
        </div>
      </Block>,
    );
  }

  if (!blocks.length) return null;
  return <div>{blocks}</div>;
}