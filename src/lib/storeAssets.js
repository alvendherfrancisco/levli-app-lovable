// ─────────────────────────────────────────────────────────────────────────────
// Everything the Apple App Store release needs, in one place.
//
// src/pages/StoreAssetsPage.jsx draws these lists on screen and
// src/lib/storeDownload.js prints the very same values into the downloadable
// pack, so a change made here shows up in both. Character limits are Apple's
// own, and the listing fields are checked against them as they are drawn.
//
// Deliberately free of app imports, so every value can be read and
// length-checked on its own.
// ─────────────────────────────────────────────────────────────────────────────

// ── App icon ─────────────────────────────────────────────────────────────────

/** The one file App Store Connect asks for, already exported from the brand. */
export const APP_STORE_ICON = {
  path: "/assets/brand/exports/levli-appstore-1024.png",
  filename: "levli-appstore-1024.png",
  size: "1024 × 1024 px",
  verified:
    "Square, PNG, true colour with no alpha channel: no transparency and no rounded corners. iOS applies its own corners and App Store Connect reads this file from the build.",
};

/** Every brand export, the store ones first. */
export const ICON_FILES = [
  { path: "/assets/brand/exports/levli-appstore-1024.png", size: "1024 × 1024", label: "App Store icon", note: "The store upload and the Xcode asset catalog" },
  { path: "/assets/brand/levli-icon-1024.png", size: "1024 × 1024", label: "Master icon", note: "Source for every smaller size" },
  { path: "/assets/brand/exports/levli-playstore-512.png", size: "512 × 512", label: "Google Play icon", note: "Play Console listing" },
  { path: "/assets/brand/exports/levli-adaptive-foreground-432.png", size: "432 × 432", label: "Play adaptive icon, foreground", note: "Android adaptive icon" },
  { path: "/assets/brand/exports/levli-adaptive-background-432.png", size: "432 × 432", label: "Play adaptive icon, background", note: "Android adaptive icon" },
  { path: "/assets/brand/levli-maskable-512.png", size: "512 × 512", label: "Maskable icon", note: "Installed web app on Android" },
  { path: "/assets/brand/apple-touch-icon-180.png", size: "180 × 180", label: "Apple touch icon", note: "Add to home screen" },
  { path: "/assets/brand/levli-icon-512.png", size: "512 × 512", label: "Web app icon", note: "App manifest (192 and 384 alongside)" },
  { path: "/assets/brand/levli-drop-mark-512.png", size: "512 × 512", label: "Droplet mark", note: "The logo alone, transparent" },
  { path: "/assets/brand/favicon.ico", size: "any", label: "Favicon", note: "Browser tab (32 and 16 px alongside)" },
];

// ── Screenshots ──────────────────────────────────────────────────────────────

export const SCREENSHOT_SIZES = [
  { label: "6.9-inch iPhone", size: "1320 × 2868 px", status: "Preferred" },
  { label: "6.9-inch iPhone", size: "1260 × 2736 px · 1290 × 2796 px", status: "Also accepted" },
  { label: "6.5-inch iPhone", size: "1284 × 2778 px · 1242 × 2688 px", status: "Used only if there is no 6.9-inch set" },
];

export const SCREENSHOT_RULES = [
  "Portrait, between 1 and 10 shots, uploaded in the order they should be seen.",
  "PNG or JPEG. Apple scales the smaller iPhone sizes from this set on its own.",
  "Real screens from the running app, showing features that exist. No ads, no invented features, nothing misleading.",
  "No personal health data on screen: capture with a demo account holding realistic but non-personal entries.",
  "One theme across the whole set, all light or all dark.",
];

/** The shots, in the order they are uploaded. */
export const SHOT_PLAN = [
  {
    screen: "Home",
    what: "Today: the next dose and the day's numbers on one screen.",
    caption: "Your next dose and today's numbers, at a glance",
  },
  {
    screen: "Log a shot or a dose",
    what: "The log sheet open on a product, with its own strengths and the site suggestion showing.",
    caption: "Log a shot or a tablet in seconds",
  },
  {
    screen: "Insights",
    what: "The estimated level chart over time, and the site rotation beside it.",
    caption: "See your estimated levels and site rotation",
  },
  {
    screen: "History",
    what: "The calendar with logged days marked, and a day's entries listed.",
    caption: "Every dose, symptom and note on one calendar",
  },
  {
    screen: "Doctor report",
    what: "The finished report preview, showing its sections.",
    caption: "A doctor-ready PDF you can share or print",
  },
  {
    screen: "Meds and Stock",
    what: "An active regimen with its schedule and reminder, and stock with an expiry date.",
    caption: "Your regimens, reminders and stock in one place",
  },
];

export const CAPTURE_STEPS = [
  "Open the app on a 6.9-inch iPhone (16 Pro Max or 15 Pro Max), or the same device in Simulator, signed in with the demo account.",
  "Fill the screens with realistic, non-personal entries first: a few doses, some weight and nutrition days, a couple of symptoms.",
  "Take a normal screenshot on each screen. On these devices the file is already 1320 × 2868 px (15 Pro Max: 1290 × 2796 px).",
  "Check each file is portrait and that the size matches the table above before uploading.",
  "Name them in upload order, for example 01-home.png, 02-log-dose.png, and so on.",
  "Upload them in App Store Connect, in that same order, for the 6.9-inch iPhone display.",
];

