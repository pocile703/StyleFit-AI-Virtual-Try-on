/**
 * Body profile — the data behind the size estimate.
 *
 * Always stored metric; the UI converts for display using the existing
 * `preferences.units` setting. Values are validated per field rather than
 * wholesale, so one bad number can't discard the rest of a save.
 */

const GENDERS = ["", "female", "male", "neutral"];
const FITS = ["", "Relaxed", "Regular", "Slim"];
// Body type stays where it already lived, in preferences — one home per field.

const RANGES = {
  heightCm: [120, 230],
  weightKg: [30, 250],
  age: [13, 100],
};

export const EMPTY_BODY = Object.freeze({
  heightCm: null,
  weightKg: null,
  gender: "",
  age: null,
  preferredFit: "",
});

function numberField(key, value) {
  if (value === null || value === "") return { ok: true, value: null }; // explicit clear
  const n = Number(value);
  const [min, max] = RANGES[key];
  if (!Number.isFinite(n) || n < min || n > max) return { ok: false, value: null };
  return { ok: true, value: Math.round(n * 10) / 10 };
}

function enumField(allowed, value, current) {
  if (typeof value !== "string") return current ?? "";
  return allowed.includes(value) ? value : current ?? "";
}

/**
 * Merge an untrusted body object over the stored one.
 * Returns { body, rejected } — `rejected` names fields that were sent but
 * failed validation, so the API can say so instead of silently ignoring them.
 */
export function normalizeBody(raw, existing = {}) {
  const current = { ...EMPTY_BODY, ...existing };
  if (!raw || typeof raw !== "object") return { body: current, rejected: [] };

  const body = { ...current };
  const rejected = [];

  for (const key of ["heightCm", "weightKg", "age"]) {
    if (!(key in raw)) continue;
    const { ok, value } = numberField(key, raw[key]);
    // An out-of-range value keeps whatever was already stored — a typo in one
    // field shouldn't wipe a good value.
    if (ok) body[key] = value;
    else rejected.push(key);
  }

  if ("gender" in raw) body.gender = enumField(GENDERS, raw.gender, current.gender);
  if ("preferredFit" in raw) {
    body.preferredFit = enumField(FITS, raw.preferredFit, current.preferredFit);
  }

  return { body, rejected };
}
