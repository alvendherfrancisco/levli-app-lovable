import html2canvas from "html2canvas";

/**
 * Saves a file the app already serves (a PNG under /public) under the name the
 * store wants for it. The download attribute keeps it on the page — nothing
 * opens, the file simply lands in the browser's downloads.
 */
export function downloadFile(url, filename) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * Draws a node on screen into a PNG and saves it.
 *
 * The node is composed at its own size (see the screenshot cards, built at
 * 430 × 932); `scale` multiplies that to the size the store asks for, so the
 * default of 3 gives Apple's 1290 × 2796 exactly. The PNG is drawn on an opaque
 * white ground, because App Store screenshots may not carry transparency.
 */
export async function downloadNodeAsPng(node, { scale = 3, filename }) {
  const canvas = await html2canvas(node, {
    scale,
    backgroundColor: "#FFFFFF",
    logging: false,
  });
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Could not draw this asset");
  const url = URL.createObjectURL(blob);
  downloadFile(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/** Copies text to the clipboard; true when it landed there. */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}