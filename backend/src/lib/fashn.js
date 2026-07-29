import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { config, RESULTS_DIR } from "../config.js";
import { modelFor, MODEL_HIGH, creditCost } from "./tryonSettings.js";

/**
 * FASHN AI client — https://docs.fashn.ai
 *
 * POST /v1/run returns a prediction id; GET /v1/status/:id is polled until it
 * reports completed or failed. The CDN output is scheduled for expiry after
 * three days, so the image is downloaded locally to keep saved outfits alive.
 */

const API_BASE = "https://api.fashn.ai/v1";
const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 120_000;
const SUBMIT_TIMEOUT_MS = 60_000;
const STATUS_TIMEOUT_MS = 20_000;
const RETRY_BACKOFF_MS = 2000;

// FASHN allows 6 concurrent predictions. Staying under it means a burst gets a
// fast, honest "too many right now" instead of an upstream rejection midway.
const MAX_CONCURRENT = 4;
let inFlight = 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * A classified upstream failure. `code` is what the route maps to an HTTP
 * status and what the UI switches on to decide whether retrying can help.
 */
export class FashnError extends Error {
  constructor(code, message, { retryable = false } = {}) {
    super(message);
    this.name = "FashnError";
    this.code = code;
    this.retryable = retryable;
  }
}

const RETRYABLE = new Set(["rate_limit", "upstream"]);

function classify(status, errorName = "") {
  const name = String(errorName).toLowerCase();
  if (name.includes("moderation") || name.includes("nsfw") || name.includes("content")) {
    return "moderation";
  }
  if (name.includes("imageload") || name.includes("image")) return "input_image";
  if (name.includes("unauthorized") || name.includes("apikey")) return "auth";
  if (name.includes("credit") || name.includes("quota") || name.includes("balance")) {
    return "credits";
  }
  if (status === 401 || status === 403) return "auth";
  if (status === 402) return "credits";
  if (status === 429) return "rate_limit";
  if (status >= 500) return "upstream";
  if (status === 400 || status === 422) return "input_image";
  return "upstream";
}

function fail(status, errorName, message) {
  const code = classify(status, errorName);
  return new FashnError(code, message, { retryable: RETRYABLE.has(code) });
}

/**
 * FASHN accepts image URLs or base64 data URIs. Local dev images aren't
 * publicly reachable, so everything is sent inline. SVG catalog art is
 * rasterized first — the model expects photographic formats.
 */
export async function toDataUri(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".svg") {
    const png = await sharp(filePath, { density: 300 })
      .resize({ width: 1024, fit: "inside" })
      .flatten({ background: "#ffffff" })
      .png()
      .toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  }
  const mime =
    ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
  return `data:${mime};base64,${(await fs.promises.readFile(filePath)).toString("base64")}`;
}

/** tryon-max has no fit or background parameter — both live in the prompt. */
function buildPrompt(settings) {
  const parts = [];
  if (settings.fit === "relaxed") parts.push("relaxed, loose fit with natural draping");
  if (settings.fit === "slim") parts.push("slim, tailored fit close to the body");
  if (settings.background === "studio") {
    parts.push("place the person against a clean, evenly lit neutral studio backdrop");
  }
  if (settings.stylingNote) parts.push(settings.stylingNote);
  return parts.join(". ");
}

function buildInputs(settings, personUri, garmentUri) {
  if (modelFor(settings) === MODEL_HIGH) {
    return {
      model_image: personUri,
      product_image: garmentUri,
      prompt: buildPrompt(settings),
      resolution: "2k",
      generation_mode: "balanced",
      output_format: settings.outputFormat,
    };
  }
  return {
    model_image: personUri,
    garment_image: garmentUri,
    category: settings.garmentType,
    garment_photo_type: settings.photoType,
    segmentation_free: settings.preserveShape,
    mode: "balanced",
    output_format: settings.outputFormat,
  };
}

async function postJson(url, body, timeoutMs) {
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.fashnApiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      throw new FashnError("timeout", "FASHN request timed out", { retryable: true });
    }
    throw new FashnError("upstream", `FASHN unreachable: ${err.message}`, { retryable: true });
  }
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

