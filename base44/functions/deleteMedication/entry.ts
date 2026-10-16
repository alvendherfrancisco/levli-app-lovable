import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

/**
 * Deletes a medication together with everything that belongs to it: its logged
 * doses, its reminders (repeat schedules), the side effects logged against it and
 * any old stock row pointing at it.
 *
 * The whole removal happens in one call on the server rather than as a run of
 * client-side deletes, which could stop halfway and leave a medication's doses
 * behind with nothing to explain them. Every statement is scoped to the caller's
 * own records, so nobody can delete through to another account's data.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me();
    if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const medicationId = String(body.medicationId || "").trim();
    if (!medicationId) return Response.json({ error: "medicationId required" }, { status: 400 });

    const admin = base44.asServiceRole;
    const medication = await admin.entities.Medication.get(medicationId).catch(() => null);
    if (!medication || medication.created_by_id !== me.id) {
      return Response.json({ error: "not_found", message: "That medication could not be found." }, { status: 404 });
    }

    const name = medication.medication_name || "";
    const owner = { created_by_id: me.id };
    // A row is only "this medication's" when it points at it: a log with no link
    // belongs to the regimen recorded under the same name.
    const unlinked = { $or: [{ medication_id: { $exists: false } }, { medication_id: { $in: ["", null] } }] };
    const warnings = [];

    const clear = async (entity, query, label) => {
      try {
        await admin.entities[entity].deleteMany(query);
      } catch (error) {
        warnings.push(label);
        console.error(`deleteMedication ${label}`, error.message);
      }
    };

    // Children before the medication itself. Each pass is reported rather than
    // thrown, so one entity failing cannot leave the rest half-removed.
    await clear("Shot", { ...owner, medication_id: medicationId }, "shots");
    await clear("RepeatSchedule", { ...owner, medication_id: medicationId }, "reminders");
    if (name) {
      await clear("Shot", { ...owner, medication: name, ...unlinked }, "shotsByName");
      await clear("RepeatSchedule", { ...owner, medication: name, ...unlinked }, "remindersByName");
      // A side effect carries the medication's name and nothing else.
      await clear("AdverseEvent", { ...owner, medication_name: name }, "sideEffects");
      await clear("Inventory", { ...owner, product_name: name }, "stockByName");
    }
    await clear("Inventory", { ...owner, medication_id: medicationId }, "stock");
    await clear("Medication", { ...owner, id: medicationId }, "medication");

    return Response.json({ ok: true, medication: name, warnings });
  } catch (error) {
    console.error("deleteMedication failed", error);
    return Response.json({ error: "failed", message: "The medication could not be deleted." }, { status: 500 });
  }
}