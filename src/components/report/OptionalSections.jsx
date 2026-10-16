import React from "react";
import SafeImage from "@/components/SafeImage";
import PaperPairs from "@/components/report/PaperPairs";
import ReportTable from "@/components/report/ReportTable";
import SectionBoundary from "@/components/report/SectionBoundary";
import { useReportTokens } from "@/components/report/ReportTheme";

/** One optional section. If its content fails, only this section shows a message. */
function Block({ title, children, t }) {
  return (
    <section className="pt-4 mt-4 border-t" style={{ borderColor: t.divider }}>
      <h3 className="text-base font-bold mb-3" style={{ color: t.ink }}>{title}</h3>
      <SectionBoundary title={title}>{children}</SectionBoundary>
    </section>
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
        <ReportTable
          rows={data.counts}
          rowKey={(row, index) => `${row.site}-${index}`}
          columns={[
            { label: "Site", text: (row) => row.site, lead: true },
            { label: "Doses", text: (row) => String(row.count), strong: true },
            { label: "% of doses", text: (row) => `${row.pct}%` },
          ]}
        />
        <p className="text-sm mt-2" style={{ color: t.muted }}>
          {data.sitesUsed} site{data.sitesUsed === 1 ? "" : "s"} used across {data.totalDosesWithSite} doses.
        </p>
        <p className="text-sm mt-1" style={{ color: t.muted }}>
          {data.painReported
            ? `Pain was recorded on ${data.painReported} dose${data.painReported === 1 ? "" : "s"}, average ${data.averagePain}/10.`
            : "No pain was recorded with any dose in this period."}
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
          ...(data.calories != null ? [["Calories (average)", `${data.calories} kcal`]] : []),
          ...(data.protein != null ? [["Protein (average)", `${data.protein} g`]] : []),
          ...(data.fiber != null ? [["Fiber (average)", `${data.fiber} g`]] : []),
          ...(data.carbs != null ? [["Carbs (average)", `${data.carbs} g`]] : []),
        ]} />
        {data.weekly.length > 0 && (
          <div className="mt-3">
            <ReportTable
              rows={data.weekly}
              rowKey={(row, index) => `${row.label}-${index}`}
              columns={[
                { label: "Week", text: (row) => row.label, lead: true },
                { label: "Days logged", text: (row) => String(row.days) },
                { label: "Average calories", text: (row) => `${row.value} kcal`, strong: true },
              ]}
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
            <ReportTable
              rows={data.weekly}
              rowKey={(row, index) => `${row.label}-${index}`}
              columns={[
                { label: "Week", text: (row) => row.label, lead: true },
                { label: "Days logged", text: (row) => String(row.days) },
                { label: "Average", text: (row) => `${row.value} ${data.unit}`, strong: true },
              ]}
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
            <ReportTable
              rows={data.weekly}
              rowKey={(row, index) => `${row.label}-${index}`}
              columns={[
                { label: "Week", text: (row) => row.label, lead: true },
                { label: "Days logged", text: (row) => String(row.days) },
                { label: "Average", text: (row) => `${row.value} min`, strong: true },
              ]}
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