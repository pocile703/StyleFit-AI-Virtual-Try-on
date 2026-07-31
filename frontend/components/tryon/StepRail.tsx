"use client";

import type { ElementType } from "react";
import { motion } from "motion/react";

const STEPS = ["Upload photo", "Select clothing", "Preview result"];

export default function StepRail({
  current,
  onStepClick,
}: {
  current: number;
  /** When provided, completed steps become clickable to jump back. */
  onStepClick?: (index: number) => void;
}) {
  return (
    <ol className="flex items-center justify-center gap-2 sm:gap-4" aria-label="Try-on steps">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const canGoBack = done && !!onStepClick;
        const Wrapper: ElementType = canGoBack ? "button" : "div";
        return (
          <li
            key={label}
            aria-current={active ? "step" : undefined}
            className="flex items-center gap-2 sm:gap-4"
          >
            <Wrapper
              {...(canGoBack
                ? {
                    type: "button" as const,
                    onClick: () => onStepClick(i),
                    "aria-label": `Go back to ${label}`,
                  }
                : {})}
              // Below `sm` the label is hidden, so a back-jump button collapses
              // to the bare 32px circle. The minimums keep the hit area at 44px
              // on the viewport where it matters most.
              className={`flex items-center gap-2.5 ${
                canGoBack
                  ? "min-h-11 min-w-11 justify-center cursor-pointer group/step"
                  : ""
              }`}
            >
              <span
                className={`relative grid place-items-center w-8 h-8 rounded-full text-sm font-semibold transition-colors duration-300 ${
                  active
                    ? "bg-noir text-paper"
                    : done
                      ? `bg-veil text-ink ${
                          canGoBack
                            ? "group-hover/step:bg-noir group-hover/step:text-paper"
                            : ""
                        }`
                      : "bg-veil text-stone"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="step-ring"
                    className="absolute -inset-1.5 rounded-full border-2 border-noir/40"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                {done ? (
                  <motion.svg
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 24 }}
                    viewBox="0 0 24 24"
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </motion.svg>
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={`text-sm font-medium ${
                  active ? "block text-ink" : "hidden sm:block text-stone"
                }`}
              >
                {label}
              </span>
            </Wrapper>
            {i < STEPS.length - 1 && (
              <span className="relative block w-8 sm:w-14 h-[2px] bg-mist rounded-full overflow-hidden">
                <motion.span
                  className="absolute inset-y-0 left-0 bg-noir"
                  initial={false}
                  animate={{ width: done ? "100%" : "0%" }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
