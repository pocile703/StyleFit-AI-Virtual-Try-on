import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Imported first by server.js so the .env file is loaded before any other
// module reads process.env at import time (JWT_SECRET used to be captured
// before the load ran, so a .env value silently never applied).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

try {
  process.loadEnvFile(path.join(ROOT, ".env"));
} catch {
  // No .env — fine in Docker (compose injects env) and in fresh clones.
}

function num(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const UPLOADS_DIR = path.join(ROOT, "uploads");
export const RESULTS_DIR = path.join(UPLOADS_DIR, "results");
export const GARMENTS_DIR = path.join(ROOT, "public", "garments");

// Nothing else creates these, and a missing results/ directory only shows up
// as a write failure at the end of a paid generation.
fs.mkdirSync(RESULTS_DIR, { recursive: true });

export const config = Object.freeze({
  port: num(process.env.PORT, 4000),
  jwtSecret: process.env.JWT_SECRET || "stylefit-dev-secret-change-in-production",

  fashnApiKey: process.env.FASHN_API_KEY || "",

  // Both unset = the zero-setup local stack (JSON file + local uploads dir).
  // Both set = the production stack (Atlas + Cloudinary). See store.js and
  // lib/storage.js — nothing else in the app branches on these.
  mongoUri: process.env.MONGODB_URI || "",
  cloudinaryUrl: process.env.CLOUDINARY_URL || "",

  // Sign-up gate. Empty = anyone can register, which is right locally. In
  // production every generation spends real FASHN credits, so accounts are
  // handed out by code.
  signupInviteCodes: (process.env.SIGNUP_INVITE_CODES || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),

  // Whole-deployment ceiling on generations per UTC day. 0 = off.
  tryonDailyGlobalCap: Number(process.env.TRYON_DAILY_GLOBAL_CAP) || 0,

  // Per-user sliding windows. Try-on costs real credits, so it is the tighter one.
  tryonRateLimit: num(process.env.TRYON_RATE_LIMIT, 20),
  tryonRateWindowMs: num(process.env.TRYON_RATE_WINDOW_MS, 60 * 60 * 1000),
  uploadRateLimit: num(process.env.UPLOAD_RATE_LIMIT, 40),
  uploadRateWindowMs: num(process.env.UPLOAD_RATE_WINDOW_MS, 60 * 60 * 1000),

  // Comma-separated origin allowlist. Empty = reflect any origin, which is what
  // local dev and phone-on-the-LAN testing need.
  corsOrigins: (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
});
