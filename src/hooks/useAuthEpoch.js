import { useEffect, useState } from "react";
import { getAuthEpoch } from "@/lib/appLifecycle";

// The session's epoch: add it to the deps of any effect that reads user data,
// so the data refetches whenever the session is re-confirmed or replaced.
export default function useAuthEpoch() {
  const [epoch, setEpoch] = useState(getAuthEpoch);
  useEffect(() => {
    const h = (e) => setEpoch(e.detail.epoch);
    window.addEventListener("auth:epoch", h);
    return () => window.removeEventListener("auth:epoch", h);
  }, []);
  return epoch;
}