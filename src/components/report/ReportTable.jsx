import React from "react";
import { useReportTokens } from "@/components/report/ReportTheme";

/**
 * One table of the report, in the two layouts a report is actually read in.
 *
 * A phone gets a block per row: the lead columns open the row, the emphasised
 * column sits opposite them, and every other column follows as its label and
 * its value. Five columns of logged facts cannot fit a phone screen without
 * sideways scrolling, and a sideways scroll loses the row it belongs to. From
 * 640px up the same rows are drawn as a table.
 *
 * Both layouts read the same columns, so the two can never disagree about what
 * the report says. A value that was never recorded is left blank, as it is in
 * the table, and left out of the phone row's detail line rather than printed as
 * a label with nothing after it.
 *
 * `lead` marks the columns that open a phone row, `strong` the one value the
 * eye should land on first. Both are ignored by the table, which shows every
 * column in the order given.
 */
export default function ReportTable({ columns, rows, rowKey }) {
  const t = useReportTokens();
  const keyOf = (row, index) => (rowKey ? rowKey(row, index) : (row?.id ?? index));
  const valueOf = (column, row) => {
    const raw = column.text(row);
    return raw == null || raw === "" ? "" : String(raw);
  };

  return (
    <>
      {/* Phone: one block per row. */}
      <div className="space-y-2 sm:hidden">
        {rows.map((row, index) => {
          const lead = columns.filter((column) => column.lead).map((column) => valueOf(column, row)).filter(Boolean);
          const strong = columns.find((column) => column.strong);
          const strongValue = strong ? valueOf(strong, row) : "";
          const detail = columns
            .filter((column) => !column.lead && column !== strong)
            .map((column) => ({ label: column.label, value: valueOf(column, row) }))
            .filter((item) => item.value);

          return (
            <div
              key={keyOf(row, index)}
              className="rounded-xl border p-3"
              style={{ borderColor: t.divider, background: t.tableZebraBg }}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 text-sm break-words" style={{ color: t.muted }}>{lead.join(" · ")}</span>
                {strongValue && (
                  <span className="flex-shrink-0 text-sm font-semibold" style={{ color: t.ink }}>{strongValue}</span>
                )}
              </div>
              {detail.length > 0 && (
                <p className="text-xs mt-1.5 leading-snug break-words" style={{ color: t.muted }}>
                  {detail.map((item) => `${item.label}: ${item.value}`).join(" · ")}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* From 640px up: the table. */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: t.tableHeadBg, color: t.ink }}>
              {columns.map((column) => (
                <th key={column.label} className="text-left p-2 font-semibold">{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={keyOf(row, index)} className="border-t" style={{ borderColor: t.divider, color: t.ink }}>
                {columns.map((column) => (
                  <td key={column.label} className={`p-2 align-top break-words ${column.strong ? "font-semibold" : ""}`}>
                    {valueOf(column, row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}