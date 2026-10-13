import { useEffect, useState } from "react";
import { isRunningInIOSWrapper } from "@/lib/iosBridge";

// null while detecting, then true for the wrapper or the ?preview=1 bypass.
export default function useIsIOSWrapper() {
  const [isWrapper, setIsWrapper] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("preview") === "1") {
      try { localStorage.setItem("previewBypass", "1"); } catch { /* ignore */ }
    }
    let bypass = false;
    try { bypass = localStorage.getItem("previewBypass") === "1"; } catch { /* ignore */ }
    setIsWrapper(isRunningInIOSWrapper() || bypass);
  }, []);

  return isWrapper;
}