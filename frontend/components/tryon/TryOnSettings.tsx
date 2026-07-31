"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import SegmentedControl from "@/components/ui/SegmentedControl";
import {
  BACKGROUND_OPTIONS,
  Choice,
  DEFAULT_SETTINGS,
  FIT_OPTIONS,
  GARMENT_TYPE_OPTIONS,
  PHOTO_TYPE_OPTIONS,
  QUALITY_OPTIONS,
  STYLING_NOTE_MAX,
  TryOnSettings as Settings,
  applySettingChange,
  creditCost,
  summarizeSettings,
  type CreditRates,
  DEFAULT_CREDIT_RATES,
} from "@/lib/tryon";

interface TryOnSettingsProps {
  value: Settings;
  onChange: (next: Settings) => void;
  /** Credit costs are only quoted when the paid engine is actually on. */
  engineLive: boolean;
  /** The server's price table, so the client never asserts a rate it invented. */
  rates?: CreditRates;
}

/** A labelled choice with the description of whichever option is selected. */
function Field<T extends string>({
  label,
  options,
  value,
  onChange,
  layoutId,
}: {
  label: string;
  options: Choice<T>[];
  value: T;
  onChange: (v: T) => void;
  layoutId: string;
}) {
  const selected = options.find((o) => o.value === value);
  // The description explains what the current choice does, so it has to be
  // wired to the group — otherwise a screen reader announces the options and
  // drops the only copy that says what they mean.
  const descriptionId = `${layoutId}-description`;
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      <SegmentedControl
        options={options}
        value={value}
        onChange={onChange}
        layoutId={layoutId}
        label={label}
        describedBy={descriptionId}
      />
      <p id={descriptionId} className="mt-2 text-xs text-stone">
        {selected?.description}
      </p>
    </div>
  );
}

