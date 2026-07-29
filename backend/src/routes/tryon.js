import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads");
const GARMENTS_DIR = path.join(__dirname, "..", "..", "public", "garments");
const RESULTS_DIR = path.join(UPLOADS_DIR, "results");

const FASHN_API_BASE = "https://api.fashn.ai/v1";
const FASHN_MODEL = "tryon-v1.6";
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 90_000;

// Map an image URL from our own API (/uploads/... or /garments/...) back to disk.
// basename() strips any path traversal.
function resolveLocal(url) {
  if (typeof url !== "string") return null;
  const clean = url.split("?")[0];
  const name = path.basename(clean);
  if (clean.startsWith("/uploads/results/")) return path.join(RESULTS_DIR, name);
  if (clean.startsWith("/uploads/")) return path.join(UPLOADS_DIR, name);
  if (clean.startsWith("/garments/")) return path.join(GARMENTS_DIR, name);
  return null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// FASHN accepts image URLs or base64 data URIs. Local dev images aren't
// publicly reachable, so everything is sent as a data URI. SVG catalog art
// is rasterized to PNG first — the model expects photographic formats.
async function toDataUri(filePath) {
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
  return `data:${mime};base64,${fs.readFileSync(filePath).toString("base64")}`;
}

/**
 * FASHN AI try-on engine (https://docs.fashn.ai).
 * POST /v1/run with model + garment images, then poll /v1/status/{id}
 * until completed. The CDN output expires after 72h, so the result is
 * downloaded into uploads/results/ to keep saved outfits permanent.
 */
async function generateWithFashn(personPath, garmentPath) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.FASHN_API_KEY}`,
  };

  const runRes = await fetch(`${FASHN_API_BASE}/run`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model_name: FASHN_MODEL,
      inputs: {
        model_image: await toDataUri(personPath),
        garment_image: await toDataUri(garmentPath),
        category: "auto",
      },
    }),
  });
  const run = await runRes.json();
  if (!runRes.ok || run.error) {
    throw new Error(`FASHN run failed: ${JSON.stringify(run.error || run)}`);
  }

  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);
    const statusRes = await fetch(`${FASHN_API_BASE}/status/${run.id}`, { headers });
    const status = await statusRes.json();
    if (status.status === "completed") {
      const outputUrl = status.output?.[0];
      if (!outputUrl) throw new Error("FASHN completed without an output image");
      const img = await fetch(outputUrl);
      if (!img.ok) throw new Error(`FASHN output download failed: ${img.status}`);
      const outName = `${crypto.randomUUID()}.png`;
      fs.writeFileSync(
        path.join(RESULTS_DIR, outName),
        Buffer.from(await img.arrayBuffer())
      );
      return `/uploads/results/${outName}`;
    }
    if (status.status === "failed") {
      throw new Error(`FASHN generation failed: ${JSON.stringify(status.error)}`);
    }
    // starting / in_queue / processing — keep polling
  }
  throw new Error("FASHN generation timed out");
}

// Offline fallback when no FASHN_API_KEY is configured: sharp composite of
// the garment onto the torso area, with simulated latency, so the full flow
// stays demoable without API credits.
async function generateWithMock(personPath, garmentPath) {
  const person = sharp(personPath).rotate(); // respect EXIF orientation
  const meta = await person.metadata();
  const width = meta.width ?? 800;
  const height = meta.height ?? 1000;

  const garmentWidth = Math.round(width * 0.56);
  const garment = await sharp(garmentPath, { density: 300 })
    .resize({ width: garmentWidth })
    .png()
    .toBuffer();
  const garmentMeta = await sharp(garment).metadata();

  const left = Math.round((width - garmentWidth) / 2);
  const top = Math.min(
    Math.round(height * 0.3),
    Math.max(0, height - (garmentMeta.height ?? 0))
  );

  const outName = `${crypto.randomUUID()}.png`;
  const [resultUrl] = await Promise.all([
    person
      .composite([{ input: garment, left, top }])
      .png()
      .toFile(path.join(RESULTS_DIR, outName))
      .then(() => `/uploads/results/${outName}`),
    sleep(2200),
  ]);
  return resultUrl;
}

const router = Router();

router.post("/", async (req, res) => {
  const { personImageUrl, garmentImageUrl } = req.body || {};
  const personPath = resolveLocal(personImageUrl);
  const garmentPath = resolveLocal(garmentImageUrl);
  if (!personPath || !garmentPath) {
    return res.status(400).json({ error: "Both a photo and a clothing image are required." });
  }
  if (!fs.existsSync(personPath) || !fs.existsSync(garmentPath)) {
    return res.status(400).json({ error: "Image not found. Upload it again." });
  }

  const useFashn = Boolean(process.env.FASHN_API_KEY);
  try {
    const resultUrl = useFashn
      ? await generateWithFashn(personPath, garmentPath)
      : await generateWithMock(personPath, garmentPath);
    res.json({ resultUrl, engine: useFashn ? FASHN_MODEL : "mock-composite" });
  } catch (err) {
    console.error("try-on failed:", err.message);
    res.status(502).json({
      error: useFashn
        ? "The AI try-on service couldn't process this image. Try a clearer photo, or check the API key and credits."
        : "Preview generation failed. Try a different image.",
    });
  }
});

export default router;