async function submit(settings, personUri, garmentUri) {
  const model = modelFor(settings);
  const { res, json } = await postJson(
    `${API_BASE}/run`,
    { model_name: model, inputs: buildInputs(settings, personUri, garmentUri) },
    SUBMIT_TIMEOUT_MS
  );

  // API-level failures come back as { error: "<name>", message: "<detail>" }.
  if (!res.ok || json.error || !json.id) {
    const errorName = typeof json.error === "string" ? json.error : json.error?.name;
    throw fail(
      res.status,
      errorName,
      `FASHN run failed (${res.status}): ${json.message || errorName || "unknown error"}`
    );
  }
  return json.id;
}

async function poll(id) {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    let res;
    try {
      res = await fetch(`${API_BASE}/status/${id}`, {
        headers: { Authorization: `Bearer ${config.fashnApiKey}` },
        signal: AbortSignal.timeout(STATUS_TIMEOUT_MS),
      });
    } catch {
      // A dropped or slow poll isn't fatal — the prediction is still running.
      await sleep(POLL_INTERVAL_MS);
      continue;
    }

    if (res.status === 401 || res.status === 403) {
      throw fail(res.status, "UnauthorizedAccess", "FASHN rejected the API key while polling");
    }
    if (!res.ok) {
      await sleep(POLL_INTERVAL_MS);
      continue;
    }

    const status = await res.json().catch(() => ({}));
    if (status.status === "completed") {
      const output = status.output?.[0];
      if (!output) {
        throw new FashnError("upstream", "FASHN completed without an output image");
      }
      return output;
    }
    if (status.status === "failed") {
      const errorName = status.error?.name || "";
      throw fail(
        200,
        errorName,
        `FASHN generation failed: ${errorName} ${status.error?.message || ""}`.trim()
      );
    }
    // starting / in_queue / processing — keep waiting.
    await sleep(POLL_INTERVAL_MS);
  }
  throw new FashnError("timeout", "FASHN generation timed out", { retryable: true });
}

async function download(outputUrl, outputFormat) {
  let img;
  try {
    img = await fetch(outputUrl, { signal: AbortSignal.timeout(STATUS_TIMEOUT_MS) });
  } catch (err) {
    throw new FashnError("upstream", `FASHN output download failed: ${err.message}`, {
      retryable: true,
    });
  }
  if (!img.ok) {
    throw new FashnError("upstream", `FASHN output download failed: ${img.status}`, {
      retryable: true,
    });
  }
  const ext = outputFormat === "jpeg" ? "jpg" : "png";
  const outName = `${crypto.randomUUID()}.${ext}`;
  await fs.promises.writeFile(
    path.join(RESULTS_DIR, outName),
    Buffer.from(await img.arrayBuffer())
  );
  return `/uploads/results/${outName}`;
}

async function runOnce(settings, personPath, garmentPath) {
  const [personUri, garmentUri] = await Promise.all([
    toDataUri(personPath),
    toDataUri(garmentPath),
  ]);
  const id = await submit(settings, personUri, garmentUri);
  const outputUrl = await poll(id);
  return download(outputUrl, settings.outputFormat);
}

export function isConfigured() {
  return Boolean(config.fashnApiKey);
}

/**
 * Run one try-on. Retries once on a transient failure only — retrying an
 * out-of-credits or moderation-blocked request just spends time it can't fix,
 * and a retried generation that does succeed costs another credit.
 */
export async function runTryOn({ settings, personPath, garmentPath }) {
  if (inFlight >= MAX_CONCURRENT) {
    throw new FashnError("rate_limit", "Too many try-ons in flight", { retryable: true });
  }
  inFlight += 1;
  try {
    try {
      const resultUrl = await runOnce(settings, personPath, garmentPath);
      return { resultUrl, model: modelFor(settings), credits: creditCost(settings) };
    } catch (err) {
      if (!(err instanceof FashnError) || !err.retryable) throw err;
      console.warn(`FASHN transient failure (${err.code}), retrying once:`, err.message);
      await sleep(RETRY_BACKOFF_MS);
      const resultUrl = await runOnce(settings, personPath, garmentPath);
      return { resultUrl, model: modelFor(settings), credits: creditCost(settings) };
    }
  } finally {
    inFlight -= 1;
  }
}
