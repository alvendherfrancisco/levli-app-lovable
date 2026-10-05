import { toast } from "@/lib/toast";

/** Thin helper for screens that prefer one call for either kind of message. */
export function useToast() {
  const showToast = ({ type = "success", message = "" }) => {
    const msg = message || (type === "error" ? "Couldn't save. Please try again." : "Action completed");
    if (type === "error") toast.error(msg);
    else toast.success(msg);
  };

  return { showToast };
}