export default function TryOnSettings({
  value,
  onChange,
  engineLive,
  rates = DEFAULT_CREDIT_RATES,
}: TryOnSettingsProps) {
  const reduce = useReducedMotion();
  const isHigh = value.quality === "high";
  // `applySettingChange` has always reported when a choice forced the tier up;
  // nothing read it, so the quality switch moved under the user with no
  // explanation — and, on the live engine, tripled what the run costs.
  const [autoUpgraded, setAutoUpgraded] = useState(false);

  function update(patch: Partial<Settings>) {
    const { settings, upgraded } = applySettingChange(value, patch);
    onChange(settings);
    if (upgraded) setAutoUpgraded(true);
    else if (patch.quality) setAutoUpgraded(false);
    return upgraded;
  }

  const cost = creditCost(value, rates);
  const isDefault =
    JSON.stringify(value) === JSON.stringify(DEFAULT_SETTINGS);

  return (
    <details className="group mt-8 rounded-2xl border border-mist bg-card/60">
      <summary className="flex cursor-pointer list-none items-center gap-3 min-h-11 px-5 py-3">
        <span className="text-sm font-medium">Try-on settings</span>
        <span className="ml-auto truncate text-xs text-stone">
          {summarizeSettings(value)}
          {engineLive && ` · ${cost} credit${cost === 1 ? "" : "s"}`}
        </span>
        <svg
          viewBox="0 0 24 24"
          className="w-4 h-4 shrink-0 text-stone transition-transform group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>

      <div className="border-t border-mist px-5 py-5 flex flex-col gap-6">
        {/* The number appears on the summary row above and on the Generate
            button, and a price with no balance beside it reads as a bill. Say
            once, where it first shows up, whose meter is running. */}
        {engineLive && (
          <p className="text-xs text-stone leading-relaxed">
            Credits are what the AI service charges this project for a
            generation — they come out of its allowance, not your pocket.
            They&apos;re shown so the cost of a setting is never hidden from you.
          </p>
        )}

        {!isDefault && (
          <p className="text-xs text-stone">
            Defaults work for most photos —{" "}
            <button
              type="button"
              onClick={() => onChange({ ...DEFAULT_SETTINGS })}
              className="inline-flex items-center min-h-11 font-medium text-ink underline underline-offset-2"
            >
              reset them
            </button>
            .
          </p>
        )}

        <Field
          label="Image quality"
          options={QUALITY_OPTIONS}
          value={value.quality}
          onChange={(quality) => update({ quality })}
          layoutId="settings-quality"
        />

        {isHigh ? (
          <>
            <Field
              label="Garment fit"
              options={FIT_OPTIONS}
              value={value.fit}
              onChange={(fit) => update({ fit })}
              layoutId="settings-fit"
            />
            <Field
              label="Background"
              options={BACKGROUND_OPTIONS}
              value={value.background}
              onChange={(background) => update({ background })}
              layoutId="settings-background"
            />
          </>
        ) : (
          <>
            <Field
              label="Clothing photo type"
              options={PHOTO_TYPE_OPTIONS}
              value={value.photoType}
              onChange={(photoType) => update({ photoType })}
              layoutId="settings-photo-type"
            />
            <div className="rounded-2xl bg-veil/70 px-4 py-3">
              <p className="text-xs text-stone leading-relaxed">
                Want to change the fit or the background? Those need{" "}
                <button
                  type="button"
                  onClick={() => update({ quality: "high" })}
                  className="inline-flex items-center min-h-11 font-medium text-ink underline underline-offset-2"
                >
                  High quality
                </button>
                {engineLive ? " (3 credits instead of 1)." : "."}
              </p>
            </div>
          </>
        )}

        <details className="group/adv border-t border-mist pt-4">
          <summary className="flex cursor-pointer list-none items-center justify-between min-h-11 text-sm font-medium text-stone hover:text-ink transition-colors">
            <span>Advanced</span>
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 transition-transform group-open/adv:rotate-180"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </summary>

          <div className="mt-4 flex flex-col gap-5">
            {isHigh ? (
              <label className="block">
                <span className="block mb-1.5 text-sm font-medium">Styling note</span>
                <input
                  value={value.stylingNote}
                  maxLength={STYLING_NOTE_MAX}
                  onChange={(e) => update({ stylingNote: e.target.value })}
                  placeholder="e.g. tuck in the shirt, roll up the sleeves"
                  className="w-full px-5 py-3 rounded-full border border-mist bg-card/70 focus:border-noir transition-colors"
                />
                <span className="mt-2 block text-xs text-stone">
                  A short instruction for how to wear it. Leave empty unless
                  something specific matters.
                </span>
              </label>
            ) : (
              <>
                <label className="block">
                  <span className="block mb-1.5 text-sm font-medium">Clothing type</span>
                  <div className="relative">
                    <select
                      value={value.garmentType}
                      onChange={(e) =>
                        update({ garmentType: e.target.value as Settings["garmentType"] })
                      }
                      className="w-full pl-5 pr-10 py-3 rounded-full border border-mist bg-card/70 focus:border-noir transition-colors appearance-none cursor-pointer"
                    >
                      {GARMENT_TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
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
                  <span className="mt-2 block text-xs text-stone">
                    {
                      GARMENT_TYPE_OPTIONS.find((o) => o.value === value.garmentType)
                        ?.description
                    }
                  </span>
                </label>

                <Field
                  label="Body shape"
                  options={[
                    {
                      value: "keep",
                      label: "Keep my shape",
                      description:
                        "Fits the garment around your body. Better for bulky items like coats.",
                    },
                    {
                      value: "reshape",
                      label: "Follow the garment",
                      description:
                        "Lets the garment define the silhouette. Cleaner on close-fitting clothes.",
                    },
                  ]}
                  value={value.preserveShape ? "keep" : "reshape"}
                  onChange={(v) => update({ preserveShape: v === "keep" })}
                  layoutId="settings-shape"
                />
              </>
            )}
          </div>
        </details>

        <AnimatePresence>
          {isHigh && (
            <motion.p
              initial={reduce ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0 }}
              className="text-xs text-stone"
              role={autoUpgraded ? "status" : undefined}
            >
              {autoUpgraded && (
                <span className="font-medium text-ink">
                  Switched to High quality — that option only exists there.{" "}
                </span>
              )}
              High quality renders at a larger size and takes around three times
              as long{engineLive ? ", at 3 credits instead of 1" : ""}.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </details>
  );
}
