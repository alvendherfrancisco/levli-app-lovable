// Throwaway check of the Add Shot Log medication picker logic
// (src/lib/shotMedication.js). Bundled to CJS with esbuild and run from the
// app's JS sandbox: require("./tmp_picker_test.run.cjs").
import { medicationPickerGroups, regimenFromShot, saveShotWithMedication } from "@/lib/shotMedication";
import { chipsForMedication } from "@/lib/doseOptions";

const checks = [];
const ok = (name, pass) => checks.push({ name, pass: !!pass });

function fakes({ failShot = false } = {}) {
  const state = { records: [], shots: [], removed: [], linked: [], doses: [], updated: [] };
  return {
    state,
    writers: {
      addMedication: async (data) => { const rec = { id: `rec${state.records.length + 1}`, ...data }; state.records.push(rec); return rec; },
      deleteMedication: async (id) => { state.removed.push(id); state.records = state.records.filter((r) => r.id !== id); },
      addShot: async (s) => { if (failShot) throw new Error("network"); state.shots.push(s); return s; },
      updateShot: async (id, s) => { state.updated.push({ id, ...s }); },
      addMedicationCustomDose: async (id, dose) => { state.doses.push({ id, dose }); },
      linkShotsToMedication: async () => 1,
    },
  };
}

