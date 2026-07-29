import jwt from "jsonwebtoken";
import { config } from "../config.js";

// Read through config, not process.env — env is loaded there at import time,
// which is what makes a JWT_SECRET in backend/.env actually take effect.
export const JWT_SECRET = config.jwtSecret;

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Sign in to continue." });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: "Session expired. Sign in again." });
  }
}