// ── Listing text and links ───────────────────────────────────────────────────

export const LISTING_GROUPS = [
  {
    title: "Identity",
    fields: [
      { key: "name", label: "App name", limit: 30, value: "Levli: GLP-1 Dose Logbook", hint: "Shown under the icon on the store" },
      { key: "subtitle", label: "Subtitle", limit: 30, value: "Dose, symptom and weight log", hint: "The line under the app name" },
      { key: "category_primary", label: "Primary category", value: "Health & Fitness" },
      { key: "category_secondary", label: "Secondary category", value: "Medical" },
      { key: "copyright", label: "Copyright", value: "© 2026 Levli. All rights reserved." },
    ],
  },
  {
    title: "Listing text",
    fields: [
      {
        key: "promo",
        label: "Promotional text",
        limit: 170,
        value: "Log every dose the way your prescriber writes it: pen, tablet, spray, vial or patch. Schedule, symptoms and weight in one private place, with a doctor-ready report.",
        hint: "Editable at any time without submitting a new build",
      },
      { key: "description", label: "Description", limit: 4000, rows: true, value: `Levli is a personal logbook for people on a prescription medication such as a GLP-1. It keeps the details your prescriber asks about in one place, so nothing has to be remembered at the next appointment.

LOG EVERY DOSE, HOWEVER YOU TAKE IT
• Shots: pens, prefilled syringes and vials, with dose, site, pain and notes
• Tablets and capsules, nasal sprays, patches, topicals, implants and infusions
• Every strength the label lists for your product, or a dose your prescriber set
• A rotating injection-site suggestion, so the same spot is not used twice
• Repeat schedules and reminders for a set number of weeks, or until you change it

KEEP YOUR SCHEDULE STRAIGHT
• Your own interval between doses, with a prescriber-directed override
• Today's dose, the next dose and what is due, at a glance
• History as a calendar, plus a full list of everything you have logged

TRACK HOW YOU FEEL
• Symptoms and side effects as structured entries: severity, timing and outcome
• Weight, protein, calories, water, fibre, carbs and exercise minutes
• Progress photos, private to your account
• A journal for the notes that do not fit anywhere else
• Stock and expiry tracking for pens, vials and other containers

SEE THE PATTERN
• Insights: estimated medication levels over time, from the doses you logged
• Site rotation, dose history and side-effect trends
• Wellbeing and adherence summaries

SHARE WITH YOUR CLINICIAN
• A clean PDF report: doses, side effects, weight and journal notes
• Choose the sections and the date range, preview it, then share or print

YOUR DATA, YOURS
• Everything you log is private to your account
• Export everything as a spreadsheet, or save a backup and restore it later
• Caregiver access: grant scoped, revocable access to someone you trust
• Delete your account and all of its data from inside the app, at any time
• Light and dark mode, kg or lb, cm or ft-in

A NOTE ON SAFETY
Levli is a personal logbook, not medical advice, and it will not tell you to change a dose. The dose and safety information it shows comes from the manufacturer's own prescribing information, and it always points you back to your prescriber. If something feels wrong, contact your clinician.

LEVLI PREMIUM
Insights and the doctor report are part of Levli Premium, available as an in-app purchase. Logging, history and your data stay free. Premium is what keeps the app running and free of advertising.

Questions: support@levli.app` },
      {
        key: "keywords",
        label: "Keywords",
        limit: 100,
        value: "GLP-1 tracker,injection log,dose log,weight tracker,symptom diary,semaglutide,tirzepatide,shot log",
        hint: "Comma-separated, no spaces after the commas",
      },
      {
        key: "whats_new",
        label: "What's New (1.0.0)",
        limit: 4000,
        rows: true,
        value: "First release. Log shots, tablets and sprays, keep your schedule and reminders, track symptoms, weight and nutrition, and share a PDF report with your doctor.",
        hint: "A fresh entry for every build you submit",
      },
    ],
  },
  {
    title: "Links",
    fields: [
      {
        key: "support_url",
        label: "Support URL",
        value: "https://levli.app/support",
        hint: "Must open in a browser without signing in, and show a real contact email",
      },
      {
        key: "privacy_url",
        label: "Privacy Policy URL",
        value: "https://levli.app/privacy",
        hint: "Must open in a browser without signing in, and show a real contact email",
      },
      { key: "support_email", label: "Support email shown on those pages", value: "support@levli.app" },
      { key: "privacy_email", label: "Privacy contact shown on those pages", value: "privacy@levli.app" },
    ],
  },
];

// ── App Store Connect forms ──────────────────────────────────────────────────

