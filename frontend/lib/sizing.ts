import type { BodyProfile } from "./api";

/**
 * Clothing size + body measurement estimates from the profile.
 *
 * These are rough regressions over height, weight, gender and body type — the
 * kind of estimate a size guide gives you, not a tailor. Everything this
 * returns is labelled as an estimate in the UI, and the confidence value says
 * how much of the profile it actually had to work with.
 *
 * Pure and deterministic: no network, no state, same input same output.
 */

export type Confidence = "high" | "medium" | "low";

/** The body profile plus `bodyType`, which lives in preferences rather than body. */
export type SizingInput = Partial<BodyProfile> & { bodyType?: string };

export interface Measurements {
  chest: number;
  waist: number;
  hip: number;
  inseam: number;
  shoulder: number;
}

export interface SizingEstimate {
  shirtSize: string;
  pantsSize: string;
  /** Waist in inches, the way trousers are usually labelled. */
  waistLabel: string;
  measurements: Measurements;
  confidence: Confidence;
  /** Profile fields that would sharpen the estimate, in plain English. */
  missing: string[];
}

type Gender = BodyProfile["gender"];

const LETTER_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

// Upper bound of each letter size by chest/bust circumference in cm,
// following the ranges most high-street size guides publish.
const SHIRT_BANDS: Record<"female" | "male", number[]> = {
  male: [91, 96, 102, 107, 112],
  female: [81, 86, 91, 97, 104],
};

// Same idea for trousers, by waist circumference in cm.
const PANTS_BANDS: Record<"female" | "male", number[]> = {
  male: [76, 81, 86, 94, 102],
  female: [66, 71, 76, 84, 92],
};

// Body type nudges on top of the height/weight regression. Deliberately small:
// weight already carries most of the build signal, so a large delta here
// double-counts it and pushes slim or plus figures to implausible extremes.
const BODY_TYPE_DELTAS: Record<string, Partial<Measurements>> = {
  Slim: { chest: -2, waist: -2, hip: -2 },
  Athletic: { chest: 2, waist: -2 },
  Average: {},
  Curvy: { chest: 1, waist: 1, hip: 3 },
  Plus: { chest: 2, waist: 3, hip: 3 },
};

function bandToLetter(value: number, bands: number[]): string {
  const index = bands.findIndex((upper) => value < upper);
  return LETTER_SIZES[index === -1 ? LETTER_SIZES.length - 1 : index];
}

/** Shift a letter size by one step — how a fit preference actually reads. */
function shiftSize(size: string, steps: number): string {
  const index = LETTER_SIZES.indexOf(size as (typeof LETTER_SIZES)[number]);
  if (index === -1) return size;
  const next = Math.min(LETTER_SIZES.length - 1, Math.max(0, index + steps));
  return LETTER_SIZES[next];
}

function measurementsFor(gender: Gender, heightCm: number, weightKg: number): Measurements {
  const male = {
    chest: 0.3 * heightCm + 0.62 * weightKg,
    waist: 0.2 * heightCm + 0.72 * weightKg - 3,
    hip: 0.28 * heightCm + 0.55 * weightKg + 8.5,
    shoulder: 0.259 * heightCm,
  };
  const female = {
    chest: 0.28 * heightCm + 0.62 * weightKg + 4.6,
    waist: 0.18 * heightCm + 0.7 * weightKg - 2.7,
    hip: 0.3 * heightCm + 0.62 * weightKg + 7.3,
    shoulder: 0.237 * heightCm,
  };

  // Unstated gender averages the two rather than silently assuming one.
  const base =
    gender === "male"
      ? male
      : gender === "female"
        ? female
        : {
            chest: (male.chest + female.chest) / 2,
            waist: (male.waist + female.waist) / 2,
            hip: (male.hip + female.hip) / 2,
            shoulder: (male.shoulder + female.shoulder) / 2,
          };

  return { ...base, inseam: heightCm * 0.45 };
}

function confidenceFor(body: SizingInput): {
  confidence: Confidence;
  missing: string[];
} {
  const missing: string[] = [];
  if (!body.gender) missing.push("gender");
  if (!body.bodyType) missing.push("body type");
  if (!body.preferredFit) missing.push("preferred fit");

  const known = 3 - missing.length;
  const confidence: Confidence = known >= 3 ? "high" : known >= 1 ? "medium" : "low";
  return { confidence, missing };
}

/**
 * Estimate sizes and measurements. Returns null when height or weight is
 * missing — there's nothing honest to show without them, so the UI asks for
 * them instead of printing an invented number.
 */
export function estimateSizing(body: SizingInput | undefined): SizingEstimate | null {
  if (!body?.heightCm || !body?.weightKg) return null;

  const gender = body.gender || "";
  const raw = measurementsFor(gender, body.heightCm, body.weightKg);
  const delta = BODY_TYPE_DELTAS[body.bodyType || "Average"] || {};

  const measurements: Measurements = {
    chest: Math.round(raw.chest + (delta.chest ?? 0)),
    waist: Math.round(raw.waist + (delta.waist ?? 0)),
    hip: Math.round(raw.hip + (delta.hip ?? 0)),
    inseam: Math.round(raw.inseam),
    shoulder: Math.round(raw.shoulder),
  };

  const table = gender === "female" ? "female" : "male";
  const fitShift =
    body.preferredFit === "Relaxed" ? 1 : body.preferredFit === "Slim" ? -1 : 0;

  const waistInches = Math.round(measurements.waist / 2.54 / 2) * 2;

  const { confidence, missing } = confidenceFor(body);

  return {
    shirtSize: shiftSize(bandToLetter(measurements.chest, SHIRT_BANDS[table]), fitShift),
    pantsSize: shiftSize(bandToLetter(measurements.waist, PANTS_BANDS[table]), fitShift),
    waistLabel: `W${waistInches}`,
    measurements,
    confidence,
    missing,
  };
}

/** Format a centimetre measurement for the user's chosen units. */
export function formatLength(cm: number, units: string): string {
  if (units === "Imperial (in)") return `${Math.round(cm / 2.54)} in`;
  return `${cm} cm`;
}

export const CONFIDENCE_COPY: Record<Confidence, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};
