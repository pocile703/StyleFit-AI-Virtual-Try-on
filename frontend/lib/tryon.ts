/**
 * Try-on settings — mirrors backend/src/lib/tryonSettings.js.
 *
 * Two FASHN models sit behind the Quality switch, and each setting is real on
 * exactly one of them. Anything the picked tier can't express is hidden rather
 * than shown as a control that does nothing:
 *   Standard -> tryon-v1.6  photo type, garment type, body-shape handling
 *   High     -> tryon-max   fit, background, styling note
 *
 * Picking a High-only option upgrades the tier instead of being ignored.
 */

export type Quality = "standard" | "high";
export type PhotoType = "auto" | "model" | "flat-lay";
export type Fit = "relaxed" | "regular" | "slim";
export type Background = "original" | "studio";
export type GarmentType = "auto" | "tops" | "bottoms" | "one-pieces";
export type OutputFormat = "png" | "jpeg";

export interface TryOnSettings {
  quality: Quality;
  photoType: PhotoType;
  fit: Fit;
  background: Background;
  garmentType: GarmentType;
  preserveShape: boolean;
  stylingNote: string;
  outputFormat: OutputFormat;
}

export const DEFAULT_SETTINGS: TryOnSettings = {
  quality: "standard",
  photoType: "auto",
  fit: "regular",
  background: "original",
  garmentType: "auto",
  preserveShape: true,
  stylingNote: "",
  outputFormat: "png",
};

export const STYLING_NOTE_MAX = 120;

export interface Choice<T extends string> {
  value: T;
  label: string;
  description: string;
}

export const QUALITY_OPTIONS: Choice<Quality>[] = [
  {
    value: "standard",
    label: "Standard",
    description: "Fast and cheapest. Good for browsing lots of looks.",
  },
  {
    value: "high",
    label: "High",
    description: "Sharper, larger result. Takes longer and costs more.",
  },
];

export const PHOTO_TYPE_OPTIONS: Choice<PhotoType>[] = [
  { value: "auto", label: "Auto", description: "Let the AI work it out. Right nearly always." },
  { value: "model", label: "Model photo", description: "The clothing image shows someone wearing it." },
  { value: "flat-lay", label: "Flat lay", description: "The clothing is laid flat or on a plain background." },
];

export const FIT_OPTIONS: Choice<Fit>[] = [
  { value: "relaxed", label: "Relaxed", description: "Loose, with more natural draping." },
  { value: "regular", label: "Regular", description: "How the garment normally sits." },
  { value: "slim", label: "Slim", description: "Closer to the body, more tailored." },
];

export const BACKGROUND_OPTIONS: Choice<Background>[] = [
  { value: "original", label: "Keep original", description: "Your photo's own background stays." },
  { value: "studio", label: "Clean studio", description: "Swaps in a plain, evenly lit backdrop." },
];

export const GARMENT_TYPE_OPTIONS: Choice<GarmentType>[] = [
  { value: "auto", label: "Auto", description: "Detected from the clothing image." },
  { value: "tops", label: "Top", description: "Shirts, tees, jackets, knitwear." },
  { value: "bottoms", label: "Bottom", description: "Trousers, skirts, shorts." },
  { value: "one-pieces", label: "Full outfit", description: "Dresses and one-piece looks." },
];

/** True when the request needs the High tier — Standard has no fit or background control. */
export function requiresHighQuality(s: TryOnSettings): boolean {
  return s.fit !== "regular" || s.background !== "original" || Boolean(s.stylingNote.trim());
}

/**
 * Apply a settings change, upgrading the tier when the change demands it.
 * Returns the next settings and whether the tier was bumped, so the panel can
 * say why the quality just changed under the user.
 */
export function applySettingChange(
  current: TryOnSettings,
  patch: Partial<TryOnSettings>
): { settings: TryOnSettings; upgraded: boolean } {
  const next = { ...current, ...patch };

  // Dropping back to Standard means dropping the options only High can do.
  if (patch.quality === "standard") {
    next.fit = "regular";
    next.background = "original";
    next.stylingNote = "";
    return { settings: next, upgraded: false };
  }

  const upgraded = current.quality === "standard" && requiresHighQuality(next);
  if (upgraded) next.quality = "high";
  return { settings: next, upgraded };
}

/** The server's own price table, as reported by `GET /api/tryon/engine`. */
export interface CreditRates {
  standard: number;
  high: number;
}

/** Fallback only. The live rates come from the server — see `creditCost`. */
export const DEFAULT_CREDIT_RATES: CreditRates = { standard: 1, high: 3 };

/**
 * Credits FASHN bills for one image.
 *
 * `rates` comes from the engine endpoint, which has always returned them and
 * which the client used to fetch and throw away while hardcoding 1 and 3 here.
 * That meant a price change on the server would have left the UI quoting a
 * number that was simply false. Pass the fetched rates; the default is a
 * last-resort guess for the brief window before they arrive.
 */
export function creditCost(
  s: TryOnSettings,
  rates: CreditRates = DEFAULT_CREDIT_RATES
): number {
  return s.quality === "high" ? rates.high : rates.standard;
}

const LABELS: Record<string, string> = {
  auto: "Auto photo",
  model: "Model photo",
  "flat-lay": "Flat lay",
  relaxed: "Relaxed fit",
  regular: "Regular fit",
  slim: "Slim fit",
  studio: "Clean studio",
};

/** One-line summary for the collapsed panel: "Auto photo · Regular fit · Standard". */
export function summarizeSettings(s: TryOnSettings): string {
  const parts =
    s.quality === "high"
      ? [LABELS[s.fit], s.background === "studio" ? LABELS.studio : null, "High quality"]
      : [LABELS[s.photoType], "Regular fit", "Standard quality"];
  return parts.filter(Boolean).join(" · ");
}

/** Merge stored settings over the defaults so an added field is never undefined. */
export function hydrateSettings(saved: unknown): TryOnSettings {
  if (!saved || typeof saved !== "object") return { ...DEFAULT_SETTINGS };
  const merged = { ...DEFAULT_SETTINGS, ...(saved as Partial<TryOnSettings>) };
  return requiresHighQuality(merged) ? { ...merged, quality: "high" } : merged;
}
