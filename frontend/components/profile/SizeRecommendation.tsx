"use client";

import {
  CONFIDENCE_COPY,
  estimateSizing,
  formatLength,
  type SizingInput,
} from "@/lib/sizing";

interface SizeRecommendationProps {
  body: SizingInput;
  units: string;
}

const CONFIDENCE_STEPS: Record<string, number> = { low: 1, medium: 2, high: 3 };

/**
 * Recommended sizes and estimated measurements.
 *
 * Deliberately colourless — this is a workroom surface, so the confidence
 * indicator is a filled/unfilled ink meter rather than the usual green/amber
 * traffic light (DESIGN.md One-Ink Rule).
 */
export default function SizeRecommendation({ body, units }: SizeRecommendationProps) {
  const estimate = estimateSizing(body);

  if (!estimate) {
    return (
      <div className="mt-5 rounded-2xl bg-veil/70 px-4 py-4">
        <p className="text-sm">Add your height and weight to see a size estimate.</p>
        <p className="mt-1 text-xs text-stone leading-relaxed">
          They stay on your account and are only used to work out what size to
          suggest.
        </p>
      </div>
    );
  }

  const { measurements: m } = estimate;
  const rows: [string, string][] = [
    ["Chest", formatLength(m.chest, units)],
    ["Waist", `${formatLength(m.waist, units)} · ${estimate.waistLabel}`],
    ["Hip", formatLength(m.hip, units)],
    ["Inseam", formatLength(m.inseam, units)],
    ["Shoulder", formatLength(m.shoulder, units)],
  ];
  const steps = CONFIDENCE_STEPS[estimate.confidence] ?? 1;

  return (
    <div className="mt-5">
      <div className="grid grid-cols-2 gap-3">
        {[
          ["Tops", estimate.shirtSize],
          ["Bottoms", estimate.pantsSize],
        ].map(([label, size]) => (
          <div key={label} className="rounded-2xl bg-veil px-4 py-4 text-center">
            <p className="text-xs font-medium text-stone">{label}</p>
            <p className="mt-1 font-display font-semibold text-3xl tracking-tight">
              {size}
            </p>
          </div>
        ))}
      </div>

      <dl className="mt-5 grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-3">
            <dt className="text-sm text-stone">{label}</dt>
            <dd className="text-sm font-medium tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 flex items-center gap-3">
        <span className="flex gap-1" aria-hidden="true">
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-1.5 w-6 rounded-full ${i <= steps ? "bg-noir" : "bg-mist"}`}
            />
          ))}
        </span>
        <span className="text-xs font-medium">{CONFIDENCE_COPY[estimate.confidence]}</span>
      </div>

      <p className="mt-3 text-xs text-stone leading-relaxed">
        Estimated measurements based on your profile.
        {estimate.missing.length > 0 && (
          <> Add your {estimate.missing.join(", ")} for a closer estimate.</>
        )}{" "}
        Brands cut differently — check the size guide before you buy.
      </p>
    </div>
  );
}
