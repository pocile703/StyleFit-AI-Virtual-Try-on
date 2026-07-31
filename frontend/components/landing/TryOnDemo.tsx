"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import RevealSlider from "@/components/tryon/RevealSlider";
import { LOOKS } from "@/lib/looks";
import { useCalmMotion } from "@/lib/useHydrated";

// Four of the six results — enough variety to show it works on different
// people and garment types without turning the dot row into a keyboard.
const DEMO = [LOOKS[0], LOOKS[1], LOOKS[2], LOOKS[3]];

const SWEEP_MS = 2200;
/** How long the finished result holds before the next look. */
const HOLD_MS = 1400;

/**
 * Hero demo: a real before/after. The page claims "see it on you", so this is
 * an actual photo that went through the try-on and the actual result — not an
 * illustration of one.
 *
 * It plays itself: each look wipes from the original across to the result,
 * holds, then hands over to the next. Touching it — dragging, arrow keys, or
 * the dots — stops the loop for good. Once someone is driving, taking the
 * wheel back is hostile.
 */
export default function TryOnDemo() {
  const reduce = useCalmMotion();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const look = DEMO[index];

  const stop = useCallback(() => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
    setPlaying(false);
  }, []);

  const advance = useCallback(() => {
    holdTimer.current = setTimeout(
      () => setIndex((i) => (i + 1) % DEMO.length),
      HOLD_MS
    );
  }, []);

  useEffect(
    () => () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
    },
    []
  );

  return (
    <div className="relative w-full max-w-sm mx-auto select-none">
      <div className="relative">
        {/* keyed on the look so each one restarts its own reveal rather than
            inheriting the previous handle position */}
        <RevealSlider
          key={look.id}
          beforeSrc={look.before}
          afterSrc={look.after}
          initialPos={58}
          sweep={playing}
          sweepMs={SWEEP_MS}
          onSweepEnd={advance}
          onInteract={stop}
          className="rounded-3xl border border-mist shadow-[var(--shadow-figure-soft)]"
        />

        {/* corner brackets — frame it as a captured photo */}
        <svg
          className="absolute inset-4 pointer-events-none text-noir"
          viewBox="0 0 100 133"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 8 V0 H6 M94 0 H100 V8 M100 125 V133 H94 M6 133 H0 V125"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <motion.span
          key={`${look.id}-label`}
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-2 rounded-full bg-black/80 backdrop-blur text-white text-xs font-medium shadow-lg"
        >
          {look.label}
        </motion.span>
      </div>

      <p className="mt-4 text-center text-xs text-stone">
        {playing && !reduce
          ? "Every look here is a real result — drag the handle to take over."
          : "Drag the handle — left is the original photo, right is the try-on."}
      </p>

      <div className="mt-1 flex items-center justify-center gap-1">
        {DEMO.map((l, i) => (
          <button
            key={l.id}
            onClick={() => {
              stop();
              setIndex(i);
            }}
            aria-label={`Show ${l.label}`}
            aria-current={i === index}
            className="group/dot grid place-items-center h-11 min-w-11"
          >
            <span
              className={`h-2 rounded-full transition-[width,background-color] duration-300 ${
                i === index ? "w-6 bg-noir" : "w-2 bg-mist group-hover/dot:bg-stone"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
