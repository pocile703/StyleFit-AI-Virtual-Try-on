import { Router } from "express";
import { Outfits } from "../store.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", (req, res) => {
  const outfits = Outfits.find({ userId: req.userId }).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json({ outfits });
});

router.post("/", (req, res) => {
  const { name, resultUrl, personImageUrl, garmentImageUrl } = req.body || {};
  if (!resultUrl) return res.status(400).json({ error: "Nothing to save yet — generate a preview first." });
  const outfit = Outfits.create({
    userId: req.userId,
    name: (name || "Untitled look").trim(),
    resultUrl,
    personImageUrl: personImageUrl || null,
    garmentImageUrl: garmentImageUrl || null,
  });
  res.status(201).json({ outfit });
});

router.delete("/:id", (req, res) => {
  const outfit = Outfits.findById(req.params.id);
  if (!outfit || outfit.userId !== req.userId) {
    return res.status(404).json({ error: "Outfit not found." });
  }
  Outfits.deleteOne({ _id: req.params.id });
  res.json({ ok: true });
});

export default router;
