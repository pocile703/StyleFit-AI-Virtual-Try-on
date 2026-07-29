"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";

const LOOKS = [
  { src: "/demo/tee-graphite.svg", label: "Graphite Crew Tee" },
  { src: "/demo/jacket-camel.svg", label: "Camel Utility Jacket" },
  { src: "/demo/hoodie-black.svg", label: "Black Oversized Hoodie" },
  { src: "/demo/sweater-cream.svg", label: "Cream Knit Sweater" },
];

const SWAP_MS = 2600;

/**
 * Hero demo card: an abstract "photo" of a person that cycles garments with
 * a scan-line sweep — the same transformation ritual used in the real wizard.
 * Pauses on hover; renders a single static look under reduced motion.
 */
export default function TryOnDemo() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reduce || paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % LOOKS.length), SWAP_MS);
    return () => clearInterval(id);
  }, [reduce, paused]);

  const look = LOOKS[index];

  return (
    <div
      className="relative w-full max-w-sm mx-auto select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* photo card — token-driven so it inverts in dark mode (was hardcoded
          light hexes that stayed pale on a near-black page) */}
      <div className="relative aspect-[3/4] rounded-3xl overflow-hidden border border-mist bg-gradient-to-b from-veil via-veil to-mist shadow-[0_24px_60px_-24px_rgba(11,11,12,0.3)]">
        {/* person silhouette — currentColor off text-stone + per-shape opacity,
            a ghostly figure that inverts with the theme */}
        <svg
          viewBox="0 0 300 400"
          className="absolute inset-0 w-full h-full text-stone"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="tdm-body" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="currentColor" style={{ stopOpacity: "calc(var(--figure-body) + 0.11)" }} />
              <stop offset="1" stopColor="currentColor" style={{ stopOpacity: "var(--figure-body)" }} />
            </linearGradient>
          </defs>
          <ellipse cx="150" cy="470" rx="150" ry="90" fill="currentColor" style={{ fillOpacity: "var(--figure-shadow)" }} />
          {/* head + neck + shoulders as one connected form */}
          <circle cx="150" cy="88" r="36" fill="currentColor" style={{ fillOpacity: "calc(var(--figure-head) + 0.08)" }} />
          <path
            d="M138 116 L138 138 Q118 142 102 152 Q76 168 70 206 L62 400 L238 400 L230 206 Q224 168 198 152 Q182 142 162 138 L162 116 Q156 122 150 122 Q144 122 138 116 Z"
            fill="url(#tdm-body)"
          />
        </svg>

        {/* garment overlay swap */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.img
            key={look.src}
            src={look.src}
            alt=""
            className="absolute left-1/2 top-[31%] w-[62%] -translate-x-1/2 drop-shadow-[0_10px_18px_rgba(11,11,12,0.18)]"
            initial={reduce ? false : { opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          />
        </AnimatePresence>

        {/* scan line */}
        {!reduce && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="scan-line absolute left-0 right-0 h-10 bg-gradient-to-b from-transparent via-noir/25 to-transparent" />
          </div>
        )}

        {/* corner brackets — viewfinder feel */}
        <svg className="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] pointer-events-none text-noir" viewBox="0 0 100 133" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 8 V0 H6 M94 0 H100 V8 M100 125 V133 H94 M6 133 H0 V125" stroke="currentColor" strokeWidth="1.8" fill="none" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
        </svg>

        {/* garment label chip — pinned inside the photo card */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={look.label}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-2 rounded-full bg-black/80 backdrop-blur text-white text-xs font-medium shadow-lg"
          >
            {look.label}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* look switcher dots */}
      <div className="mt-5 flex justify-center gap-2.5">
        {LOOKS.map((l, i) => (
          <button
            key={l.src}
            aria-label={`Show ${l.label}`}
            aria-current={i === index}
            onClick={() => setIndex(i)}
            className="group/dot grid place-items-center h-11 min-w-11"
          >
            <span
              className={`h-2 rounded-full transition-[width,background-color] duration-300 ${
                i === index
                  ? "w-6 bg-noir"
                  : "w-2 bg-mist group-hover/dot:bg-stone"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
