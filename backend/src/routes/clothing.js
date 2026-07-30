import { Router } from "express";
import { Clothing } from "../store.js";

const router = Router();

// Canonical display order. The catalog is a curated set of real garments, so
// several of these are empty — the response only names the ones that actually
// have items, otherwise the picker renders tabs that lead nowhere.
export const CATEGORIES = [
  "T-Shirts",
  "Shirts",
  "Hoodies",
  "Jackets",
  "Pants",
  "Sweaters",
  "Dresses",
  "Skirts",
  "More",
];

router.get("/", async (req, res) => {
  const { category } = req.query;
  const all = await Clothing.find();
  const present = new Set(all.map((item) => item.category));
  const items = category ? all.filter((item) => item.category === category) : all;
  res.json({ categories: CATEGORIES.filter((c) => present.has(c)), items });
});

export default router;
