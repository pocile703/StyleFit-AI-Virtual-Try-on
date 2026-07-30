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

/**
 * Parse `cloudinary://<api-key>:<api-secret>@<cloud-name>`.
 *
 * This has to happen here, in the first module the server imports, because the
 * Cloudinary SDK parses the same variable while its own module is being
 * imported — and on a malformed value it throws a bare ERR_INVALID_URL from
 * inside node's URL parser. The process dies at boot pointing at a stack frame
 * that says nothing about which variable is wrong. Dropping the @<cloud-name>
 * suffix while copying the value is an easy mistake and should not cost an
 * afternoon to diagnose.
 */
function parseCloudinaryUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "cloudinary:") return null;
  const parsed = {
    cloudName: url.hostname,
    apiKey: decodeURIComponent(url.username),
    apiSecret: decodeURIComponent(url.password),
  };
  return parsed.cloudName && parsed.apiKey && parsed.apiSecret ? parsed : null;
}

const cloudinaryUrl = process.env.CLOUDINARY_URL || "";
const cloudinaryCredentials = cloudinaryUrl ? parseCloudinaryUrl(cloudinaryUrl) : null;

if (cloudinaryUrl && !cloudinaryCredentials) {
  // Silently falling back to local disk would be worse than stopping: on a host
  // with an ephemeral filesystem it appears to work until the first restart
  // eats every uploaded photo — the exact failure Cloudinary is here to prevent.
  throw new Error(
    "CLOUDINARY_URL is malformed. Expected cloudinary://<api-key>:<api-secret>@<cloud-name>" +
      " — check the @<cloud-name> suffix is present."
  );
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
  // Null unless CLOUDINARY_URL is set and well-formed; validated above.
  cloudinary: cloudinaryCredentials,

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
