import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Users } from "../store.js";
import { JWT_SECRET, requireAuth } from "../middleware/auth.js";
import { normalizeBody, EMPTY_BODY } from "../lib/body.js";

// Preferences the client may set. Without this every key it sends is stored.
const PREFERENCE_KEYS = ["bodyType", "skinTone", "units", "theme"];

const router = Router();

function publicUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

function issueToken(user) {
  return jwt.sign({ sub: user._id }, JWT_SECRET, { expiresIn: "7d" });
}

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  if (Users.findOne({ email: normalizedEmail })) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }
  const user = Users.create({
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash: await bcrypt.hash(password, 10),
    preferences: { bodyType: "", skinTone: "", units: "Metric (cm)", theme: "Light" },
    body: { ...EMPTY_BODY },
  });
  res.status(201).json({ token: issueToken(user), user: publicUser(user) });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  const user = Users.findOne({ email: String(email).trim().toLowerCase() });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Email or password is incorrect." });
  }
  res.json({ token: issueToken(user), user: publicUser(user) });
});

router.get("/me", requireAuth, (req, res) => {
  const user = Users.findById(req.userId);
  if (!user) return res.status(404).json({ error: "Account not found." });
  res.json({ user: publicUser(user) });
});

router.patch("/me", requireAuth, (req, res) => {
  const user = Users.findById(req.userId);
  if (!user) return res.status(404).json({ error: "Account not found." });
  const { name, preferences, avatarUrl, body } = req.body || {};
  const changes = {};
  let rejected = [];
  if (typeof name === "string" && name.trim()) changes.name = name.trim();
  if (preferences && typeof preferences === "object") {
    const allowed = {};
    for (const key of PREFERENCE_KEYS) {
      if (key in preferences) allowed[key] = preferences[key];
    }
    changes.preferences = { ...user.preferences, ...allowed };
  }
  if (body && typeof body === "object") {
    const result = normalizeBody(body, user.body);
    changes.body = result.body;
    rejected = result.rejected;
  }
  // Only accept avatars that came through our own upload endpoint.
  if (typeof avatarUrl === "string" && avatarUrl.startsWith("/uploads/")) {
    changes.avatarUrl = avatarUrl;
  } else if (avatarUrl === null) {
    changes.avatarUrl = null;
  }
  const updated = Users.updateOne({ _id: req.userId }, changes);
  // Out-of-range measurements keep their previous value; name them so the UI
  // can say which field was ignored instead of silently reverting it.
  res.json({ user: publicUser(updated), rejected });
});

export default router;
