import { Router } from "express";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { config, UPLOADS_DIR } from "../config.js";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
// sharp's format names -> the extension we store the file under.
const EXT_BY_FORMAT = { jpeg: ".jpg", png: ".png", webp: ".webp" };
const MIN_EDGE_PX = 256;

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  // Temporary name only: the real extension comes from the decoded image, not
  // from the client's filename. Everything under uploads/ is publicly served,
  // so a client-chosen extension there is not something to trust.
  filename: (_req, _file, cb) => cb(null, `${crypto.randomUUID()}.upload`),
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) return cb(null, true);
    cb(new Error("Only JPG, PNG or WebP images up to 10MB."));
  },
});

const router = Router();

async function discard(filePath) {
  await fs.promises.unlink(filePath).catch(() => {});
}

// Generic image upload (user photo or custom garment). Returns a URL served
// from this API's /uploads static mount — same contract Cloudinary will fill later.
router.post(
  "/photo",
  requireAuth,
  rateLimit({
    limit: config.uploadRateLimit,
    windowMs: config.uploadRateWindowMs,
    message: "That's a lot of uploads. Give it a minute and try again.",
  }),
  (req, res) => {
    upload.single("image")(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message });
      if (!req.file) return res.status(400).json({ error: "No image received." });

      const tempPath = req.file.path;
      try {
        // The declared MIME type is just a claim. Decode the file to confirm
        // it really is an image, and take the format from what sharp reads.
        const meta = await sharp(tempPath).metadata();
        const ext = EXT_BY_FORMAT[meta.format];
        if (!ext) {
          await discard(tempPath);
          return res.status(400).json({ error: "Only JPG, PNG or WebP images up to 10MB." });
        }
        if ((meta.width ?? 0) < MIN_EDGE_PX || (meta.height ?? 0) < MIN_EDGE_PX) {
          await discard(tempPath);
          return res.status(400).json({
            error: `That image is too small. Use one at least ${MIN_EDGE_PX}px on each side.`,
          });
        }

        const finalName = `${path.basename(tempPath, ".upload")}${ext}`;
        await fs.promises.rename(tempPath, path.join(UPLOADS_DIR, finalName));
        res.status(201).json({ url: `/uploads/${finalName}` });
      } catch {
        await discard(tempPath);
        res.status(400).json({ error: "That file isn't a readable image. Try another." });
      }
    });
  }
);

export default router;
