// ─────────────────────────────────────────────────────────────────────────────
// Everything the brand and store assets page shows, in one place: the app's real
// icon files, the palette and type scale the app is actually built from, the
// eight App Store screenshots, the listing copy and the submission checklist.
//
// Keeping the copy and the file paths here (rather than inside the page) means
// the page is only layout, and the team can add a screenshot or fix a line
// without touching it.
// ─────────────────────────────────────────────────────────────────────────────

/** The app itself, as it goes to the store. */
export const BRAND = {
  name: "Levli",
  wordmark: "Levli",
  storeName: "Levli — Personal Logbook",
  tagline: "A personal logbook for GLP-1 treatment.",
  siteUrl: "https://levli-app.base44.app",
  icon: "/assets/brand/exports/levli-appstore-1024.png",
};

/** How the name is written, and how it is not. */
export const NAME_RULES = {
  do: {
    title: "Do",
    line: "Levli",
    note: "One word, capital L, lower-case rest. Always set in the app's own type.",
  },
  dont: {
    title: "Don't",
    line: "LEVLI · levli · LevliApp · Levli Logbook",
    note: "The wordmark is never all-caps, never letter-spaced, and never paired with another name.",
  },
};

/**
 * The icon files that ship with the app. The App Store icon is the one Apple
 * needs: 1024 × 1024, drawn flat with no transparency and no rounded corners
 * (iOS applies the mask itself).
 */
export const ICON_FILES = [
  {
    label: "App Store icon",
    path: "/assets/brand/exports/levli-appstore-1024.png",
    filename: "levli-appstore-icon-1024.png",
    size: "1024 × 1024",
    note: "Apple's required size. Flat, opaque, no rounded corners.",
    primary: true,
  },
  {
    label: "App icon",
    path: "/assets/brand/levli-icon-1024.png",
    filename: "levli-icon-1024.png",
    size: "1024 × 1024",
    note: "The same mark as the home-screen icon.",
  },
  {
    label: "Touch icon",
    path: "/assets/brand/apple-touch-icon-180.png",
    filename: "levli-touch-icon-180.png",
    size: "180 × 180",
    note: "The icon the app installs for web and home screen.",
  },
  {
    label: "Droplet mark",
    path: "/assets/brand/levli-drop-mark-512.png",
    filename: "levli-drop-mark-512.png",
    size: "512 × 512",
    note: "The mascot alone on transparency, for slides and print.",
  },
  {
    label: "Maskable icon",
    path: "/assets/brand/levli-maskable-512.png",
    filename: "levli-maskable-icon-512.png",
    size: "512 × 512",
    note: "Padded for a masked home screen.",
  },
];

/**
 * The palette. Core colours are the app's own theme tokens; Support colours are
 * the accents the app already draws with. Medication dose colours are set by the
 * manufacturers and documented separately — they are never adjusted to fit this
 * palette.
 */
export const COLOURS = [
  { group: "Core", name: "Indigo", hex: "#4F46E5", role: "Primary actions, links, active states" },
  { group: "Core", name: "Lavender", hex: "#EEF2FF", role: "Tinted surfaces, chosen chips" },
  { group: "Core", name: "Ink", hex: "#111827", role: "Primary text" },
  { group: "Core", name: "Slate", hex: "#6B7280", role: "Secondary text" },
  { group: "Core", name: "Surface", hex: "#F9FAFB", role: "Page wash, panels" },
  { group: "Core", name: "Hairline", hex: "#E8EAF0", role: "The one card and field border" },
  { group: "Support", name: "Deep indigo", hex: "#3B35B8", role: "Gradient base of the mark" },
  { group: "Support", name: "Periwinkle", hex: "#8B8CF8", role: "Gradient light of the mark" },
  { group: "Support", name: "Mint", hex: "#D9F3EA", role: "Launch and illustration wash" },
  { group: "Support", name: "Peach", hex: "#FFE7D3", role: "Launch and illustration wash" },
  { group: "Support", name: "Amber", hex: "#F59E0B", role: "Notices and warnings" },
  { group: "Support", name: "Teal", hex: "#14B8A6", role: "Confirmation and success" },
  { group: "Support", name: "Red", hex: "#DC2626", role: "Destructive actions and errors" },
  { group: "Night", name: "Night", hex: "#15171E", role: "Dark surface the app opens on" },
  { group: "Night", name: "Dark card", hex: "#1A1D2A", role: "Cards on the dark surface" },
  { group: "Night", name: "Dark line", hex: "#FFFFFF17", role: "Border on the dark surface (9% white)" },
];

