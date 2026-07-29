import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Optional .env (FASHN_API_KEY, PORT, JWT_SECRET) — absent in fresh clones.
try {
  process.loadEnvFile(new URL("../.env", import.meta.url).pathname);
} catch {}
import authRoutes from "./routes/auth.js";
import uploadRoutes from "./routes/uploads.js";
import clothingRoutes from "./routes/clothing.js";
import tryonRoutes from "./routes/tryon.js";
import outfitRoutes from "./routes/outfits.js";
import { Clothing } from "./store.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
app.use("/garments", express.static(path.join(__dirname, "..", "public", "garments")));

app.use("/api/auth", authRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/clothing", clothingRoutes);
app.use("/api/tryon", tryonRoutes);
app.use("/api/outfits", outfitRoutes);

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "stylefit-api" }));

// Seed the clothing catalog on first boot.
if (Clothing.count() === 0) {
  const seedPath = path.join(__dirname, "..", "data", "catalog-seed.json");
  if (fs.existsSync(seedPath)) {
    const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));
    Clothing.insertMany(seed);
    console.log(`Seeded ${seed.length} catalog items`);
  }
}

app.listen(PORT, () => {
  console.log(`StyleFit API running on http://localhost:${PORT}`);
});
