// Inbound loading overlay (docs/ios-bridge/loading-overlay.md): a module-level
// DOM node, ref-counted, 20 s safety auto-hide, installed before React mounts.
const SAFETY_MS = 20000;
let count = 0;
let node = null;
let timer = null;

const ensureNode = () => {
  if (node) return node;
  node = document.createElement("div");
  node.setAttribute("aria-hidden", "true");
  node.style.cssText = "position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;background:rgba(79,70,229,0.18);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);";
  node.innerHTML = '<div style="width:36px;height:36px;border-radius:50%;border:4px solid rgba(255,255,255,0.6);border-top-color:#4f46e5;animation:iosOverlaySpin 0.8s linear infinite"></div><style>@keyframes iosOverlaySpin{to{transform:rotate(360deg)}}</style>';
  document.body.appendChild(node);
  return node;
};

const render = () => {
  try { ensureNode().style.display = count > 0 ? "flex" : "none"; } catch { /* ignore */ }
};

const reset = () => { count = 0; clearTimeout(timer); timer = null; render(); };

if (typeof window !== "undefined") {
  window.showLoadingOverlay = () => {
    count += 1;
    clearTimeout(timer);
    timer = setTimeout(reset, SAFETY_MS);
    render();
  };
  window.hideLoadingOverlay = () => {
    count = Math.max(0, count - 1);
    if (count === 0) { clearTimeout(timer); timer = null; }
    render();
  };
}