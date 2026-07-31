"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useCalmMotion } from "@/lib/useHydrated";

/** Beat before the wipe starts, so the original registers first. */
const SWEEP_LEAD_IN_MS = 550;

/**
 * Draggable before/after comparison. Left of the handle shows the original
 * photo, right shows the try-on result. Keyboard accessible (arrow keys).
 *
 * With `sweep`, it plays itself: resets to the original, wipes across to the
 * result, then calls `onSweepEnd`. The CSS transition does the interpolation,
 * so dragging stays a straight state update with no animation to fight.
 */
export default function RevealSlider({
  beforeSrc,
  afterSrc,
  /** Off-centre reads as draggable; dead centre reads as a static split. */
  initialPos = 50,
  className = "",
  sweep = false,
  sweepMs = 2200,
  onSweepEnd,
  onInteract,
}: {
  beforeSrc: string;
  afterSrc: string;
  initialPos?: number;
  className?: string;
  /** Play the reveal automatically. */
  sweep?: boolean;
  sweepMs?: number;
  onSweepEnd?: () => void;
  /** Fired the first time the visitor takes over, so autoplay can stand down. */
  onInteract?: () => void;
}) {
  const reduce = useCalmMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(sweep ? 100 : initialPos);
  const [sweeping, setSweeping] = useState(false);
  const dragging = useRef(false);

  const takeOver = useCallback(() => {
    setSweeping(false);
    onInteract?.();
  }, [onInteract]);

  useEffect(() => {
    if (!sweep) return;
    if (reduce) {
      // No wipe, but the result still has to be visible — parking at 100 would
      // leave these visitors looking at the original photo and nothing else.
      setPos(initialPos);
      return;
    }
    // Start from the original, hold a beat, then wipe the result across.
    setPos(100);
    setSweeping(false);
    const startAt = setTimeout(() => {
      setSweeping(true);
      setPos(0);
    }, SWEEP_LEAD_IN_MS);
    const endAt = setTimeout(() => {
      setSweeping(false);
      onSweepEnd?.();
    }, SWEEP_LEAD_IN_MS + sweepMs);
    return () => {
      clearTimeout(startAt);
      clearTimeout(endAt);
    };
  }, [sweep, sweepMs, reduce, initialPos, onSweepEnd]);

  const updateFromClientX = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(100, Math.max(0, pct)));
  }, []);

  const glide = sweeping ? `${sweepMs}ms cubic-bezier(0.65, 0, 0.35, 1)` : undefined;

  return (
    <div
      ref={containerRef}
      // Framing (rounding, border) is the caller's — it sits inside a card on
      // the outfits page and stands alone in the hero.
      className={`relative aspect-[3/4] w-full overflow-hidden bg-veil select-none touch-none cursor-ew-resize ${className}`}
      onPointerDown={(e) => {
        dragging.current = true;
        takeOver();
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        updateFromClientX(e.clientX);
      }}
      onPointerMove={(e) => {
        if (dragging.current) updateFromClientX(e.clientX);
      }}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      {/* before (original) */}
      <img
        src={beforeSrc}
        alt="Original photo"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      {/* after (result), clipped from the left */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: `inset(0 0 0 ${pos}%)`,
          transition: glide && `clip-path ${glide}`,
        }}
      >
        <img
          src={afterSrc}
          alt="Try-on result"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* labels */}
      <span
        className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/70 text-white text-[0.72rem] font-semibold tracking-wide backdrop-blur transition-opacity"
        style={{ opacity: pos > 12 ? 1 : 0 }}
      >
        ORIGINAL
      </span>
      <span
        className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/70 text-white text-[0.72rem] font-semibold tracking-wide backdrop-blur transition-opacity"
        style={{ opacity: pos < 88 ? 1 : 0 }}
      >
        TRY-ON
      </span>

      {/* handle */}
      <div
        role="slider"
        aria-label="Compare original and try-on result"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        /**
         * `pos` is the handle's position, so the original occupies 0…pos and
         * the result occupies pos…100 — `clipPath: inset(0 0 0 pos%)` clips the
         * result from the left *by* pos%. This used to announce
         * "`pos`% of the try-on result shown", which is exactly inverted: at
         * pos=100 a screen-reader user heard "100% of the result shown" while
         * none of it was visible, and ArrowRight announced an increase while
         * revealing less. Say both sides so the direction can't be misread.
         */
        aria-valuetext={`${Math.round(pos)}% original, ${
          100 - Math.round(pos)
        }% try-on result`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
          takeOver();
          if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 4));
          if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 4));
          if (e.key === "Home") setPos(0);
          if (e.key === "End") setPos(100);
        }}
        // The focusable element is a 44px-wide transparent column centred on the
        // split, not the hairline itself — the divider used to *be* the slider,
        // which made the keyboard and pointer target 2px wide on the component
        // the whole product is built around. The visible line is a child.
        className="absolute inset-y-0 -ml-[22px] w-11"
        style={{ left: `${pos}%`, transition: glide && `left ${glide}` }}
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-1/2 -ml-px w-0.5 bg-white shadow-[0_0_12px_rgba(11,11,12,0.35)]"
        />
        <motion.span
          initial={reduce ? false : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 22, delay: 0.15 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 grid place-items-center w-11 h-11 rounded-full bg-white shadow-lg text-black"
        >
          <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 8l-4 4 4 4M16 8l4 4-4 4" />
          </svg>
        </motion.span>
      </div>
    </div>
  );
}
