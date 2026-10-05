// Shares a generated report through the device share sheet when available,
// and falls back to saving the file. Nothing is uploaded, no link is created,
// and nothing is shared automatically — this only runs from a user tap.

export async function shareOrDownloadPdf(doc, filename) {
  const blob = doc.output("blob");
  const file = new File([blob], filename, { type: "application/pdf" });

  if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Levli health report" });
      return "shared";
    } catch (err) {
      // The user dismissing the share sheet is not a failure.
      if (err && err.name === "AbortError") return "cancelled";
    }
  }

  doc.save(filename);
  return "downloaded";
}

export function reportFileName() {
  return `levli-report-${new Date().toISOString().slice(0, 10)}.pdf`;
}