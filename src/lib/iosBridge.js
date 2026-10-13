// Web → iOS transport (guide §4). Targets the canonical `wanillajs` handler,
// with `gameEvents` / `dataEvents` as legacy aliases. Never throws.
const getHandler = () => {
  const h = typeof window !== "undefined" ? window.webkit?.messageHandlers : null;
  return h?.wanillajs ?? h?.gameEvents ?? h?.dataEvents ?? null;
};

export const isRunningInIOSWrapper = () => !!getHandler();

export const sendIOSEvent = (type, payload) => {
  const handler = getHandler();
  if (handler) {
    handler.postMessage({ type, payload: payload ?? {} });
  } else {
    console.warn("[iOS bridge] not in wrapper, skipping", type);
  }
};

// Pre-mount shim (guide §3.5): iOS may call navigateFromIOS before
// IOSNavigationBridge mounts. Until then the path is queued and drained on mount.
if (typeof window !== "undefined" && !window.navigateFromIOS) {
  window.navigateFromIOS = (path) => { window.__pendingIOSPath = path; };
}