/**
 * The type scale, exactly as the app draws it. One system sans stack throughout —
 * there is no second family, and no custom font is loaded.
 */
export const TYPE_ROWS = [
  { name: "Page title", spec: "24px / 700 / 1.2", sample: "Today", className: "text-[24px] font-bold leading-tight" },
  { name: "Sheet title", spec: "20px / 600 / 1.25", sample: "Log shot", className: "text-[20px] font-semibold leading-tight" },
  { name: "Body", spec: "16px / 400 / 1.5", sample: "Your next dose is in 2 days.", className: "text-[16px] font-normal" },
  { name: "Field label", spec: "14px / 500 / 1.4", sample: "Injection site", className: "text-[14px] font-medium" },
  { name: "Caption", spec: "13px / 400 / 1.4", sample: "Different from your prescribed dose.", className: "text-[13px] font-normal" },
  { name: "Micro", spec: "11px / 500", sample: "TODAY", className: "text-[11px] font-medium uppercase tracking-wide" },
];

/**
 * The eight App Store screenshots. Each one is composed on this page at Apple's
 * 6.9" size — 1290 × 2796 — with the headline that sells it.
 */
export const SCREENSHOTS = [
  {
    id: "today",
    title: "Everything in one place",
    subtitle: "Your next dose, your weight and today's numbers, at a glance.",
  },
  {
    id: "log-shot",
    title: "Log a shot in seconds",
    subtitle: "The strength on your pen, the site you used, saved in a few taps.",
  },
  {
    id: "history",
    title: "A complete dose history",
    subtitle: "Every shot and dose, with dates, sites, notes and how far you have come.",
  },
  {
    id: "levels",
    title: "See the pattern between doses",
    subtitle: "An estimated level drawn from your own logs. A model, not a reading.",
  },
  {
    id: "rotation",
    title: "Rotate sites with confidence",
    subtitle: "A recommended site each time, and the shape of your own rotation.",
  },
  {
    id: "symptoms",
    title: "Track how you actually feel",
    subtitle: "Structured side-effect logging with severity, timing and a clear timeline.",
  },
  {
    id: "medications",
    title: "Your regimen, scheduled",
    subtitle: "Weekly, daily or every few days, with reminder times and repeat doses.",
  },
  {
    id: "report",
    title: "A report for your clinician",
    subtitle: "A printable PDF summary of doses, weight and symptoms for your next visit.",
  },
];

