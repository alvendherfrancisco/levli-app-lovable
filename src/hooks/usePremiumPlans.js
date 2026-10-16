import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { buildPlans } from "@/lib/premiumPlans";

/**
 * The plans the paywall offers, read from the product's own prices the moment the
 * screen opens — so nothing on the paywall carries a price of its own, and the
 * amounts shown are the ones the store will charge, in the currency they are sold
 * in. `enabled` keeps the call off the app's first screen: it runs only while the
 * paywall is up.
 */
export default function usePremiumPlans(enabled) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("get-premium-prices", {});
      const next = buildPlans(res?.data);
      if (next.length === 0) throw new Error("no prices");
      setPlans(next);
    } catch {
      setPlans([]);
      setError("We couldn't load the current prices.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) load();
  }, [enabled, load]);

  return { plans, loading, error, reload: load };
}