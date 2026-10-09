// ─────────────────────────────────────────────────────────────────────────────
// Sign-up rules, in one place, so the account form and the button that submits
// it can never disagree about what is allowed.
//
// Every message says what to do next, never just that something is wrong, and
// every one of them appears beside the field it belongs to. Nothing here is
// shared with signing in — an existing account is checked by the server.
// ─────────────────────────────────────────────────────────────────────────────

export const MIN_PASSWORD_LENGTH = 8;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export function emailError(value) {
  const v = String(value || "").trim();
  if (!v) return "Enter your email address.";
  if (!EMAIL_RE.test(v)) return "That email doesn't look right. Check it, e.g. you@example.com.";
  return "";
}

export function passwordError(value) {
  const v = String(value || "");
  if (!v) return "Choose a password.";
  if (v.length < MIN_PASSWORD_LENGTH) return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  return "";
}

/**
 * A live hint about the password being typed — never a gate. Anything that
 * passes passwordError is accepted; this only says how much it has going for it.
 */
export function passwordStrength(value) {
  const v = String(value || "");
  if (!v) return null;
  let points = 0;
  if (v.length >= MIN_PASSWORD_LENGTH) points++;
  if (v.length >= 12) points++;
  if (/[a-z]/.test(v) && /[A-Z]/.test(v)) points++;
  if (/\d/.test(v)) points++;
  if (/[^A-Za-z0-9]/.test(v)) points++;
  if (points <= 1) return { score: 1, label: "Weak", tone: "weak", hint: "A few more characters would help." };
  if (points === 2) return { score: 2, label: "Fair", tone: "fair", hint: "Add a capital, a number or a symbol." };
  if (points === 3) return { score: 3, label: "Good", tone: "good", hint: "" };
  return { score: 4, label: "Strong", tone: "strong", hint: "" };
}

/**
 * Why the Create account button is not ready, as one plain sentence, or "".
 * A name is never part of this: accounts are an email and a password.
 */
export function formBlocker({ email, password }) {
  if (emailError(email)) return email.trim() ? emailError(email) : "Add your email address to continue.";
  if (passwordError(password)) {
    return password ? passwordError(password) : `Choose a password of at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return "";
}

/**
 * true when a sign-up was refused because that address already has an account.
 * The sign-up endpoint's message is the only signal it gives, so it is matched
 * generously rather than exactly — and only ever used to offer a way in, never
 * to accept a sign-up.
 */
export function isEmailTakenError(err) {
  const text = [err?.message, err?.data?.message, err?.data?.error, err?.statusText]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return /already (registered|exists|in use|been taken)|already been registered|email.{0,20}(exists|taken|registered)|duplicate/.test(text);
}