async function run() {
  // ── 1. A medication that is not in the store yet: the catalogue ─────────────
  const empty = medicationPickerGroups({ medications: [], current: "", query: "" });
  ok("catalogue is offered when nothing is saved", empty.mine.length === 0 && empty.catalogue.length > 1);

  const wegovy = empty.catalogue.find((r) => r.name === "Wegovy®");
  ok("a catalogue row carries brand, generic, unit and strengths",
    wegovy?.display === "Wegovy" && wegovy.generic === "semaglutide" && wegovy.unit === "mg" && wegovy.strengths.includes("2.4"));
  const compounded = empty.catalogue.find((r) => r.name.includes("compounded"));
  ok("a compounded row has no verified strengths but says the pharmacy sets them",
    compounded.generic === "semaglutide" && compounded.strengths === "" && compounded.anyDose === true);

  const genericSearch = medicationPickerGroups({ medications: [], query: "semaglu" });
  ok("search matches the generic name", genericSearch.catalogue.length > 1 && genericSearch.catalogue.every((r) => r.generic === "semaglutide"));
  const brandSearch = medicationPickerGroups({ medications: [], query: "mounjar" });
  ok("search matches the brand name", brandSearch.catalogue.length === 1 && brandSearch.catalogue[0].name === "Mounjaro®");
  const noMatch = medicationPickerGroups({ medications: [], query: "zzzz" });
  ok("a search with no match empties both groups", noMatch.mine.length === 0 && noMatch.catalogue.length === 0);

  const newRegimen = regimenFromShot({ name: "Wegovy®", dose: 2.4, doseUnit: "mg", route: "subcutaneous", shots: [], dateKey: "2026-10-01" });
  ok("a picked catalogue product becomes a linked record", newRegimen.catalogue_id === "wegovy" && newRegimen.generic_name === "semaglutide");
  ok("its start date is the shot's own date", newRegimen.start_date === "2026-10-01");
  ok("its dose and label frequency are carried over", newRegimen.prescribed_dose === 2.4 && newRegimen.frequency === "once weekly");
  ok("it is flagged as needing its schedule", newRegimen.needs_details === true && newRegimen.regimen_source === "shot-log");
  ok("a label strength is not stored as a custom dose", newRegimen.custom_doses === undefined);

  const compoundedRegimen = regimenFromShot({ name: "Semaglutide (generic / compounded)", dose: 1.7, route: "subcutaneous", shots: [], dateKey: "2026-10-01", customDoses: [1.7] });
  ok("a compounded strength is remembered as a chip", Array.isArray(compoundedRegimen.custom_doses) && compoundedRegimen.custom_doses[0] === 1.7);
  ok("a compounded product claims no label frequency", compoundedRegimen.frequency === "");

  // ── 2. A medication already in the store ───────────────────────────────────
  const saved = [{ id: "med1", medication_name: "Ozempic®", generic_name: "semaglutide", dose_unit: "mg", route: "subcutaneous", status: "active", custom_doses: [1.5] }];
  const groups = medicationPickerGroups({ medications: saved, current: "Ozempic®", query: "" });
  ok("a saved medication is listed under My medications", groups.mine.length === 1 && groups.mine[0].id === "med1");
  ok("and never offered twice from the catalogue", !groups.catalogue.some((r) => r.name === "Ozempic®"));

  const chips = chipsForMedication(saved[0], []);
  ok("its label strengths and its saved dose are the chips", chips.includes(0.25) && chips.includes(2) && chips.includes(1.5));
  ok("a strength the label does not list is not offered as a chip", !chips.includes(3));

  const paused = [{ id: "med2", medication_name: "Mounjaro®", status: "paused" }];
  ok("the log's own paused medication stays reachable",
    medicationPickerGroups({ medications: paused, current: "Mounjaro®" }).mine.some((r) => r.id === "med2"));
  ok("a paused medication is not offered for a different log",
    medicationPickerGroups({ medications: paused, current: "Ozempic®" }).mine.length === 0);
  ok("a product chosen but not saved is never shown as saved",
    medicationPickerGroups({ medications: [], current: "Ozempic®" }).mine.length === 0);

  // ── 3. A typed "Other / custom" entry ──────────────────────────────────────
  const custom = regimenFromShot({ name: "Compounded X", dose: 0.5, doseUnit: "mL", route: "subcutaneous", shots: [], dateKey: "2026-09-30", customDoses: [0.5] });
  ok("a typed entry gets a record with no catalogue link", custom.catalogue_id === "" && custom.generic_name === "");
  ok("it keeps the unit that was typed", custom.dose_unit === "mL");
  ok("it too is flagged for its schedule", custom.needs_details === true);

  // ── 4. A backdated shot ────────────────────────────────────────────────────
  const history = [
    { medication: "Wegovy®", date: "2026-09-20" },
    { medication: "Wegovy®", date: "2026-10-02" },
    { medication: "Ozempic®", date: "2026-01-01" },
  ];
  ok("a backdated shot becomes the start date",
    regimenFromShot({ name: "Wegovy®", dose: 2.4, dateKey: "2026-09-10", shots: history }).start_date === "2026-09-10");
  ok("an older existing shot still wins over a later one",
    regimenFromShot({ name: "Wegovy®", dose: 2.4, dateKey: "2026-10-05", shots: history }).start_date === "2026-09-20");
  ok("another medication's history is ignored",
    regimenFromShot({ name: "Mounjaro®", dose: 5, dateKey: "2026-10-05", shots: history }).start_date === "2026-10-05");

  // ── 5. A save that fails leaves nothing behind ─────────────────────────────
  const failing = fakes({ failShot: true });
  const payloadFail = { medication: "Wegovy®", dose: 2.4 };
  let threw = false;
  try {
    await saveShotWithMedication({ payload: payloadFail, regimen: newRegimen, writers: failing.writers });
  } catch { threw = true; }
  ok("a failed shot write reports the failure", threw);
  ok("no medication record is left orphaned", failing.state.records.length === 0);
  ok("the record it created is the one removed", failing.state.removed.length === 1 && failing.state.removed[0] === "rec1");
  ok("the caller's payload is left alone", payloadFail.medication_id === undefined && failing.state.linked.length === 0);

  const working = fakes();
  await saveShotWithMedication({ payload: { medication: "Wegovy®", dose: 2.4 }, regimen: newRegimen, writers: working.writers });
  ok("a successful save creates the record and links the shot to it",
    working.state.records.length === 1 && working.state.shots[0].medication_id === working.state.records[0].id);

  const existing = fakes();
  await saveShotWithMedication({
    payload: { medication: "Ozempic®", dose: 3, medication_id: "med1" },
    regimen: null,
    doseToRemember: { id: "med1", dose: 3 },
    writers: existing.writers,
  });
  ok("an existing medication is not created again", existing.state.records.length === 0);
  ok("the shot keeps its link to the existing record", existing.state.shots[0].medication_id === "med1");
  ok("a new strength is remembered on the existing record",
    existing.state.doses.length === 1 && existing.state.doses[0].id === "med1" && existing.state.doses[0].dose === 3);

  const editing = fakes();
  await saveShotWithMedication({
    payload: { medication: "Wegovy®", dose: 2.4 },
    regimen: null,
    editingShotId: "shot9",
    writers: editing.writers,
  });
  ok("editing a shot writes it in place", editing.state.updated.length === 1 && editing.state.updated[0].id === "shot9");
  ok("editing never touches a medication record", editing.state.records.length === 0 && editing.state.removed.length === 0);

  // ── Report ─────────────────────────────────────────────────────────────────
  const failed = checks.filter((c) => !c.pass);
  return {
    passed: checks.length - failed.length,
    total: checks.length,
    failed: failed.map((c) => c.name),
  };
}

export const results = run().catch((e) => ({ error: String((e && e.stack) || e) }));