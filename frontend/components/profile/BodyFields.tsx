"use client";

import type { BodyProfile } from "@/lib/api";

interface BodyFieldsProps {
  value: Partial<BodyProfile>;
  onChange: (patch: Partial<BodyProfile>) => void;
  /** From preferences.units — decides whether heights read in cm or inches. */
  units: string;
}

const GENDER_OPTIONS: { value: BodyProfile["gender"]; label: string }[] = [
  { value: "", label: "Not set" },
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "neutral", label: "Prefer not to say" },
];

const FIT_OPTIONS: BodyProfile["preferredFit"][] = ["", "Relaxed", "Regular", "Slim"];

const CHEVRON = (
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
);

/** Pill number input with the unit sitting inside the field. */
function NumberField({
  label,
  unit,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  unit: string;
  value: number | null | undefined;
  min: number;
  max: number;
  onChange: (v: number | null) => void;
}) {
  return (
    <label className="block">
      <span className="block mb-1.5 text-sm font-medium">{label}</span>
      <div className="relative">
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value ?? ""}
          placeholder="—"
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          className="w-full pl-5 pr-14 py-3 rounded-full border border-mist bg-card/70 focus:border-noir transition-colors"
        />
        <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-sm text-stone">
          {unit}
        </span>
      </div>
    </label>
  );
}

/**
 * The measurements behind the size estimate. Height and weight are stored
 * metric whatever the display units — one canonical unit on the server keeps
 * the estimator from having to guess what a number means.
 */
export default function BodyFields({ value, onChange, units }: BodyFieldsProps) {
  const imperial = units === "Imperial (in)";

  const heightDisplay =
    value.heightCm == null
      ? null
      : imperial
        ? Math.round(value.heightCm / 2.54)
        : Math.round(value.heightCm);

  const weightDisplay =
    value.weightKg == null
      ? null
      : imperial
        ? Math.round(value.weightKg * 2.205)
        : Math.round(value.weightKg);

  return (
    <div className="mt-5 grid sm:grid-cols-2 gap-4">
      <NumberField
        label="Height"
        unit={imperial ? "in" : "cm"}
        value={heightDisplay}
        min={imperial ? 47 : 120}
        max={imperial ? 91 : 230}
        onChange={(v) =>
          onChange({ heightCm: v == null ? null : imperial ? Math.round(v * 2.54) : v })
        }
      />
      <NumberField
        label="Weight"
        unit={imperial ? "lb" : "kg"}
        value={weightDisplay}
        min={imperial ? 66 : 30}
        max={imperial ? 551 : 250}
        onChange={(v) =>
          onChange({ weightKg: v == null ? null : imperial ? Math.round(v / 2.205) : v })
        }
      />

      <label className="block">
        <span className="block mb-1.5 text-sm font-medium">Gender</span>
        <div className="relative">
          <select
            value={value.gender ?? ""}
            onChange={(e) => onChange({ gender: e.target.value as BodyProfile["gender"] })}
            className="w-full pl-5 pr-10 py-3 rounded-full border border-mist bg-card/70 focus:border-noir transition-colors appearance-none cursor-pointer"
          >
            {GENDER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {CHEVRON}
        </div>
        <span className="mt-1.5 block text-xs text-stone">
          Used only to pick which size chart to estimate against.
        </span>
      </label>

      <label className="block">
        <span className="block mb-1.5 text-sm font-medium">Preferred fit</span>
        <div className="relative">
          <select
            value={value.preferredFit ?? ""}
            onChange={(e) =>
              onChange({ preferredFit: e.target.value as BodyProfile["preferredFit"] })
            }
            className="w-full pl-5 pr-10 py-3 rounded-full border border-mist bg-card/70 focus:border-noir transition-colors appearance-none cursor-pointer"
          >
            {FIT_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o === "" ? "Not set" : o}
              </option>
            ))}
          </select>
          {CHEVRON}
        </div>
      </label>

      <NumberField
        label="Age (optional)"
        unit="yrs"
        value={value.age}
        min={13}
        max={100}
        onChange={(v) => onChange({ age: v })}
      />
    </div>
  );
}
