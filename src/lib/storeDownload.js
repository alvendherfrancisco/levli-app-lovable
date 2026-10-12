import { downloadTextFile } from "@/lib/dataExport";
import {
  APP_STORE_ICON, ICON_FILES, SCREENSHOT_SIZES, SCREENSHOT_RULES,
  SHOT_PLAN, CAPTURE_STEPS, LISTING_GROUPS, CONNECT_FORMS,
  RELEASE_CHECKLIST, PAGE_LIMITS,
} from "@/lib/storeAssets";

/**
 * Puts the whole release pack in one Markdown file: the icon files, the
 * screenshot plan, every listing field with its character count, the Connect
 * form answers and the checklist. It is built from the same lists the page
 * draws, so the two can never drift apart.
 */
export function buildReleasePack({ appVersion }) {
  const out = [];

  out.push(`# Levli — Apple App Store release pack`, "");
  out.push(`App version ${appVersion} · generated ${new Date().toISOString().slice(0, 10)}`, "");

  out.push("## App icon", "");
  out.push(`${APP_STORE_ICON.filename} — ${APP_STORE_ICON.size}`);
  out.push(APP_STORE_ICON.verified, "");
  out.push("Every brand export:", "");
  ICON_FILES.forEach((f) => out.push(`- ${f.label} (${f.size}) — ${f.path} — ${f.note}`));
  out.push("");

  out.push("## Screenshots", "");
  out.push("Sizes:", "");
  SCREENSHOT_SIZES.forEach((s) => out.push(`- ${s.label}: ${s.size} — ${s.status}`));
  out.push("", "Rules:", "");
  SCREENSHOT_RULES.forEach((r) => out.push(`- ${r}`));
  out.push("", "The shots, in upload order:", "");
  SHOT_PLAN.forEach((s, i) => {
    out.push(`${i + 1}. ${s.screen} — ${s.what}`);
    out.push(`   Suggested caption: ${s.caption}`);
  });
  out.push("", "How to capture them:", "");
  CAPTURE_STEPS.forEach((s, i) => out.push(`${i + 1}. ${s}`));
  out.push("");

  out.push("## Listing text and links", "");
  LISTING_GROUPS.forEach((group) => {
    out.push(`### ${group.title}`, "");
    group.fields.forEach((f) => {
      const count = Array.from(f.value).length;
      const limit = f.limit ? ` (${count}/${f.limit} characters)` : "";
      out.push(`**${f.label}**${limit}`);
      out.push("", "```", f.value, "```", "");
    });
  });

  out.push("## App Store Connect forms", "");
  CONNECT_FORMS.forEach((form) => {
    out.push(`### ${form.title}`, "");
    if (form.intro) out.push(form.intro, "");
    form.rows.forEach((row) => {
      out.push(`- ${row.label}: ${row.value}${row.open ? " [TO COMPLETE]" : ""}`);
      if (row.note) out.push(`  ${row.note}`);
    });
    out.push("");
  });

  out.push("## Release checklist", "");
  RELEASE_CHECKLIST.forEach((item) => {
    out.push(`- [ ] ${item.label} — ${item.hint}${item.open ? " (only the team can finish this)" : ""}`);
  });
  out.push("");

  out.push("## Not in this pack", "");
  PAGE_LIMITS.forEach((line) => out.push(`- ${line}`));
  out.push("");

  return out.join("\n");
}

/** Downloads the whole pack as one Markdown file. */
export function downloadReleasePack({ appVersion }) {
  const stamp = new Date().toISOString().slice(0, 10);
  downloadTextFile(
    `levli-appstore-pack-${stamp}.md`,
    buildReleasePack({ appVersion }),
    "text/markdown;charset=utf-8",
  );
}

/**
 * Copies a value to the clipboard. The preview can run inside a frame where the
 * clipboard is refused, so the browser's own copy command is the fallback.
 * Returns whether the text was copied.
 */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.top = "-1000px";
      document.body.appendChild(area);
      area.select();
      const copied = document.execCommand("copy");
      document.body.removeChild(area);
      return copied;
    } catch {
      return false;
    }
  }
}