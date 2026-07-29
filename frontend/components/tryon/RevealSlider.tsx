"use client";

import { useCallback, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * Draggable before/after comparison. Left of the handle shows the original
 * photo, right shows the try-on result. Keyboard accessible (arrow keys).
 */
export default function RevealSlider({
  beforeSrc,
  afterSrc,
  /** Off-centre reads as draggable; dead centre reads as a static split. */
  initialPos = 50,
  className = "",
}: {
  beforeSrc: string;
  afterSrc: string;
  initialPos?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(initialPos);
  const dragging = useRef(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(100, Math.max(0, pct)));
  }, []);

  return (
    <div
      ref={containerRef}
      // Framing (rounding, border) is the caller's — it sits inside a card on
      // the outfits page and stands alone in the hero.
      className={`relative aspect-[3/4] w-full overflow-hidden bg-veil select-none touch-none cursor-ew-resize ${className}`}
      onPointerDown={(e) => {
        dragging.current = true;
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
        style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
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
        aria-valuetext={`${Math.round(pos)}% of the try-on result shown`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 4));
          if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 4));
          if (e.key === "Home") setPos(0);
          if (e.key === "End") setPos(100);
        }}
        className="absolute inset-y-0 -ml-px w-0.5 bg-white shadow-[0_0_12px_rgba(11,11,12,0.35)]"
        style={{ left: `${pos}%` }}
      >
        <motion.span
          initial={reduce ? false : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 22, delay: 0.15 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 grid place-items-center w-10 h-10 rounded-full bg-white shadow-lg text-black"
        >
          <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 8l-4 4 4 4M16 8l4 4-4 4" />
          </svg>
        </motion.span>
      </div>
    </div>
  );
}
