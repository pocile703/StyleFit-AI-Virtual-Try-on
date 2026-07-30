import { Router } from "express";
import sharp from "sharp";
import { config } from "../config.js";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { dailyCap } from "../middleware/dailyCap.js";
import { route } from "../lib/asyncRoute.js";
import { isOwnedUrl, readImage, extOf, putImage } from "../lib/storage.js";
import { normalizeSettings, modelFor, creditCost } from "../lib/tryonSettings.js";
import { runTryOn, isConfigured, FashnError } from "../lib/fashn.js";

const POLL_SIMULATED_MS = 2200;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch an image named in the request body. `isOwnedUrl` is the gate: image
 * URLs arrive from the client, so without it this endpoint would fetch
 * whatever address a caller supplied.
 */
async function loadImage(url) {
  if (!isOwnedUrl(url)) return null;
  try {
    return { buffer: await readImage(url), ext: extOf(url) };
  } catch {
    return null;
  }
}

// Offline fallback when no FASHN_API_KEY is configured: sharp composite of
// the garment onto the torso area, with simulated latency, so the full flow
// stays demoable without API credits.
async function generateWithMock(person, garment) {
  const base = sharp(person.buffer).rotate(); // respect EXIF orientation
  const meta = await base.metadata();
  const width = meta.width ?? 800;
  const height = meta.height ?? 1000;

  const garmentWidth = Math.round(width * 0.56);
  const overlay = await sharp(garment.buffer, { density: 300 })
    .resize({ width: garmentWidth })
    .png()
    .toBuffer();
  const overlayMeta = await sharp(overlay).metadata();

  const left = Math.round((width - garmentWidth) / 2);
  const top = Math.min(
    Math.round(height * 0.3),
    Math.max(0, height - (overlayMeta.height ?? 0))
  );

  const [composited] = await Promise.all([
    base.composite([{ input: overlay, left, top }]).png().toBuffer(),
    sleep(POLL_SIMULATED_MS),
  ]);
  return putImage(composited, { ext: ".png", kind: "result" });
}

/** Shopper-facing copy per failure cause, with the HTTP status to send. */
const FAILURES = {
  input_image: [
    422,
    "That photo couldn't be read. A clear, front-facing full-body shot works best.",
  ],
  moderation: [
    422,
    "That image was blocked by the try-on provider's content filter. Try a different photo or garment.",
  ],
  credits: [503, "The AI try-on service is out of credits right now. Try again later."],
  auth: [503, "The AI try-on service isn't configured correctly right now."],
  rate_limit: [429, "Too many try-ons at once. Give it a minute and try again."],
  timeout: [504, "The try-on took too long. Try again — it usually works second time."],
  upstream: [
    502,
    "The AI try-on service couldn't finish this one. Try a clearer photo, or try again in a moment.",
  ],
};

const router = Router();

router.post(
  "/",
  requireAuth,
  rateLimit({
    limit: config.tryonRateLimit,
    windowMs: config.tryonRateWindowMs,
    message: "You've hit the try-on limit for now. Try again a bit later.",
  }),
  dailyCap(),
  route(async (req, res) => {
    const { personImageUrl, garmentImageUrl } = req.body || {};
    const settings = normalizeSettings(req.body?.settings);

    if (!personImageUrl || !garmentImageUrl) {
      return res
        .status(400)
        .json({ error: "Both a photo and a clothing image are required.", code: "notfound" });
    }

    const [person, garment] = await Promise.all([
      loadImage(personImageUrl),
      loadImage(garmentImageUrl),
    ]);
    if (!person || !garment) {
      return res
        .status(400)
        .json({ error: "Image not found. Upload it again.", code: "notfound" });
    }

    const useFashn = isConfigured();

    try {
      if (!useFashn) {
        const resultUrl = await generateWithMock(person, garment);
        return res.json({
          resultUrl,
          engine: "mock-composite",
          model: "mock-composite",
          credits: 0,
          settings,
        });
      }

      const { resultUrl, model, credits } = await runTryOn({ settings, person, garment });
      return res.json({ resultUrl, engine: model, model, credits, settings });
    } catch (err) {
      console.error("try-on failed:", err.code || "", err.message);

      if (!useFashn) {
        return res.status(502).json({
          error: "Preview generation failed. Try a different image.",
          code: "upstream",
        });
      }

      const code = err instanceof FashnError ? err.code : "upstream";
      const [status, message] = FAILURES[code] || FAILURES.upstream;
      return res.status(status).json({
        error: message,
        code,
        // A failure before the model ran costs nothing; the client says so
        // rather than leaving the user guessing about their credits.
        creditsSpent: 0,
      });
    }
  })
);

/**
 * Whether the live engine is on. The settings panel only shows credit costs
 * when they're real — quoting "3 credits" against the offline mock would be a
 * lie, and there's no way to know from the client otherwise.
 */
router.get("/engine", (_req, res) => {
  res.json({
    live: isConfigured(),
    models: isConfigured()
      ? { standard: modelFor({ quality: "standard" }), high: modelFor({ quality: "high" }) }
      : null,
    credits: isConfigured()
      ? { standard: creditCost({ quality: "standard" }), high: creditCost({ quality: "high" }) }
      : { standard: 0, high: 0 },
  });
});

export default router;
