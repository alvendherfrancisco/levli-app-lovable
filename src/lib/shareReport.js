// Saves a generated report to the device as a file. Nothing is uploaded, no
// link is created, and no share sheet is opened — this only runs from a user
// tap, and what happens to the file afterwards is the person's own doing.

export function downloadPdf(doc, filename) {
  doc.save(filename);
}

export function reportFileName() {
  return `levli-report-${new Date().toISOString().slice(0, 10)}.pdf`;
}