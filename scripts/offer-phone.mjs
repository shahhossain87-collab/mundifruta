/**
 * Phone normalization for the MUNDI10 first-purchase check. Pure (no imports)
 * so it runs in the browser, the server route and the admin scripts alike.
 *
 *   "932 699 850", "+351932699850", "00351 932699850", "351932699850"
 *     -> "+351932699850"
 *   "+44 7700 900123" / "0044 7700 900123" -> "+447700900123" (kept as given)
 *
 * Returns null for anything that is not a plausible phone number
 * (fewer than 9 or more than 15 digits, or input longer than 40 chars).
 *
 * @param {unknown} input
 * @returns {string | null}
 */
export function normalizePhone(input) {
  if (typeof input !== "string" || input.length > 40) return null;
  let s = input.trim().replace(/[\s\-()./]/g, "");
  if (!/^\+?\d+$/.test(s)) return null;
  if (s.startsWith("+")) s = s.slice(1);
  else if (s.startsWith("00")) s = s.slice(2);
  else if (/^[29]\d{8}$/.test(s)) s = `351${s}`;
  if (s.length < 9 || s.length > 15) return null;
  return `+${s}`;
}

/**
 * Last three digits, kept in clear so the shop can recognise an entry.
 * @param {string} normalized
 */
export function lastThree(normalized) {
  return normalized.slice(-3);
}
