/**
 * End-to-end API tests for the StyleFit backend.
 *
 *   npm test                          # against http://localhost:4000
 *   API=https://... npm test          # against a deployed API
 *   INVITE=<code> npm test            # when SIGNUP_INVITE_CODES is set
 *   RUN_PAID=1 npm test               # also run a real (paid) generation
 *
 * These are integration tests: they run against a live server rather than
 * mocking it, because the things most worth testing here — that an upload is
 * really decoded, that one account cannot touch another's outfits, that a
 * hostile image URL is refused — only mean anything end to end.
 *
 * No test framework and no fixtures on disk: node's built-in fetch drives the
 * API and sharp draws the test image, both of which the project already
 * depends on. `npm test` therefore works on a fresh clone with nothing else
 * installed.
 *
 * Note: the API has no delete-account endpoint by design, so the accounts
 * these tests create are left behind. Locally they land in the gitignored
 * data/db.json and are harmless. Against a deployed database, clear them
 * afterwards — they all use the @stylefit.test domain.
 */
import sharp from "sharp";

const API = process.env.API || "http://localhost:4000";
const INVITE = process.env.INVITE || "";
const RUN_PAID = process.env.RUN_PAID === "1";

let passed = 0;
let failed = 0;
let skipped = 0;
const failures = [];

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const GREY = "\x1b[90m";
const RESET = "\x1b[0m";

function group(name) {
  console.log(`\n${name}`);
}

function ok(name) {
  passed += 1;
  console.log(`  ${GREEN}pass${RESET} ${name}`);
}

function fail(name, detail) {
  failed += 1;
  failures.push(`${name} — ${detail}`);
  console.log(`  ${RED}FAIL${RESET} ${name}\n       ${detail}`);
}

function skip(name, why) {
  skipped += 1;
  console.log(`  ${GREY}skip${RESET} ${name} ${GREY}(${why})${RESET}`);
}

/** Assert a condition, recording the result under `name`. */
function check(name, condition, detail = "") {
  condition ? ok(name) : fail(name, detail || "condition was false");
}

/** Assert a response carries one of the acceptable statuses. */
function checkStatus(name, res, ...acceptable) {
  const got = res.status;
  check(
    name,
    acceptable.includes(got),
    `expected ${acceptable.join(" or ")}, got ${got} ${JSON.stringify(res.body).slice(0, 120)}`
  );
}

