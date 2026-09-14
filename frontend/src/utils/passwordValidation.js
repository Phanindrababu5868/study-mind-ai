/**
 * Password strength rules for live client-side feedback.
 * Mirrors backend/utils/passwordValidation.js — keep both in sync if the
 * policy changes. Duplicated intentionally: frontend and backend don't
 * share a module graph.
 */

export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_RULES = [
  {
    id: "length",
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (pw) => pw.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: "uppercase",
    label: "One uppercase letter (A-Z)",
    test: (pw) => /[A-Z]/.test(pw),
  },
  {
    id: "lowercase",
    label: "One lowercase letter (a-z)",
    test: (pw) => /[a-z]/.test(pw),
  },
  {
    id: "number",
    label: "One number (0-9)",
    test: (pw) => /[0-9]/.test(pw),
  },
  {
    id: "special",
    label: "One special character (!@#$%...)",
    test: (pw) => /[^A-Za-z0-9]/.test(pw),
  },
];

/**
 * Returns { valid, results } where results is PASSWORD_RULES annotated
 * with a boolean `passed` for the given password, for rendering a checklist.
 */
export function evaluatePassword(password) {
  const pw = password || "";
  const results = PASSWORD_RULES.map((rule) => ({ ...rule, passed: rule.test(pw) }));
  return { valid: results.every((r) => r.passed), results };
}

export function isPasswordValid(password) {
  return evaluatePassword(password).valid;
}
