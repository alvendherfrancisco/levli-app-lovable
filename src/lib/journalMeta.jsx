// Journal categories and moods, and the sort order used by the journal list.
//
// Categories and moods are separate: the category says what the entry is about,
// the mood says how the day felt. One category = one icon, one colour, one text
// label, everywhere in the app.

import React from "react";
import { Smile, Zap, Utensils, Dumbbell, Star, FileText, AlertTriangle } from "lucide-react";
import { parseShotDate } from "@/lib/dateUtils";

/**
 * The category a side effect is saved under. A side effect is logged in its own
 * form (Home and History) rather than in the Journal, so this key is offered
 * nowhere — but it is still recognised below, because entries saved before that
 * change keep it and the Journal leaves them out of its list by it.
 */
export const SIDE_EFFECT_CATEGORY = "Side effect";

export const JOURNAL_CATEGORIES = [
  { key: "Mood", label: "Mood", icon: <Smile size={18} />, color: "#6366F1", bg: "rgba(99,102,241,0.13)" },
  { key: "Energy", label: "Energy", icon: <Zap size={18} />, color: "#14B8A6", bg: "rgba(20,184,166,0.13)" },
  { key: "Food", label: "Food", icon: <Utensils size={18} />, color: "#F97316", bg: "rgba(249,115,22,0.13)" },
  { key: "Exercise", label: "Exercise", icon: <Dumbbell size={18} />, color: "#2DD4BF", bg: "rgba(45,212,191,0.13)" },
  { key: "Milestone", label: "Milestone", icon: <Star size={18} />, color: "#FB923C", bg: "rgba(251,146,60,0.13)" },
  { key: "General", label: "General", icon: <FileText size={18} />, color: "#818CF8", bg: "rgba(129,140,248,0.13)" },
  { key: "Side effect", label: "Side effect", icon: <AlertTriangle size={18} />, color: "#E11D48", bg: "rgba(225,29,72,0.13)" },
];

/** The categories the Journal offers: what it is for — mood, energy, food,
 *  exercise, milestone and general. Side effects are not one of them. */
export const JOURNAL_CHOICES = JOURNAL_CATEGORIES.filter((c) => c.key !== SIDE_EFFECT_CATEGORY);

/** Older entries used different names for the same category. */
const LEGACY_CATEGORY_NAMES = {
  "general note": "General",
  "side effect": "Side effect",
};

/** The category an entry belongs to, mapping older names onto the current set. */
export function normaliseCategory(category) {
  const raw = String(category || "").trim();
  if (!raw) return "General";
  const mapped = LEGACY_CATEGORY_NAMES[raw.toLowerCase()];
  if (mapped) return mapped;
  return JOURNAL_CATEGORIES.find((c) => c.key.toLowerCase() === raw.toLowerCase())?.key || "General";
}

/** Category metadata, always falling back to General so an icon never vanishes. */
export function categoryMeta(category) {
  const key = normaliseCategory(category);
  return JOURNAL_CATEGORIES.find((c) => c.key === key) || JOURNAL_CATEGORIES[5];
}

export const MOOD_SCALE = [
  { label: "Feeling Excellent", short: "Excellent", emoji: "😊", value: 5 },
  { label: "Feeling Good", short: "Good", emoji: "🙂", value: 4 },
  { label: "Feeling Neutral", short: "Neutral", emoji: "😐", value: 3 },
  { label: "Feeling Low", short: "Low", emoji: "😔", value: 2 },
  { label: "Feeling Bad", short: "Bad", emoji: "😞", value: 1 },
];

/** The mood a stored label belongs to (defaults to the middle of the scale). */
export function moodFor(label) {
  return MOOD_SCALE.find((m) => m.label === label) || MOOD_SCALE[2];
}

/**
 * The emoji and the short word a stored mood is shown as on a tag: the same
 * emoji, and the same word, the mood picker offers (😊 Excellent). A mood saved
 * under an older wording keeps its own words rather than being renamed.
 */
export function moodTag(mood) {
  const raw = String(mood || "").trim();
  if (!raw) return null;
  const match = MOOD_SCALE.find((m) =>
    [m.label, m.short, m.emoji].some((value) => value.toLowerCase() === raw.toLowerCase())
  );
  return match ? { emoji: match.emoji, label: match.short } : { emoji: "", label: raw };
}

/** "3:05 PM" / "15:05" → minutes after midnight; unusable times sort last. */
function minutesOf(time) {
  const raw = String(time || "").trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return -1;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const suffix = (match[3] || "").toUpperCase();
  if (suffix === "PM" && hours !== 12) hours += 12;
  if (suffix === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

/** Sort key for an entry: its real date and time, not the order it arrived. */
export function journalSortValue(entry) {
  const date = parseShotDate(entry?.date);
  if (!date) return 0;
  const midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  return midnight + minutesOf(entry?.time) * 60000;
}

/** Newest first, by the time each entry was actually written. */
export function sortJournalNewestFirst(entries = []) {
  return [...entries].sort((a, b) => journalSortValue(b) - journalSortValue(a));
}