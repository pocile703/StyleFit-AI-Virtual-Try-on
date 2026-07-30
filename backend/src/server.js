// First import: loads backend/.env before any module reads its config.
import { config, UPLOADS_DIR, GARMENTS_DIR } from "./config.js";
import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import authRoutes from "./routes/auth.js";
import uploadRoutes from "./routes/uploads.js";
import clothingRoutes from "./routes/clothing.js";
import tryonRoutes from "./routes/tryon.js";
import outfitRoutes from "./routes/outfits.js";
import { Clothing, connectStore, storeMode } from "./store.js";
import { storageMode } from "./lib/storage.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// No allowlist configured = reflect any origin, which is what local dev and
// phone-on-the-LAN testing need. Set CORS_ORIGINS to lock it down.
app.use(
  cors(
    config.corsOrigins.length ? { origin: config.corsOrigins } : undefined
  )
);
app.use(express.json({ limit: "2mb" }));

app.use("/uploads", express.static(UPLOADS_DIR));
app.use("/garments", express.static(GARMENTS_DIR));

app.use("/api/auth", authRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/clothing", clothingRoutes);
app.use("/api/tryon", tryonRoutes);
app.use("/api/outfits", outfitRoutes);

// Also the wake-up ping: the frontend calls this on load so a sleeping free-tier
// container is already booting by the time anything actually needs the API.
app.get("/api/health", (_req, res) =>
  res.json({
    ok: true,
    service: "stylefit-api",
    tryonLive: Boolean(config.fashnApiKey),
    signupRequiresInvite: config.signupInviteCodes.length > 0,
  })
);

// Seed the clothing catalog into an empty database.
async function seedCatalog() {
  if ((await Clothing.count()) > 0) return;
  const seedPath = path.join(__dirname, "..", "data", "catalog-seed.json");
  if (!fs.existsSync(seedPath)) return;
  const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));
  await Clothing.insertMany(seed);
  console.log(`Seeded ${seed.length} catalog items`);
}

// The client reads `error` off every failure. Without these two, an unknown
// path or a malformed JSON body returns Express's HTML page and the UI can
// only fall back to "Something went wrong".
app.use((_req, res) => res.status(404).json({ error: "Not found." }));

app.use((err, _req, res, _next) => {
  console.error("unhandled:", err.message);
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "That request couldn't be read." });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "That request was too large." });
  }
  res.status(500).json({ error: "Something went wrong on our end." });
});

// Connect and seed before accepting traffic — a request that arrives mid-connect
// would otherwise fail on a database that is one tick away from being ready.
async function start() {
  await connectStore();
  await seedCatalog();
  app.listen(config.port, () => {
    console.log(
      `StyleFit API running on http://localhost:${config.port}` +
        ` [store: ${storeMode}, images: ${storageMode}]` +
        (config.fashnApiKey ? " (FASHN try-on live)" : " (offline mock try-on)")
    );
  });
}

start().catch((err) => {
  console.error("Failed to start:", err.message);
  process.exit(1);
});
