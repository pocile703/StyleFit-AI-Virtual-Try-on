# StyleFit AI

Image-based virtual clothing try-on web application.
Independent Project — Diploma in Information Technology, UCSI College.

Upload a personal photo and a clothing image (or pick from the catalog) to generate a virtual outfit preview, compare it against the original with a draggable reveal slider, and save looks to your account.

## Architecture

```
Browser (React / Next.js / Tailwind / Axios)
        │  REST
Express API  (Node.js · port 4000)
  ├── JWT auth (bcrypt-hashed passwords)
  ├── Image uploads (multer → /uploads)
  ├── Clothing catalog (seeded, 8 categories)
  ├── Try-on engine  ← FASHN AI (tryon-v1.6) when FASHN_API_KEY is set;
  │                    offline mock composite (sharp) otherwise
  └── JSON store (data/db.json) ← MongoDB/Mongoose swaps in here later
```

## Run it

### With Docker (recommended — works on any machine)

Only [Docker](https://docs.docker.com/get-docker/) required — no Node install, no
per-machine `npm install`, no cross-platform native-binary issues.

```bash
docker compose up --build
```

Then open **http://localhost:3000**. The API is on **http://localhost:4000**.
Source is mounted for hot-reload; your account/outfits persist in
`backend/data/db.json` between runs. Stop with `Ctrl+C` (or `docker compose down`).

Optional: to activate the real FASHN AI engine or set a JWT secret, copy
`.env.example` to `.env` at the repo root and fill it in — compose reads it
automatically.

> On a phone/tablet on the same Wi-Fi, open `http://<your-computer-ip>:3000`.

### Without Docker

Two terminals (needs Node 20.9+):

```bash
# 1 — API server (http://localhost:4000)
cd backend
npm install
npm run dev

# 2 — Web app (http://localhost:3000)
cd frontend
npm install
npm run dev
```

## Pages

| Route | Purpose |
|---|---|
| `/` | Landing page with animated try-on demo |
| `/try-on` | 3-step wizard: upload photo → select clothing → preview result |
| `/outfits` | Saved looks (requires login) |
| `/profile` | Account details and preferences (requires login) |
| `/login`, `/signup` | Authentication |
| `/about` | Project background, objectives, SDGs |

## Enabling the real AI engine (FASHN)

1. Create an API key at https://app.fashn.ai/api (Create new API key) and buy credits under Billing → FASHN API (1 credit per generated image on tryon-v1.6).
2. `cd backend && cp .env.example .env` and paste the key into `FASHN_API_KEY=`.
3. Restart the backend.

`POST /api/tryon` then runs FASHN's `tryon-v1.6` model (5–17s per image): images are sent as base64 data URIs (catalog SVGs are rasterized to PNG first), the job is polled at `/v1/status/{id}`, and the finished image is downloaded into `uploads/results/` because FASHN's CDN links expire after 72 hours. Without a key, the same endpoint serves the offline sharp composite, so the app works in any environment. All of this lives in `backend/src/routes/tryon.js`.

## Swapping in MongoDB later

`backend/src/store.js` exposes Mongoose-shaped collections (`find`, `findOne`, `create`, `updateOne`, `deleteOne`). Replace the file-backed implementation with real Mongoose models; routes stay unchanged.
