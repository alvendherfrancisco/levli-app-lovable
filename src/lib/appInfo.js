/** Single source of truth for the app's identity, support details and legal links. */
export const APP_NAME = "Levli";
export const APP_TAGLINE = "Personal logbook and tracker";
export const APP_VERSION = "1.0.0";
export const SUPPORT_EMAIL = "support@levli.app";
export const FEEDBACK_EMAIL = "feedback@levli.app";

/** Version of the documents a user consents to; bump when they change. */
export const PRIVACY_POLICY_VERSION = "1.0";

/**
 * Public base URL of the published app. The legal pages below are reachable at
 * this host without signing in, which is what the store review teams open.
 * If a custom domain is connected, replace this value with it.
 */
export const PUBLIC_BASE_URL = "https://levli-app.base44.app";

export const PUBLIC_URLS = {
  privacy: `${PUBLIC_BASE_URL}/privacy`,
  terms: `${PUBLIC_BASE_URL}/terms`,
  medicalDisclaimer: `${PUBLIC_BASE_URL}/medical-disclaimer`,
  aboutSources: `${PUBLIC_BASE_URL}/about-sources`,
  support: `${PUBLIC_BASE_URL}/more`,
};

/** The one disclaimer shown at the foot of every screen. */
export const DISCLAIMER_TEXT =
  "Levli is a personal logbook, not medical advice. Don't use it to adjust your dose. Talk to your prescriber.";