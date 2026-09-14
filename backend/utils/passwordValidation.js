/**
 * Single source of truth for password strength rules on the server.
 * Mirrors frontend/src/utils/passwordValidation.js — keep both in sync if
 * the policy changes (duplicated intentionally: frontend and backend don't
 * share a module graph).
 */

export const MIN_LENGTH = 8;
export const MAX_LENGTH = 128; // guards against bcrypt's 72-byte truncation footgun & DoS via huge inputs

// Messages are written already lowercase (aside from proper nouns/ranges)
// so they can be joined into a sentence without a blanket toLowerCase()
// mangling things like "A-Z" into "a-z".
export const RULES = [
  {
    id: "length",
    message: `be at least ${MIN_LENGTH} characters long`,
    test: (pw) => pw.length >= MIN_LENGTH,
  },
  {
    id: "uppercase",
    message: "contain at least one uppercase letter (A-Z)",
    test: (pw) => /[A-Z]/.test(pw),
  },
  {
    id: "lowercase",
    message: "contain at least one lowercase letter (a-z)",
    test: (pw) => /[a-z]/.test(pw),
  },
  {
    id: "number",
    message: "contain at least one number (0-9)",
    test: (pw) => /[0-9]/.test(pw),
  },
  {
    id: "special",
    message: "contain at least one special character (e.g. !@#$%^&*)",
    test: (pw) => /[^A-Za-z0-9]/.test(pw),
  },
];

/**
 * Validates a candidate password against every rule.
 * Returns { valid, failedRules, message } — message is a single
 * human-readable string safe to return directly in an API response.
 */
export function validatePassword(password) {
  if (typeof password !== "string" || !password) {
    return { valid: false, failedRules: RULES.map((r) => r.id), message: "Password is required" };
  }

  if (password.length > MAX_LENGTH) {
    return {
      valid: false,
      failedRules: ["length"],
      message: `Password must be no more than ${MAX_LENGTH} characters long`,
    };
  }

  const failed = RULES.filter((rule) => !rule.test(password));

  if (failed.length === 0) {
    return { valid: true, failedRules: [], message: null };
  }

  return {
    valid: false,
    failedRules: failed.map((r) => r.id),
    message: `Password must ${failed.map((r) => r.message).join("; ")}`,
  };
}