export const CONNECT_FORMS = [
  {
    title: "App Privacy",
    intro: "Levli answers Data Not Collected.",
    rows: [
      { label: "Data collection", value: "Data Not Collected" },
      {
        label: "Why this answer holds",
        value:
          "Everything a person logs stays with their own account: there is no third-party analytics, advertising or tracking SDK in the app, and nothing is shared with anyone else.",
      },
    ],
  },
  {
    title: "Age rating questionnaire",
    intro: "Answers for the current questionnaire. App Store Connect sets the final rating from them.",
    rows: [
      { label: "Medical or treatment information", value: "Yes" },
      { label: "Alcohol, tobacco or drug references", value: "None (prescription names appear as health information, never as substance use)" },
      { label: "Violence, sexual content, profanity, horror, gambling", value: "None" },
      { label: "User-generated content, messaging and chat", value: "No" },
      { label: "Unrestricted web access", value: "No" },
      { label: "Advertising", value: "No" },
      { label: "In-app purchases", value: "Yes (Levli Premium)" },
      { label: "Parental controls or age assurance", value: "No" },
    ],
  },
  {
    title: "Export compliance",
    intro: "Standard encryption only.",
    rows: [
      { label: "Encryption question", value: "Standard encryption only" },
      { label: "Why", value: "The app uses HTTPS for its own requests and nothing else: no custom or proprietary cryptography." },
      { label: "France declaration", value: "Not needed for standard encryption only" },
    ],
  },
  {
    title: "App Review information",
    intro: "Contact details are private and seen by Apple only.",
    rows: [
      { label: "Contact first and last name", value: "To complete", open: true },
      { label: "Phone number", value: "To complete", open: true },
      { label: "Email", value: "support@levli.app" },
      { label: "Demo login", value: "Required: Levli has accounts", open: true, note: "Create a review account with a completed onboarding and some sample entries, then give its email and password here." },
      {
        label: "Review notes",
        value:
          "Levli is a personal logbook for prescription medication, not a medical device and not medical advice. An account and a short onboarding are required: the onboarding confirms the 18+ age gate, chooses units and picks which modules to track. Every health entry in the app is typed in by the person using it; the app imports no third-party health data. The demo account below is set up with sample entries so the Insights and report screens can be reviewed.",
      },
    ],
  },
  {
    title: "Content rights",
    intro: "",
    rows: [
      { label: "Third-party content", value: "None" },
      {
        label: "Brand names",
        value:
          "Medication names are trademarks of their owners and are used only to identify the product a person has been prescribed. The app contains no third-party text, images or data feeds.",
      },
    ],
  },
  {
    title: "Pricing and availability",
    intro: "",
    rows: [
      { label: "Price", value: "Free, with Levli Premium as an in-app purchase" },
      { label: "In-app purchase", value: "Levli Premium (monthly, yearly and one-time options as configured)" },
      { label: "Availability", value: "To complete: choose the territories", open: true },
    ],
  },
  {
    title: "Build upload",
    intro: "",
    rows: [
      { label: "Version", value: "1.0.0" },
      { label: "App icon", value: "The 1024 × 1024 PNG in the Xcode asset catalog" },
      { label: "Upload", value: "Xcode or Transporter, then select the build in App Store Connect" },
      { label: "Minimum iOS", value: "To complete: name the deployment target set in the Xcode project", open: true },
    ],
  },
];

// ── The release checklist ────────────────────────────────────────────────────

/** `open: true` marks the items only the team can finish. */
export const RELEASE_CHECKLIST = [
  { label: "App icon 1024 × 1024 PNG in the asset catalog", hint: "Download it below; no transparency, no rounded corners", open: false },
  { label: "Screenshots captured at 1320 × 2868 px", hint: "Between 1 and 10, in the order in the plan above", open: true },
  { label: "App name, subtitle and promotional text entered", hint: "Within 30 and 170 characters", open: false },
  { label: "Description and keywords entered", hint: "Keywords within 100 characters", open: false },
  { label: "What's New written for this version", hint: "1.0.0 release notes", open: false },
  { label: "Support and Privacy Policy URLs check out in a browser", hint: "Both must open signed out and show a real contact email", open: true },
  { label: "Copyright and categories set", hint: "Health & Fitness, with Medical as secondary", open: false },
  { label: "App Privacy answers entered", hint: "Data Not Collected", open: false },
  { label: "Age rating questionnaire completed", hint: "Medical or treatment information: yes", open: false },
  { label: "Export compliance answered", hint: "Standard encryption only", open: false },
  { label: "App Review contact details and demo login filled in", hint: "The app has accounts, so a demo login is required", open: true },
  { label: "Content rights completed", hint: "No third-party content", open: false },
  { label: "Pricing and availability chosen", hint: "Free with Levli Premium; pick the territories", open: true },
  { label: "Build uploaded from Xcode or Transporter", hint: "Version 1.0.0, then selected in App Store Connect", open: true },
];

/** What the page cannot hand over, with the reason. */
export const PAGE_LIMITS = [
  "The screenshots themselves: they have to be captured from the running app on a 6.9-inch iPhone or the same Simulator, so the screens show real data. The plan above is the shot list to capture.",
  "Private details only the team holds: the reviewer's name and phone number, the demo login, the territories and the deployment target.",
];