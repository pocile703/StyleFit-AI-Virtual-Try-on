// Image storage, chosen at boot by whether CLOUDINARY_URL is set.
//
//   unset -> backend/uploads/ on local disk, served by the /uploads static
//            mount. Zero setup, and what local development uses.
//   set   -> Cloudinary. Required in production: a free-tier container has an
//            ephemeral filesystem, so every restart would take every uploaded
//            photo and every saved result with it.
//
// Everything that touches an image goes through here — routes/uploads.js,
// routes/tryon.js and lib/fashn.js — so neither of them knows which is running.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import { config, UPLOADS_DIR, RESULTS_DIR, GARMENTS_DIR } from "../config.js";

const FETCH_TIMEOUT_MS = 20_000;

// cloudinary://<key>:<secret>@<cloud-name>
function cloudNameFrom(url) {
  try {
    return new URL(url).hostname || "";
  } catch {
    return "";
  }
}

const CLOUD_NAME = config.cloudinaryUrl ? cloudNameFrom(config.cloudinaryUrl) : "";
const useCloudinary = Boolean(CLOUD_NAME);

if (useCloudinary) {
  // The SDK reads CLOUDINARY_URL from the environment itself; being explicit
  // keeps it working if the value ever comes from somewhere other than env.
  const parsed = new URL(config.cloudinaryUrl);
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: decodeURIComponent(parsed.username),
    api_secret: decodeURIComponent(parsed.password),
    secure: true,
  });
}

export const storageMode = useCloudinary ? "cloudinary" : "disk";

const CLOUDINARY_PREFIX = CLOUD_NAME ? `https://res.cloudinary.com/${CLOUD_NAME}/` : null;

/**
 * Whether a URL is one this app produced and is therefore safe to fetch, hand
 * to the try-on provider, or store on a user record.
 *
 * This is a security boundary, not a convenience check. Every image URL in a
 * request body is attacker-controlled: without it, `POST /api/tryon` would
 * fetch any URL the caller names (SSRF against cloud metadata endpoints and
 * anything else reachable from the container) and would spend FASHN credits on
 * arbitrary third-party images.
 */
export function isOwnedUrl(url) {
  if (typeof url !== "string" || !url) return false;
  const clean = url.split("?")[0];

  if (clean.startsWith("/uploads/") || clean.startsWith("/garments/")) {
    // Path traversal is defused by taking the basename when resolving, but a
    // name that resolves to nothing is still not a real reference.
    const name = path.basename(clean);
    return Boolean(name) && name !== "." && name !== "..";
  }
  if (CLOUDINARY_PREFIX && clean.startsWith(CLOUDINARY_PREFIX)) return true;
  return false;
}

/** The file extension a URL implies, lowercased and dot-prefixed. */
export function extOf(url) {
  return path.extname(String(url).split("?")[0]).toLowerCase();
}

// Local-disk location for an app-relative path. basename() strips traversal.
function diskPath(url) {
  const clean = url.split("?")[0];
  const name = path.basename(clean);
  if (clean.startsWith("/uploads/results/")) return path.join(RESULTS_DIR, name);
  if (clean.startsWith("/uploads/")) return path.join(UPLOADS_DIR, name);
  if (clean.startsWith("/garments/")) return path.join(GARMENTS_DIR, name);
  return null;
}

/**
 * Read an image this app owns. Throws if the URL is not ours or the bytes
 * aren't there — callers turn that into the same "upload it again" 400 the
 * old filesystem check produced.
 */
export async function readImage(url) {
  if (!isOwnedUrl(url)) throw new Error("Refusing to read a URL this app does not own");

  // Garments are committed files shipped inside the container, so they are on
  // disk in both modes.
  const local = diskPath(url);
  if (local) return fs.promises.readFile(local);

  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

const CLOUD_FOLDER = { upload: "stylefit/uploads", result: "stylefit/results" };

function uploadToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => (err ? reject(err) : resolve(result.secure_url))
    );
    stream.end(buffer);
  });
}

/**
 * Store an image and return the URL the client should use — an app-relative
 * `/uploads/...` path on disk, an absolute Cloudinary URL in production. The
 * frontend's `imageUrl()` already handles both.
 */
export async function putImage(buffer, { ext = ".jpg", kind = "upload" } = {}) {
  if (useCloudinary) return uploadToCloudinary(buffer, CLOUD_FOLDER[kind] ?? CLOUD_FOLDER.upload);

  const dir = kind === "result" ? RESULTS_DIR : UPLOADS_DIR;
  const name = `${crypto.randomUUID()}${ext.startsWith(".") ? ext : `.${ext}`}`;
  await fs.promises.writeFile(path.join(dir, name), buffer);
  return kind === "result" ? `/uploads/results/${name}` : `/uploads/${name}`;
}