async function request(path, { token, ...options } = {}) {
  const headers = { ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body && typeof options.body === "string") {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${API}${path}`, { ...options, headers });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

const json = (value) => JSON.stringify(value);

/** A valid photograph-shaped image, drawn rather than committed as a fixture. */
async function testImage() {
  return sharp({
    create: { width: 900, height: 1200, channels: 3, background: "#b8c4d0" },
  })
    .jpeg()
    .toBuffer();
}

async function register(email, inviteCode = INVITE) {
  return request("/api/auth/register", {
    method: "POST",
    body: json({ name: "Test User", email, password: "testpassword1", inviteCode }),
  });
}

const uniqueEmail = (prefix) =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@stylefit.test`;

// ---------------------------------------------------------------------------

console.log(`\nStyleFit API tests → ${API}`);

const health = await request("/api/health");
if (health.status !== 200) {
  console.error(
    `\n${RED}The API is not responding at ${API}.${RESET}\n` +
      `Start it with \`docker compose up\` (or \`npm run dev\` in backend/), or set API=<url>.\n`
  );
  process.exit(1);
}

const { tryonLive, signupRequiresInvite } = health.body;
console.log(
  `${GREY}engine: ${tryonLive ? "FASHN (live, generations cost credits)" : "offline composite"} · ` +
    `sign-up: ${signupRequiresInvite ? "invite required" : "open"}${RESET}`
);

if (signupRequiresInvite && !INVITE) {
  console.error(
    `\n${RED}This deployment gates sign-up but no invite code was given.${RESET}\n` +
      `Re-run with INVITE=<code> npm test\n`
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
group("Service");

check("health reports ok", health.body.ok === true, json(health.body));

const catalog = await request("/api/clothing");
check("catalog returns items", catalog.body.items?.length > 0, `${catalog.body.items?.length} items`);
check(
  "every advertised category has items in it",
  catalog.body.categories.every((c) => catalog.body.items.some((i) => i.category === c)),
  `categories: ${catalog.body.categories?.join(", ")}`
);
check(
  "catalog images are served",
  (await fetch(`${API}${catalog.body.items[0].imageUrl}`)).ok,
  catalog.body.items[0]?.imageUrl
);
const garment = catalog.body.items[0];

const unknown = await request("/api/nope");
checkStatus("unknown routes return JSON, not an HTML error page", unknown, 404);
check("the 404 body is machine-readable", typeof unknown.body.error === "string", json(unknown.body));

// ---------------------------------------------------------------------------
group("Registration");

if (signupRequiresInvite) {
  checkStatus("registering with no invite code is refused", await register(uniqueEmail("a"), ""), 403);
  checkStatus("registering with a wrong invite code is refused", await register(uniqueEmail("b"), "not-a-code"), 403);
} else {
  skip("invite code enforcement", "sign-up is open on this deployment");
  skip("invalid invite code rejection", "sign-up is open on this deployment");
}

checkStatus(
  "a password under six characters is refused",
  await request("/api/auth/register", {
    method: "POST",
    body: json({ name: "x", email: uniqueEmail("short"), password: "abc", inviteCode: INVITE }),
  }),
  400
);

const email = uniqueEmail("user");
const created = await register(email);
checkStatus("registration succeeds", created, 201);
const token = created.body.token;
check("registration returns a session token", typeof token === "string" && token.length > 20);

checkStatus("the same email cannot register twice", await register(email), 409);

// ---------------------------------------------------------------------------
group("Authentication");

const login = await request("/api/auth/login", {
  method: "POST",
  body: json({ email, password: "testpassword1" }),
});
checkStatus("login with correct credentials succeeds", login, 200);
check("login returns a session token", typeof login.body.token === "string");

checkStatus(
  "login with a wrong password is refused",
  await request("/api/auth/login", {
    method: "POST",
    body: json({ email, password: "wrongpassword" }),
  }),
  401
);

const me = await request("/api/auth/me", { token });
check("the session identifies the right account", me.body.user?.email === email, me.body.user?.email);
check("the password hash is never returned", me.body.user?.passwordHash === undefined);

checkStatus("a request with no token is refused", await request("/api/auth/me"), 401);
checkStatus(
  "a request with a forged token is refused",
  await request("/api/auth/me", { token: "not.a.real.token" }),
  401
);

// ---------------------------------------------------------------------------
group("Uploads");

const image = await testImage();

const form = new FormData();
form.append("image", new Blob([image], { type: "image/jpeg" }), "photo.jpg");
const uploadRes = await fetch(`${API}/api/uploads/photo`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: form,
});
const uploaded = await uploadRes.json().catch(() => ({}));
check("an image upload succeeds", uploadRes.status === 201 && Boolean(uploaded.url), json(uploaded));
check("the stored image is retrievable", uploaded.url ? (await fetch(uploaded.url.startsWith("http") ? uploaded.url : `${API}${uploaded.url}`)).ok : false);

const anonForm = new FormData();
anonForm.append("image", new Blob([image], { type: "image/jpeg" }), "photo.jpg");
check(
  "uploading without a session is refused",
  (await fetch(`${API}/api/uploads/photo`, { method: "POST", body: anonForm })).status === 401
);

// A file that claims to be an image but is not. The declared MIME type is a
// client claim; the server is expected to decode the bytes before trusting it.
const liarForm = new FormData();
liarForm.append("image", new Blob([Buffer.from("#!/bin/sh\nrm -rf /\n")], { type: "image/jpeg" }), "evil.jpg");
check(
  "a non-image sent with an image MIME type is refused",
  (await fetch(`${API}/api/uploads/photo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: liarForm,
  })).status === 400
);

const tinyForm = new FormData();
tinyForm.append(
  "image",
  new Blob([await sharp({ create: { width: 64, height: 64, channels: 3, background: "#fff" } }).jpeg().toBuffer()], {
    type: "image/jpeg",
  }),
  "tiny.jpg"
);
check(
  "an image below the minimum size is refused",
  (await fetch(`${API}/api/uploads/photo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: tinyForm,
  })).status === 400
);

// ---------------------------------------------------------------------------
group("Try-on input validation");

// Image URLs arrive in the request body, so they are attacker-controlled.
// Without an allowlist this endpoint would fetch any address it was given —
// server-side request forgery — and spend credits on arbitrary images.
const hostile = [
  ["a cloud metadata endpoint", "http://169.254.169.254/latest/meta-data/"],
  ["an arbitrary external URL", "https://example.com/garment.jpg"],
  ["a path traversal attempt", "/uploads/../../../etc/passwd"],
  ["another account's image host", "https://res.cloudinary.com/someone-else/image/upload/x.jpg"],
  ["a file:// URL", "file:///etc/passwd"],
];

for (const [label, url] of hostile) {
  const res = await request("/api/tryon", {
    method: "POST",
    token,
    body: json({ personImageUrl: url, garmentImageUrl: garment.imageUrl }),
  });
  // 403 rather than 400 means an edge proxy refused it before the app saw it,
  // which is a stricter outcome, not a failure.
  checkStatus(`try-on refuses ${label}`, res, 400, 403);
}

checkStatus(
  "try-on with no images is refused",
  await request("/api/tryon", { method: "POST", token, body: json({}) }),
  400
);
checkStatus(
  "try-on without a session is refused",
  await request("/api/tryon", {
    method: "POST",
    body: json({ personImageUrl: uploaded.url, garmentImageUrl: garment.imageUrl }),
  }),
  401
);

// ---------------------------------------------------------------------------
group("Generation");

let resultUrl = uploaded.url;

if (tryonLive && !RUN_PAID) {
  skip("a try-on completes", "the live engine is on; re-run with RUN_PAID=1 to spend a credit");
} else {
  const started = Date.now();
  const tryon = await request("/api/tryon", {
    method: "POST",
    token,
    body: json({
      personImageUrl: uploaded.url,
      garmentImageUrl: garment.imageUrl,
      settings: { quality: "standard" },
    }),
  });
  checkStatus("a try-on completes", tryon, 200);
  if (tryon.body.resultUrl) {
    resultUrl = tryon.body.resultUrl;
    console.log(
      `${GREY}       ${tryon.body.engine}, ${tryon.body.credits} credit(s), ` +
        `${((Date.now() - started) / 1000).toFixed(1)}s${RESET}`
    );
    const img = await fetch(resultUrl.startsWith("http") ? resultUrl : `${API}${resultUrl}`);
    check("the generated image is retrievable", img.ok && Number(img.headers.get("content-length")) > 1000);
  }
}

// ---------------------------------------------------------------------------
group("Saved outfits");

const saved = await request("/api/outfits", {
  method: "POST",
  token,
  body: json({
    name: "Test look",
    resultUrl,
    personImageUrl: uploaded.url,
    garmentImageUrl: garment.imageUrl,
  }),
});
checkStatus("an outfit saves", saved, 201);
const outfitId = saved.body.outfit?._id;

checkStatus(
  "saving with nothing to save is refused",
  await request("/api/outfits", { method: "POST", token, body: json({ name: "empty" }) }),
  400
);

const list = await request("/api/outfits", { token });
check("the saved outfit appears in the list", list.body.outfits?.some((o) => o._id === outfitId));

const renamed = await request(`/api/outfits/${outfitId}`, {
  method: "PATCH",
  token,
  body: json({ name: "Renamed look" }),
});
check("an outfit can be renamed", renamed.body.outfit?.name === "Renamed look", json(renamed.body).slice(0, 120));

checkStatus(
  "renaming to an empty name is refused",
  await request(`/api/outfits/${outfitId}`, { method: "PATCH", token, body: json({ name: "   " }) }),
  400
);

// ---------------------------------------------------------------------------
group("Account isolation");

const intruder = await register(uniqueEmail("intruder"));
const intruderToken = intruder.body.token;

const intruderList = await request("/api/outfits", { token: intruderToken });
check(
  "a new account sees none of another account's outfits",
  (intruderList.body.outfits ?? []).length === 0,
  `saw ${intruderList.body.outfits?.length}`
);

// Masked as 404 rather than 403: confirming the row exists would leak the fact
// that this id belongs to somebody.
checkStatus(
  "another account cannot rename this outfit",
  await request(`/api/outfits/${outfitId}`, { method: "PATCH", token: intruderToken, body: json({ name: "stolen" }) }),
  404
);
checkStatus(
  "another account cannot delete this outfit",
  await request(`/api/outfits/${outfitId}`, { method: "DELETE", token: intruderToken }),
  404
);

// ---------------------------------------------------------------------------
group("Profile");

const patched = await request("/api/auth/me", {
  method: "PATCH",
  token,
  body: json({
    name: "Updated Name",
    body: { heightCm: 175, weightKg: 68 },
    preferences: { bodyType: "Athletic", isAdmin: true },
  }),
});
check("the display name updates", patched.body.user?.name === "Updated Name");
check("body measurements are stored", patched.body.user?.body?.heightCm === 175);
check("known preferences are stored", patched.body.user?.preferences?.bodyType === "Athletic");
check("unknown preference keys are discarded", patched.body.user?.preferences?.isAdmin === undefined);

const outOfRange = await request("/api/auth/me", {
  method: "PATCH",
  token,
  body: json({ body: { heightCm: 900 } }),
});
check("an out-of-range measurement is rejected", outOfRange.body.user?.body?.heightCm === 175);
check("and the caller is told which field was ignored", outOfRange.body.rejected?.length > 0, json(outOfRange.body.rejected));

const foreignAvatar = await request("/api/auth/me", {
  method: "PATCH",
  token,
  body: json({ avatarUrl: "https://evil.example.com/tracking-pixel.jpg" }),
});
check("an avatar URL from another host is refused", !foreignAvatar.body.user?.avatarUrl);

const ownAvatar = await request("/api/auth/me", { method: "PATCH", token, body: json({ avatarUrl: uploaded.url }) });
check("an avatar this app stored is accepted", ownAvatar.body.user?.avatarUrl === uploaded.url);

// ---------------------------------------------------------------------------
group("Cleanup");

checkStatus("the owner can delete their outfit", await request(`/api/outfits/${outfitId}`, { method: "DELETE", token }), 200);
const afterDelete = await request("/api/outfits", { token });
check("the deleted outfit is gone", !afterDelete.body.outfits?.some((o) => o._id === outfitId));

// ---------------------------------------------------------------------------

console.log(
  `\n${failed ? RED : GREEN}${passed} passed, ${failed} failed${RESET}` +
    (skipped ? `${GREY}, ${skipped} skipped${RESET}` : "")
);
if (failed) {
  console.log(`\n${RED}Failures:${RESET}\n  ${failures.join("\n  ")}`);
}
console.log(`${GREY}Test accounts created under @stylefit.test are not removed automatically.${RESET}\n`);

process.exit(failed ? 1 : 0);
