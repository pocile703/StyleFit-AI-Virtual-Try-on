"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import AppShell from "@/components/AppShell";
import Avatar from "@/components/Avatar";
import FormError from "@/components/FormError";
import BodyFields from "@/components/profile/BodyFields";
import SizeRecommendation from "@/components/profile/SizeRecommendation";
import { api, errorMessage, uploadPhoto, type BodyProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

const EMPTY_BODY: BodyProfile = {
  heightCm: null,
  weightKg: null,
  gender: "",
  age: null,
  preferredFit: "",
};

// Split by what the field actually does. `bodyType` feeds the size estimate but
// used to sit in the same undifferentiated block as the theme switcher, so the
// card asked for nine unrelated things at once and the estimator's own "add
// your body type" hint pointed into a different visual group than the
// measurements it sat beside.
const BODY_PREF_FIELDS = [
  {
    key: "bodyType" as const,
    label: "Body type",
    options: ["", "Slim", "Athletic", "Average", "Curvy", "Plus"],
  },
  {
    key: "skinTone" as const,
    label: "Skin tone",
    options: ["", "Light", "Medium", "Tan", "Deep"],
  },
];

const DISPLAY_FIELDS = [
  {
    key: "units" as const,
    label: "Units",
    options: ["Metric (cm)", "Imperial (in)"],
  },
  {
    key: "theme" as const,
    label: "Theme",
    options: ["Light", "Dark"],
  },
];

/** One pill select — the same control both preference groups render. */
function PrefSelect({
  field,
  value,
  onChange,
}: {
  field: { key: string; label: string; options: string[] };
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="block mb-1.5 text-sm font-medium">{field.label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-5 pr-10 py-3 rounded-full border border-mist bg-card/70 focus:border-noir transition-colors appearance-none cursor-pointer"
        >
          {field.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt === "" ? "Not set" : opt}
            </option>
          ))}
        </select>
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </label>
  );
}

