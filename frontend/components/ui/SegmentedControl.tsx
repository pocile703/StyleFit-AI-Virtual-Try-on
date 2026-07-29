"use client";

import { motion } from "motion/react";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Distinguishes real tabs (which swap panels) from a plain choice. */
  variant?: "tabs" | "radio";
  /** Shared across instances via Framer's layout system — must be unique. */
  layoutId: string;
  label: string;
  idPrefix?: string;
  className?: string;
}

/**
 * The pill segmented control used for the garment source tabs and the try-on
 * settings. Arrow keys move between options with a roving tabIndex, and the
 * ink pill slides between them.
 */
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  variant = "radio",
  layoutId,
  label,
  idPrefix,
  className = "",
}: SegmentedControlProps<T>) {
  const isTabs = variant === "tabs";

  function move(direction: 1 | -1) {
    const index = options.findIndex((o) => o.value === value);
    const next = (index + direction + options.length) % options.length;
    onChange(options[next].value);
  }

  return (
    <div
      role={isTabs ? "tablist" : "radiogroup"}
      aria-label={label}
      className={`flex gap-1 p-1 rounded-full bg-veil ${className}`}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          move(1);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          move(-1);
        }
      }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            id={idPrefix ? `${idPrefix}-${option.value}` : undefined}
            role={isTabs ? "tab" : "radio"}
            aria-selected={isTabs ? selected : undefined}
            aria-checked={isTabs ? undefined : selected}
            aria-controls={
              isTabs && idPrefix ? `${idPrefix}-panel-${option.value}` : undefined
            }
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={`relative flex-1 min-h-11 px-4 rounded-full text-sm font-medium transition-colors ${
              selected ? "text-paper" : "text-stone hover:text-ink"
            }`}
          >
            {selected && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-noir"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
