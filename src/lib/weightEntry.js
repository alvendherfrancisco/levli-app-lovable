import { checkWeight } from "@/lib/measure";
import { toast } from "@/lib/toast";

/**
 * The Weight entry sheet, as props for AddMetricModal — one definition for every
 * place a weight is logged: the Weight tracker tile on Home, the History trackers
 * and the Weight Progress card. The unit is shown beside the input, a value
 * outside the plausible adult range is not saved, and the weight last put on
 * record is ever only the placeholder, never a value that could be saved.
 */
export function weightEntry({ dayKey, weight, unit, lastLogged = null, saveWeight }) {
  return {
    label: "Weight",
    unit,
    current: weight != null ? String(weight) : "",
    placeholder: weight == null && lastLogged != null ? String(Math.round(lastLogged * 10) / 10) : "",
    validate: (v) => {
      const check = checkWeight(v, unit);
      return check.ok ? "" : check.message;
    },
    onSave: async (v) => {
      await saveWeight(dayKey, v);
      weight != null ? toast.success("Weight updated") : toast.success("Weight added");
    },
    // An entry already on record can be removed from the sheet itself, and only
    // then is the sheet offered the way to do it.
    onDelete: weight != null
      ? async () => {
          await saveWeight(dayKey, null);
          toast.deleted("Weight entry deleted");
        }
      : undefined,
  };
}