function ProfileContent() {
  const { user, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState("");
  // Theme is deliberately NOT in here. It has one live owner — the provider the
  // nav toggle writes to — and keeping a second copy in form state is what made
  // saving an unrelated field re-apply a stale value and flip the whole app
  // back. The select below reads the provider and writes straight to it.
  const [prefs, setPrefs] = useState({
    bodyType: "",
    skinTone: "",
    units: "Metric (cm)",
  });
  const themeLabel = theme === "dark" ? "Dark" : "Light";
  const [body, setBody] = useState<BodyProfile>(EMPTY_BODY);
  const [saving, setSaving] = useState(false);
  const [savedTick, setSavedTick] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setPrefs({
      bodyType: user.preferences.bodyType ?? "",
      skinTone: user.preferences.skinTone ?? "",
      units: user.preferences.units || "Metric (cm)",
    });
    // Accounts created before the size estimator have no body object.
    setBody((b) => ({ ...b, ...user.body }));
  }, [user]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await api.patch("/api/auth/me", {
        name,
        // Persist whatever theme is actually live, never a stale form copy.
        preferences: { ...prefs, theme: themeLabel },
        body,
      });
      // The server keeps the previous value for a measurement it can't accept,
      // so say which one rather than letting it silently snap back.
      const rejected: string[] = res.data?.rejected ?? [];
      if (rejected.length) {
        setError(
          `Couldn't save your ${rejected
            .map((f) => (f === "heightCm" ? "height" : f === "weightKg" ? "weight" : "age"))
            .join(" and ")} — check the value is realistic.`
        );
      }
      await refreshUser();
      // Theme is already applied — the select switches it the moment it changes.
      // Saving only persists whatever is live, it never re-applies a stale copy.
      if (!rejected.length) {
        setSavedTick(true);
        setTimeout(() => setSavedTick(false), 2200);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function uploadAvatar(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Profile photos must be JPG, PNG or WebP.");
      return;
    }
    setAvatarBusy(true);
    setError(null);
    try {
      const url = await uploadPhoto(file);
      await api.patch("/api/auth/me", { avatarUrl: url });
      await refreshUser();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setAvatarBusy(false);
    }
  }

  if (!user) return null;

  return (
    <>
      <h1 className="font-display font-semibold text-3xl tracking-tight">
        Profile
      </h1>
      <p className="mt-1 text-stone text-sm">
        Your account details and try-on preferences.
      </p>

      <form onSubmit={save} className="mt-8 flex flex-col gap-8">
        {/* These headings were all `.eyebrow` — 0.72rem tracked caps in muted
            grey — so the page had no heading tier at all between the h1 and its
            body copy, and the eyebrow read as decoration stacked above every
            block. They're titles now, per DESIGN.md §3. */}
        <section className="p-6 rounded-2xl border border-mist bg-card/60">
          <h2 className="font-display font-medium text-xl tracking-tight">
            Profile information
          </h2>

          {/* avatar */}
          <div className="mt-5 flex items-center gap-5">
            <div className="relative">
              <Avatar user={user} size="lg" />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarBusy}
                aria-label="Change profile photo"
                className="absolute -bottom-2 -right-2 grid place-items-center w-11 h-11 rounded-full bg-noir text-paper shadow-md hover:bg-noir-deep transition-colors disabled:opacity-60"
              >
                {avatarBusy ? (
                  // CSS spin, not a Framer loop — the global reduced-motion
                  // rule only reaches CSS animations.
                  <span
                    className="w-3.5 h-3.5 rounded-full border-2 border-paper border-t-transparent animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                ) : (
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 8h3l2-3h6l2 3h3v12H4z" />
                    <circle cx="12" cy="13.5" r="3.5" />
                  </svg>
                )}
              </button>
            </div>
            <div>
              <p className="text-sm font-medium">Profile photo</p>
              <p className="mt-0.5 text-xs text-stone">
                JPG, PNG or WebP up to 10MB. Shown across the app.
              </p>
              {user.avatarUrl && (
                <button
                  type="button"
                  onClick={async () => {
                    await api.patch("/api/auth/me", { avatarUrl: null });
                    await refreshUser();
                  }}
                  className="mt-1.5 inline-flex min-h-11 items-center text-xs font-medium text-stone hover:text-ink underline underline-offset-2"
                >
                  Remove photo
                </button>
              )}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadAvatar(file);
                e.target.value = "";
              }}
            />
          </div>

          <div className="mt-6 flex flex-col gap-4">
            <label className="block">
              <span className="block mb-1.5 text-sm font-medium">Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-5 py-3 rounded-full border border-mist bg-card/70 focus:border-noir transition-colors"
              />
            </label>
            <label className="block">
              <span className="block mb-1.5 text-sm font-medium">Email</span>
              <input
                value={user.email}
                disabled
                className="w-full px-5 py-3 rounded-full border border-mist bg-veil/50 text-stone cursor-not-allowed"
              />
            </label>
          </div>
        </section>

        <section className="p-6 rounded-2xl border border-mist bg-card/60">
          <h2 className="font-display font-medium text-xl tracking-tight">
            Fit &amp; preferences
          </h2>
          <p className="mt-2 text-xs text-stone">
            Everything here feeds the size estimate below.
          </p>

          <BodyFields
            value={body}
            onChange={(patch) => setBody((b) => ({ ...b, ...patch }))}
            units={prefs.units}
          />
          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            {BODY_PREF_FIELDS.map((field) => (
              <PrefSelect
                key={field.key}
                field={field}
                value={prefs[field.key]}
                onChange={(v) => setPrefs((p) => ({ ...p, [field.key]: v }))}
              />
            ))}
          </div>

          <div className="mt-7 border-t border-mist pt-5">
            <h3 className="text-sm font-medium">Display</h3>
            <p className="mt-1 text-xs text-stone">
              How the app reads back to you. Theme applies the moment you change
              it — no need to save.
            </p>
            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              {DISPLAY_FIELDS.map((field) => {
                const isTheme = field.key === "theme";
                return (
                  <PrefSelect
                    key={field.key}
                    field={field}
                    value={isTheme ? themeLabel : prefs.units}
                    onChange={(v) => {
                      if (isTheme) setTheme(v === "Dark" ? "dark" : "light");
                      else setPrefs((p) => ({ ...p, units: v }));
                    }}
                  />
                );
              })}
            </div>
          </div>
        </section>

        <section className="p-6 rounded-2xl border border-mist bg-card/60">
          <h2 className="font-display font-medium text-xl tracking-tight">
            Your size
          </h2>
          <p className="mt-2 text-xs text-stone">
            Worked out from your profile. Nothing is measured for you — these
            are estimates to start from.
          </p>
          <SizeRecommendation
            body={{ ...body, bodyType: prefs.bodyType }}
            units={prefs.units}
          />
        </section>

        <FormError message={error} />

        <div className="flex items-center gap-4">
          <motion.button
            type="submit"
            disabled={saving}
            whileTap={saving ? undefined : { scale: 0.98 }}
            className="px-7 py-3 rounded-full bg-noir text-paper font-medium hover:bg-noir-deep transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </motion.button>
          <AnimatePresence>
            {savedTick && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 text-sm font-medium text-noir"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                Saved
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </form>
    </>
  );
}

export default function ProfilePage() {
  return (
    <AppShell>
      <ProfileContent />
    </AppShell>
  );
}
