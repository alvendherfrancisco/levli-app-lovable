// Temporary verification script for the report fixtures (deleted after use).
import { REPORT_FIXTURES } from "@/lib/reportFixtures";
import { buildReport } from "@/lib/reportData";

export function runChecks() {
const lines = [];
const log = (...args) => lines.push(args.join(" "));
const problems = [];
const check = (label, condition, detail = "") => {
  if (!condition) problems.push(`${label} ${detail}`);
  log(`${condition ? "ok  " : "FAIL"} ${label} ${detail}`);
};

log("=== fixtures:", REPORT_FIXTURES.length, "===");
for (const fixture of REPORT_FIXTURES) {
  const r = buildReport(fixture.state, fixture.options);
  log("\n" + "─".repeat(72));
  log(`${fixture.id} :: ${r.hasAnyData ? "has data" : "NO DATA"}`);
  log(`header: name=${JSON.stringify(r.header.name)} height=${r.header.heightLabel}`);
  log(`        period=${r.header.periodLabel}`);
  log(`        medications=${r.header.medications.join(", ") || "(none)"}`);
  log("tiles:");
  r.summaryTiles.forEach((t) => log(`   ${t.label} = ${t.value}${t.sub ? `  [${t.sub}]` : ""}`));
  log(`weight: ${r.has.weight ? `${r.weight.count} entries (start ${r.weight.start}, end ${r.weight.end}, change ${r.weight.change}, pct ${r.weight.changePct}, goal ${r.weight.goalLabel})` : "none"}`);
  if (r.weight.table.length) {
    log(`   table (${r.weight.table.length} rows): ${r.weight.table.slice(0, 3).map((x) => `${x.dayLabel} ${x.valueLabel} ${x.changeLabel || "—"}`).join(" | ")}`);
  }
  log(`doses: ${r.doses.count} | ${r.doses.changes.join(" · ")}`);
  log(`   adherence: ${JSON.stringify(r.doses.adherence)}`);
  log(`   duplicateNote: ${JSON.stringify(r.doses.duplicateNote)}`);
  log(`   footnotes: ${JSON.stringify(r.doses.footnotes)}`);
  log(`side effects: ${r.sideEffects.total} ${r.sideEffects.rows.slice(0, 2).map((x) => `(${x.dayLabel} ${x.symptom} ${x.severity})`).join(" ")}`);
  log(`sections: ${r.sections.join(", ")}`);
  const opt = Object.entries(r.available).filter(([, v]) => v).map(([k]) => k);
  log(`optional available: ${opt.join(", ") || "(none)"}`);

  if (fixture.id === "minimal") {
    check("minimal: no weight section", !r.has.weight);
    check("minimal: one dose", r.doses.count === 1, String(r.doses.count));
    check("minimal: no BMI tile", !r.summaryTiles.some((t) => t.id === "bmi"));
    check("minimal: no side effects", r.sideEffects.total === 0);
    check("minimal: no optional sections", r.sections.length === 3, r.sections.join(","));
  }
  if (fixture.id === "duplicates") {
    check("duplicates: note says 1 entry", r.doses.duplicateNote === "1 entry shares the same timestamp and may be a duplicate.", JSON.stringify(r.doses.duplicateNote));
    check("duplicates: no weight", !r.has.weight);
    check("duplicates: three rows kept", r.doses.count === 3, String(r.doses.count));
    check("duplicates: site column data present", r.doses.rows.every((x) => x.site && x.site !== "—"));
  }
  if (fixture.id === "full") {
    check("full: 13 doses", r.doses.count === 13, String(r.doses.count));
    check("full: two dose steps", r.doses.changes.length === 2, r.doses.changes.join(" · "));
    check("full: weight in kg (profile lb)", r.weight.start > 95 && r.weight.start < 112, String(r.weight.start));
    check("full: BMI tile shown", r.summaryTiles.some((t) => t.id === "bmi"), JSON.stringify(r.summaryTiles.find((t) => t.id === "bmi")));
    check("full: goal tile with distance", r.summaryTiles.some((t) => t.id === "goal" && /to go|Goal reached/.test(t.sub)));
    check("full: 12 weight table rows", r.weight.table.length === 12, String(r.weight.table.length));
    check("full: oldest row has no change", r.weight.table[r.weight.table.length - 1].changeLabel === "");
    check("full: 5 side effects", r.sideEffects.total === 5);
    check("full: all optional sections selected", r.sections.length === 9, r.sections.join(","));
    check("full: adherence counts the logged doses", r.doses.adherence.logged === 13, JSON.stringify(r.doses.adherence));
    check("full: core sections always present", ["weight", "doses", "sideEffects"].every((id) => r.sections.includes(id)), r.sections.join(","));
    check("full: route footnote lists doses", r.doses.footnotes.length === 1 && /doses/.test(r.doses.footnotes[0]), JSON.stringify(r.doses.footnotes));
    check("full: current-dose tile names the step", /weeks|days/.test(r.summaryTiles[0].sub), r.summaryTiles[0].sub);
  }
  if (fixture.id === "edge") {
    check("edge: BMI omitted", !r.summaryTiles.some((t) => t.id === "bmi"));
    check("edge: no goal tile", !r.summaryTiles.some((t) => t.id === "goal"));
    check("edge: one weight entry", r.weight.count === 1);
    check("edge: no name line", r.header.name === "");
    check("edge: single change cell empty", r.weight.table[0].changeLabel === "");
  }
}

log("\n" + "═".repeat(72));
if (problems.length) {
  log(`PROBLEMS (${problems.length}):`);
  problems.forEach((p) => log(" -", p));
} else {
  log("ALL CHECKS PASSED");
}
return { problems, report: lines.join("\n") };
}