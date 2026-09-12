/**
 * Cookie helpers.
 *
 * The auth token itself is set httpOnly by the backend and is therefore
 * deliberately unreadable here — the browser attaches it automatically on
 * every request (axios is configured with withCredentials: true). The only
 * cookie we read from JS is `user_info`, a non-sensitive cached copy of the
 * public user object used to hydrate Redux on first paint without waiting
 * on a /profile round trip.
 */

export function readCookie(name) {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));

  if (!match) return null;

  // Cookie values can legitimately contain '=' (e.g. base64/JSON), so only
  // split on the first one.
  const value = match.slice(name.length + 1);

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function readJsonCookie(name) {
  const raw = readCookie(name);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    // Malformed / tampered cookie — treat as absent rather than crashing
    // the whole app during store initialization.
    return null;
  }
}

/**
 * Best-effort client-side clear. The httpOnly token cookie can only really
 * be cleared by the server (POST /auth/logout); this exists so the UI can
 * drop the readable copy immediately even if that request fails.
 */
export function clearCookie(name) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export const USER_INFO_COOKIE = "user_info";
