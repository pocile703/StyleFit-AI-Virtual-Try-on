# StyleFit AI

Image-based virtual clothing try-on web application.
Independent Project — Diploma in Information Technology, UCSI College.

Upload a personal photo and a clothing image (or pick from the catalog) to generate a virtual outfit preview, compare it against the original with a draggable reveal slider, and save looks to your account.

## Architecture

```
Browser (React 19 / Next.js 16 / Tailwind v4 / Axios)
        │  REST
Express API  (Node.js · port 4000)
  ├── JWT auth (bcrypt-hashed passwords)
  ├── Image uploads (multer → /uploads, decoded and re-typed by sharp)
  ├── Clothing catalog (seeded, 8 categories, 28 items)
  ├── Try-on engine  ← FASHN AI when FASHN_API_KEY is set;
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
`.env.example` to `.env` **at the repo root** and fill it in — compose reads it
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

Running this way, the API key goes in `backend/.env` instead of the repo-root one.

## Pages

| Route | Purpose |
|---|---|
| `/` | Landing page — a self-playing before/after comparison of real try-on results |
| `/try-on` | 3-step wizard: upload photo → select clothing → preview result |
| `/outfits` | Saved looks — compare, enlarge, download, rename (requires login) |
| `/profile` | Account details, body measurements and size estimate (requires login) |
| `/login`, `/signup` | Authentication |
| `/about` | Project background, objectives, SDGs |

## Features

**Try-on settings.** A collapsed panel above the Generate button exposes photo type, garment fit, background and image quality in plain English. Defaults are chosen so most people never open it. Every control maps to a real API parameter — nothing decorative.

**Size estimate.** Height, weight, gender and preferred fit on the profile produce a recommended shirt and trouser size plus estimated chest, waist, hip, inseam and shoulder measurements, with a confidence indicator reflecting how much of the profile was filled in. These are estimates from published size-chart ranges, clearly labelled as such — not measurements.

**Saved outfits.** Each saved look keeps the photo that went in alongside the result, so the before/after comparison survives the save. Cards offer an inline comparison, a full-screen viewer, download, and rename. Looks saved without an original photo simply don't offer the comparison.

## Enabling the real AI engine (FASHN)

1. Create an API key at https://app.fashn.ai/api and buy credits under Billing → FASHN API.
2. Put it in `FASHN_API_KEY=` in the repo-root `.env` (Docker) or `backend/.env` (bare metal).
3. Restart the backend.

Two models sit behind the **Image quality** switch, because they expose different parameters:

| Quality | Model | Credits | Controls it supports |
|---|---|---|---|
| Standard | `tryon-v1.6` | 1 | photo type, garment category, body-shape handling |
| High | `tryon-max` (2k, balanced) | 3 | garment fit, background, styling note |

Choosing an option only the High tier can express moves the request to it rather than ignoring the option, and the UI says so before spending the credits.

Images are sent as base64 data URIs (catalog SVGs are rasterized to PNG first), the job is polled at `/v1/status/{id}`, and the finished image is downloaded into `uploads/results/` because FASHN's CDN links expire after three days. Without a key the same endpoint serves the offline sharp composite, so the app works in any environment.

The client lives in `backend/src/lib/fashn.js`; the settings contract is `backend/src/lib/tryonSettings.js`.

### Cost and abuse protection

Generating costs real money, so `POST /api/tryon` and `POST /api/uploads/photo` both require a signed-in account and are rate limited per user (20 try-ons/hour by default, configurable via `TRYON_RATE_LIMIT`). The API key is read server-side only and never reaches the browser.

Failures are classified rather than lumped together — an unreadable photo, a moderation block, exhausted credits, a rate limit and a timeout each return a distinct status and message, and only the transient ones retry automatically. Retrying an out-of-credits request cannot succeed, and a retry that does succeed costs another credit.

## Deploying with the live engine

The app runs locally as-is. Three things need doing before it could be hosted publicly with a live API key:

1. **Persistence.** `backend/data/db.json` is a file on disk, and most hosting platforms have an ephemeral filesystem — accounts and saved outfits would be lost on every restart. See *Swapping in MongoDB* below.
2. **Image storage.** Uploads and results are written to `backend/uploads/` and served from local disk, with the same problem, and it does not scale beyond a single machine. Cloudinary or S3 would replace it.
3. **Cost control.** The rate limit is per user, but sign-up is free and unlimited, so a public deployment with a live key needs a global daily cap or invite-only registration first.

Also required in production: set `NEXT_PUBLIC_API_BASE` (the frontend otherwise derives the API host from the page URL on port 4000) and `CORS_ORIGINS`.

A public deployment **without** `FASHN_API_KEY` needs none of the above — the offline composite runs the entire flow at no cost.

## Swapping in MongoDB later

`backend/src/store.js` exposes Mongoose-shaped collections (`find`, `findOne`, `create`, `updateOne`, `deleteOne`). Replace the file-backed implementation with real Mongoose models; routes stay unchanged.

## Credits

Garment and model photography under `frontend/public/` and `backend/public/garments/` is third-party product imagery used as try-on input for this academic project, and is not owned by the author.
