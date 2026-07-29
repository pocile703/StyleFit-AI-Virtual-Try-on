import { Router } from "express";
import { Clothing } from "../store.js";

const router = Router();

export const CATEGORIES = [
  "T-Shirts",
  "Shirts",
  "Hoodies",
  "Jackets",
  "Pants",
  "Sweaters",
  "Dresses",
  "More",
];

router.get("/", (req, res) => {
  const { category } = req.query;
  const items = category ? Clothing.find({ category }) : Clothing.find();
  res.json({ categories: CATEGORIES, items });
});

export default router;
