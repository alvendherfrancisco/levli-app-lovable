import React from "react";
import SafeImage from "@/components/SafeImage";
import PaperPairs from "@/components/report/PaperPairs";

function Block({ title, children }) {
  return (
    <section className="pt-4 mt-4 border-t border-gray-200">
      <h3 className="text-sm font-bold text-gray-900 mb-1">{title}</h3>
      <div className="h-0.5 w-10 bg-indigo-600 rounded mb-3" />
      {children}
    </section>
  );
}

function SmallTable({ head, rows, render }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-50 text-gray-500">
            {head.map((h) => <th key={h} className="text-left p-2 font-medium">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-gray-100 text-gray-700">{render(row)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Optional sections — each one only renders when the range holds data for it. */
export default function OptionalSections({ report }) {
  const { sections, optional } = report;
  const has = (id) => sections.includes(id);
  const blocks = [];

  if (has("injectionSites") && optional.injectionSites) {
    const data = optional.injectionSites;
    blocks.push(
      <Block key="sites" title="Injection sites and pain">
        <SmallTable
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
        <p className="text-xs text-gray-500 mt-2">
          {data.sitesUsed} site{data.sitesUsed === 1 ? "" : "s"} used across {data.totalDosesWithSite} doses.
        </p>
        <p className="text-xs text-gray-500 mt-1">
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
      <Block key="nutrition" title="Nutrition">
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
      <Block key="water" title="Water">
        <p className="text-xs text-gray-600">
          Logged on {data.days} day{data.days === 1 ? "" : "s"} · average {data.average} {data.unit}/day · total {data.total} {data.unit}.
        </p>
        {data.weekly.length > 0 && (
          <div className="mt-3">
            <SmallTable
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
      <Block key="exercise" title="Exercise">
        <p className="text-xs text-gray-600">
          Logged on {data.days} day{data.days === 1 ? "" : "s"} · average {data.average} min/day · total {data.total} min.
        </p>
        {data.weekly.length > 0 && (
          <div className="mt-3">
            <SmallTable
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
      <Block key="journal" title="Journal entries">
        <div className="space-y-3">
          {optional.journal.map((entry) => (
            <div key={entry.id}>
              <p className="text-xs font-semibold text-gray-900">
                {[entry.dayLabel, entry.time, entry.mood, entry.category].filter(Boolean).join(" · ")}
              </p>
              <p className="text-xs text-gray-700 mt-0.5">{entry.text}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-500 mt-2">Entries are shown exactly as written.</p>
      </Block>,
    );
  }

  if (has("progressPictures") && optional.progressPictures) {
    blocks.push(
      <Block key="pictures" title="Progress pictures">
        <p className="text-[11px] text-gray-500 mb-2">Personal photos, included because this section was selected.</p>
        <div className="grid grid-cols-3 gap-3">
          {optional.progressPictures.map((photo) => (
            <div key={photo.id}>
              <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <SafeImage src={photo.url} alt={`Progress ${photo.dayKey}`} className="w-full h-full object-cover" />
              </div>
              <p className="text-[11px] text-gray-500 mt-1">{photo.dayLabel}</p>
            </div>
          ))}
        </div>
      </Block>,
    );
  }

  if (!blocks.length) return null;
  return <div>{blocks}</div>;
}