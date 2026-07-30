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
  ├── Image uploads (multer, decoded and re-typed by sharp)
  ├── Clothing catalog (seeded, 11 photographed garments)
  ├── Try-on engine   ← FASHN AI when FASHN_API_KEY is set;
  │                     offline mock composite (sharp) otherwise
  ├── Data store      ← MongoDB when MONGODB_URI is set; data/db.json otherwise
  └── Image storage   ← Cloudinary when CLOUDINARY_URL is set; local disk otherwise
```

The last three lines are the same pattern: a hosted service in production, a
zero-setup local default otherwise. Nothing above them changes between the two —
routes never learn which is running. That is what makes `docker compose up` the
whole setup on a fresh machine while the deployed app survives restarts.

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

Images are sent as base64 data URIs, the job is polled at `/v1/status/{id}`, and the finished image is downloaded and re-stored on our own side because FASHN's CDN links expire after three days. Without a key the same endpoint serves the offline sharp composite, so the app works in any environment.

The client lives in `backend/src/lib/fashn.js`; the settings contract is `backend/src/lib/tryonSettings.js`.

### Cost and abuse protection

Generating costs real money, so it is defended in four layers:

| Layer | What it stops |
|---|---|
| `POST /api/tryon` and `POST /api/uploads/photo` require a signed-in account | Anyone with the URL spending credits |
| Per-user sliding window, 20 try-ons/hour (`TRYON_RATE_LIMIT`) | One account draining the balance |
| Whole-deployment daily cap (`TRYON_DAILY_GLOBAL_CAP`) | Every account together draining it |
| Invite-code registration (`SIGNUP_INVITE_CODES`) | Unlimited free sign-ups in the first place |

The bottom two are production-only — both are inert when their variable is unset, which is what local development wants. The API key is read server-side only and never reaches the browser.

Image URLs arrive in request bodies, so they are checked against `isOwnedUrl()` in `backend/src/lib/storage.js` before anything is fetched. Without that check the try-on endpoint would fetch any address a caller named — server-side request forgery — and would spend credits on arbitrary third-party images.

Failures are classified rather than lumped together — an unreadable photo, a moderation block, exhausted credits, a rate limit and a timeout each return a distinct status and message, and only the transient ones retry automatically. Retrying an out-of-credits request cannot succeed, and a retry that does succeed costs another credit.

## Deployment

The hosted build runs entirely on free tiers, none of which require a payment card.

| Piece | Service | Free tier used for |
|---|---|---|
| Web app | Vercel | Next.js frontend, root directory `frontend` |
| API | Render | Express service, root directory `backend`, blueprint in `render.yaml` |
| Database | MongoDB Atlas (M0) | accounts, saved outfits, catalog |
| Image storage | Cloudinary | uploaded photos and generated results |

**Environment.** On Render, set the variables `render.yaml` declares — `MONGODB_URI`, `CLOUDINARY_URL`, `FASHN_API_KEY`, `SIGNUP_INVITE_CODES`, `CORS_ORIGINS` (the Vercel origin), and let it generate `JWT_SECRET`. On Vercel, set `NEXT_PUBLIC_API_BASE` to the Render URL — it is not optional there, because the frontend otherwise assumes the API is on port 4000 of whatever host served the page.

**Registration is invite-only** on the public deployment. Browsing, the catalog and the landing page are open to anyone; creating an account needs a code, because every account can spend credits. The sign-up form asks for one only when the API reports the gate is on, so the local build never shows the field.

**Cold starts are real.** A free Render service suspends after about 15 minutes without traffic, and the next request pays roughly 50 seconds for it to wake. The app softens this by pinging `/api/health` the moment it mounts, so the API is already booting while the visitor reads the landing page — but a first try-on straight after a quiet night will still feel slow. This is the honest cost of not paying for hosting.

**Limits worth knowing.** Atlas M0 is 512MB; Cloudinary's free tier is 25 credits/month, so a genuinely popular deployment would exhaust its bandwidth and images would stop loading. The daily try-on cap is held in memory, so a restart resets it — the invite gate is the control that actually holds.

## Credits

Garment and model photography under `frontend/public/` and `backend/public/garments/` is third-party product imagery used as try-on input for this academic project, and is not owned by the author.