/** The store listing, ready to paste into App Store Connect. */
export const LISTING_COPY = [
  { label: "App name", limit: "30 characters", value: "Levli — Personal Logbook" },
  { label: "Subtitle", limit: "30 characters", value: "GLP-1 dose & symptom tracker" },
  {
    label: "Promotional text",
    limit: "170 characters",
    value:
      "Log a shot in seconds, see your estimated levels between doses, and keep a symptom record your clinician can actually read.",
  },
  {
    label: "Keywords",
    limit: "100 characters, comma separated",
    value: "GLP-1,dose log,shot tracker,semaglutide,tirzepatide,side effects,symptom,weight,adherence",
  },
  {
    label: "Description",
    limit: "4000 characters",
    multiline: true,
    value: `Levli is a personal logbook for GLP-1 treatment: your doses, your schedule, how you feel and how your weight is moving, kept in one place you can hand to your clinician.

LOG A SHOT IN SECONDS
Pick your medication, tap the strength you took, set the site and save it. Levli remembers the rest.

SCHEDULES AND REMINDERS
Weekly, twice weekly, daily or every few days, with a reminder time and repeating doses.

SIDE EFFECTS, TRACKED PROPERLY
Choose from a structured list of symptoms, set severity and date, and keep a timeline. Serious symptoms surface the official reporting routes, such as the MHRA Yellow Card and FDA MedWatch.

SEE THE PATTERN
Estimated levels between doses, your injection site rotation, dose history and adherence, laid out so a trend is visible at a glance.

WEIGHT, NUTRITION AND ACTIVITY
Track weight, calories, protein, water, fibre and exercise day by day, with progress photos if you want them.

A REPORT FOR YOUR CLINICIAN
Generate a printable PDF summary of doses, weight and symptoms for your next appointment.

YOUR MEDICATION STOCK
Keep an eye on lots, expiry dates and what is left in the box.

YOUR DATA IS YOURS
Export or back up everything at any time, and delete your account from inside the app.

Levli is a personal record-keeping tool. It does not provide medical advice, diagnosis or treatment, and it never tells you to change a dose. Always follow your prescriber's instructions, and contact your local emergency number in an emergency.`,
  },
  {
    label: "What's new",
    limit: "4000 characters",
    value:
      "First release: dose logging, schedules and reminders, structured symptom tracking, weight and nutrition, and a printable report for your clinician.",
  },
  { label: "Support URL", value: "https://levli-app.base44.app/help-feedback" },
  { label: "Marketing URL", value: "https://levli-app.base44.app" },
  { label: "Privacy policy URL", value: "https://levli-app.base44.app/privacy" },
];

/**
 * What App Store Connect asks for, with the value or the link the reviewer needs.
 * `warn` marks the one row that must be settled before submission rather than
 * filled in.
 */
export const CHECKLIST = [
  { label: "App icon", value: "1024 × 1024 PNG, no alpha, no rounded corners — on this page" },
  { label: "Screenshots", value: '6.9" iPhone required (1290 × 2796) — all eight are on this page' },
  { label: "Category", value: "Health & Fitness, secondary Medical" },
  { label: "Age rating", value: "17+ — medical and treatment information, 18+ gate in the app" },
  { label: "Price", value: "Free with an auto-renewable subscription for premium features" },
  {
    label: "In-app purchase",
    value:
      "Still to do: premium is sold through Stripe on the web. App Review guideline 3.1.1 requires StoreKit purchases for digital features unlocked inside the app",
    warn: "Must be settled before submission.",
  },
  { label: "Support URL", value: "https://levli-app.base44.app/help-feedback" },
  { label: "Privacy policy URL", value: "https://levli-app.base44.app/privacy" },
  { label: "Terms", value: "https://levli-app.base44.app/terms" },
  { label: "Medical disclaimer", value: "https://levli-app.base44.app/medical-disclaimer" },
  {
    label: "App privacy",
    value: "Declare Health & Fitness, and the email address and name held on the account",
  },
  {
    label: "Review notes",
    value:
      "Say that Levli is a personal logbook and not a medical device, and give the reviewer a demo account with a few logged doses so the report and insights are reachable",
  },
  { label: "Data deletion", value: "Account deletion is inside the app, under Settings — required by review" },
];

/** The sections the nav pills jump to, in the order the page reads. */
export const SECTIONS = [
  { id: "name", label: "Name" },
  { id: "icon", label: "App icon" },
  { id: "colours", label: "Colours" },
  { id: "type", label: "Type" },
  { id: "screenshots", label: "Screenshots" },
  { id: "listing", label: "Store copy" },
  { id: "checklist", label: "Submission" },
];