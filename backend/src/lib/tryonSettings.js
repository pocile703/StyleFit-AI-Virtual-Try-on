/**
 * Try-on settings: the single source of truth for what the client may ask for.
 *
 * The two FASHN models expose disjoint parameter sets, so each setting is real
 * on exactly one tier:
 *   standard -> tryon-v1.6  (garment_photo_type, category, segmentation_free)
 *   high     -> tryon-max   (fit + background + styling note, via `prompt`)
 *
 * Anything the picked tier can't express is dropped rather than faked. Choosing
 * a high-only option upgrades the tier — mirrored in the UI so the credit cost
 * is never a surprise.
 */

export const MODEL_STANDARD = "tryon-v1.6";
export const MODEL_HIGH = "tryon-max";

const ENUMS = {
  quality: ["standard", "high"],
  photoType: ["auto", "model", "flat-lay"],
  fit: ["relaxed", "regular", "slim"],
  background: ["original", "studio"],
  garmentType: ["auto", "tops", "bottoms", "one-pieces"],
  outputFormat: ["png", "jpeg"],
};

export const DEFAULT_SETTINGS = Object.freeze({
  quality: "standard",
  photoType: "auto",
  fit: "regular",
  background: "original",
  garmentType: "auto",
  preserveShape: true,
  stylingNote: "",
  outputFormat: "png",
});

const STYLING_NOTE_MAX = 120;

function pickEnum(key, value) {
  return ENUMS[key].includes(value) ? value : DEFAULT_SETTINGS[key];
}

/** True when the request needs tryon-max — v1.6 has no fit or background control. */
export function requiresHighQuality(s) {
  return s.fit !== "regular" || s.background !== "original" || Boolean(s.stylingNote);
}

/**
 * Whitelist and default an untrusted settings object. Invalid values fall back
 * to their default instead of erroring — a stale client shouldn't be able to
 * break a flow the user is halfway through.
 */
export function normalizeSettings(raw) {
  const input = raw && typeof raw === "object" ? raw : {};

  const settings = {
    quality: pickEnum("quality", input.quality),
    photoType: pickEnum("photoType", input.photoType),
    fit: pickEnum("fit", input.fit),
    background: pickEnum("background", input.background),
    garmentType: pickEnum("garmentType", input.garmentType),
    preserveShape:
      typeof input.preserveShape === "boolean"
        ? input.preserveShape
        : DEFAULT_SETTINGS.preserveShape,
    stylingNote:
      typeof input.stylingNote === "string"
        ? input.stylingNote.trim().slice(0, STYLING_NOTE_MAX)
        : "",
    outputFormat: pickEnum("outputFormat", input.outputFormat),
  };

  if (requiresHighQuality(settings)) settings.quality = "high";

  // Drop what the resolved tier can't act on, so the echoed settings describe
  // what actually happened rather than what was asked for.
  if (settings.quality === "high") {
    settings.photoType = DEFAULT_SETTINGS.photoType;
    settings.garmentType = DEFAULT_SETTINGS.garmentType;
    settings.preserveShape = DEFAULT_SETTINGS.preserveShape;
  } else {
    settings.stylingNote = "";
  }

  return settings;
}

export function modelFor(settings) {
  return settings.quality === "high" ? MODEL_HIGH : MODEL_STANDARD;
}

/** Credits FASHN bills for one output image at these settings. */
export function creditCost(settings) {
  // tryon-max at 2k/balanced = 3; tryon-v1.6 = 1 flat.
  return settings.quality === "high" ? 3 : 1;
}
