"use client";

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
} from "@/lib/tryon";

interface TryOnSettingsProps {
  value: Settings;
  onChange: (next: Settings) => void;
  /** Credit costs are only quoted when the paid engine is actually on. */
  engineLive: boolean;
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
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      <SegmentedControl
        options={options}
        value={value}
        onChange={onChange}
        layoutId={layoutId}
        label={label}
      />
      <p className="mt-2 text-xs text-stone">{selected?.description}</p>
    </div>
  );
}

export default function TryOnSettings({
  value,
  onChange,
  engineLive,
}: TryOnSettingsProps) {
  const reduce = useReducedMotion();
  const isHigh = value.quality === "high";

  function update(patch: Partial<Settings>) {
    const { settings, upgraded } = applySettingChange(value, patch);
    onChange(settings);
    return upgraded;
  }

  const cost = creditCost(value);
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
        {!isDefault && (
          <p className="text-xs text-stone">
            Defaults work for most photos —{" "}
            <button
              type="button"
              onClick={() => onChange({ ...DEFAULT_SETTINGS })}
              className="font-medium text-ink underline underline-offset-2"
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
                  className="font-medium text-ink underline underline-offset-2"
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
            >
              High quality renders at a larger size and takes around three times
              as long{engineLive ? ", at 3 credits instead of 1" : ""}.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </details>
  );
}
