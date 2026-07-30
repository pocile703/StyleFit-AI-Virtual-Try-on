import { Router } from "express";
import { route } from "../lib/asyncRoute.js";
import { Outfits } from "../store.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", route(async (req, res) => {
  const outfits = (await Outfits.find({ userId: req.userId })).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json({ outfits });
}));

router.post("/", route(async (req, res) => {
  const { name, resultUrl, personImageUrl, garmentImageUrl } = req.body || {};
  if (!resultUrl) return res.status(400).json({ error: "Nothing to save yet — generate a preview first." });
  const outfit = await Outfits.create({
    userId: req.userId,
    name: (name || "Untitled look").trim(),
    resultUrl,
    personImageUrl: personImageUrl || null,
    garmentImageUrl: garmentImageUrl || null,
  });
  res.status(201).json({ outfit });
}));

const NAME_MAX = 60;

router.patch("/:id", route(async (req, res) => {
  const outfit = await Outfits.findById(req.params.id);
  // Same masking as delete: someone else's outfit is simply not found.
  if (!outfit || outfit.userId !== req.userId) {
    return res.status(404).json({ error: "Outfit not found." });
  }
  const { name } = req.body || {};
  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Give this look a name." });
  }
  const updated = await Outfits.updateOne(
    { _id: req.params.id },
    { name: name.trim().slice(0, NAME_MAX) }
  );
  res.json({ outfit: updated });
}));

router.delete("/:id", route(async (req, res) => {
  const outfit = await Outfits.findById(req.params.id);
  if (!outfit || outfit.userId !== req.userId) {
    return res.status(404).json({ error: "Outfit not found." });
  }
  await Outfits.deleteOne({ _id: req.params.id });
  res.json({ ok: true });
}));

export default router;
