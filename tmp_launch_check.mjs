// Throwaway check of the launch gate's decisions, run once and deleted.
import assert from "node:assert/strict";

const store = new Map();
global.window = {
  sessionStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
  },
};

const { showsSplash, isLaunchReady, splashAlreadyPlayed, rememberSplashPlayed } =
  await import("./tmp_gate.mjs");

const lines = [];
const check = (name, fn) => {
  try {
    fn();
    lines.push(`PASS  ${name}`);
  } catch (e) {
    lines.push(`FAIL  ${name} — ${e.message}`);
    process.exitCode = 1;
  }
};

const signedOut = {
  isLoadingAuth: false,
  isLoadingPublicSettings: false,
  isAuthenticated: false,
  onboardingCompleted: null,
  isLoggingOut: false,
};
const signedIn = { ...signedOut, isAuthenticated: true, onboardingCompleted: true };

// A fresh session (cold start, new tab, PWA relaunch).
check("cold start — splash shows", () =>
  assert.equal(showsSplash({ launchDone: splashAlreadyPlayed(), isLoggingOut: false }), true));
check("cold start — holds while the session check runs", () =>
  assert.equal(isLaunchReady({ ...signedOut, isLoadingPublicSettings: true }), false));
check("cold start — holds while auth is loading", () =>
  assert.equal(isLaunchReady({ ...signedOut, isLoadingAuth: true }), false));
check("cold start — holds until the profile lands (signed in)", () =>
  assert.equal(isLaunchReady({ ...signedIn, onboardingCompleted: null }), false));
check("cold start — may leave once settled, signed out", () =>
  assert.equal(isLaunchReady(signedOut), true));
check("cold start — may leave once settled, signed in", () =>
  assert.equal(isLaunchReady(signedIn), true));

// The launch ends.
rememberSplashPlayed();
check("after the launch — it is remembered", () =>
  assert.equal(splashAlreadyPlayed(), true));
check("after the launch — splash no longer shows", () =>
  assert.equal(showsSplash({ launchDone: splashAlreadyPlayed(), isLoggingOut: false }), false));

// Login reloads the document; same session.
check("login reload — no second splash", () =>
  assert.equal(showsSplash({ launchDone: splashAlreadyPlayed(), isLoggingOut: false }), false));

// Logout.
check("logout — splash covers the sign-out", () =>
  assert.equal(showsSplash({ launchDone: splashAlreadyPlayed(), isLoggingOut: true }), true));
check("logout — splash cannot leave early", () =>
  assert.equal(isLaunchReady({ ...signedOut, isLoggingOut: true }), false));

// The document the logout lands on.
check("after logout — login screen with no splash over it", () =>
  assert.equal(showsSplash({ launchDone: splashAlreadyPlayed(), isLoggingOut: false }), false));

// Login again.
check("login again — still no replay", () =>
  assert.equal(showsSplash({ launchDone: splashAlreadyPlayed(), isLoggingOut: false }), false));

// A new session.
store.clear();
check("new session — splash plays again", () =>
  assert.equal(showsSplash({ launchDone: splashAlreadyPlayed(), isLoggingOut: false }), true));

// Reduce Motion changes the splash's own sequence, never these decisions.
check("reduce motion — decisions unchanged", () => {
  assert.equal(isLaunchReady(signedIn), true);
  assert.equal(showsSplash({ launchDone: false, isLoggingOut: false }), true);
});

// Storage that cannot be read or written (private mode) must not break it.
check("no storage — launch still works", () => {
  const real = global.window;
  delete global.window;
  assert.equal(splashAlreadyPlayed(), false);
  assert.doesNotThrow(() => rememberSplashPlayed());
  assert.equal(showsSplash({ launchDone: false, isLoggingOut: false }), true);
  global.window = real;
});

console.log(lines.join("\n"));
console.log(process.exitCode ? "SOME CHECKS FAILED" : `all ${lines.length} checks passed`);