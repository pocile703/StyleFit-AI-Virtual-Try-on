"use client";

import { useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useReducedMotion,
  useMotionValueEvent,
  useTransform,
} from "motion/react";

interface Look {
  /** Garment flat-lay overlaid on the silhouette placeholder. */
  garment: string;
  label: string;
  /** When set (future), a full look photo replaces the silhouette+garment 1:1. */
  image?: string;
}

const LOOKS: Look[] = [
  { garment: "/demo/tee-graphite.svg", label: "Graphite Crew Tee" },
  { garment: "/demo/jacket-camel.svg", label: "Camel Utility Jacket" },
  { garment: "/demo/dress-noir.svg", label: "Noir Slip Dress" },
  { garment: "/demo/hoodie-black.svg", label: "Black Oversized Hoodie" },
];

/**
 * The page's only <h1>. It lives inside the hero so the first viewport states
 * what the page is, instead of opening on a bare figure.
 */
function Headline() {
  return (
    <h1 className="mt-4 font-display font-semibold text-3xl sm:text-4xl md:text-5xl tracking-tight text-balance">
      Fashion you can preview on{" "}
      <span className="bg-accent text-paper px-2 leading-tight">yourself.</span>
    </h1>
  );
}

/**
 * One look. Today: a monochrome body silhouette with the garment laid over the
 * torso. Future: set `look.image` to a real full try-on photo and it renders that
 * single image instead — same footprint, no structural change.
 */
function LookFigure({ look }: { look: Look }) {
  if (look.image) {
    return (
      <div className="relative w-48 sm:w-56 md:w-64 lg:w-72 aspect-[3/4] mx-auto rounded-3xl overflow-hidden border border-mist bg-veil">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={look.image}
          alt={look.label}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    );
  }
  return (
    <div className="relative w-48 sm:w-56 md:w-64 lg:w-72 aspect-[3/4] mx-auto">
      <svg
        viewBox="0 0 300 400"
        className="absolute inset-0 w-full h-full text-stone"
        aria-hidden="true"
      >
        <circle cx="150" cy="78" r="34" fill="currentColor" style={{ fillOpacity: "var(--figure-head)" }} />
        <path
          d="M138 106 Q116 112 102 126 Q78 148 72 202 L64 400 L236 400 L228 202 Q222 148 198 126 Q184 112 162 106 Z"
          fill="currentColor"
          style={{ fillOpacity: "var(--figure-body)" }}
        />
      </svg>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={look.garment}
        alt=""
        className="absolute left-1/2 top-[24%] w-[62%] -translate-x-1/2 drop-shadow-[0_10px_20px_rgba(11,11,12,0.16)]"
      />
    </div>
  );
}

export default function HeroShowcase() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const [index, setIndex] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    // looks are spread evenly across the section: 0 … 1 over (n-1) steps
    const i = Math.round(v * (LOOKS.length - 1));
    setIndex(Math.min(LOOKS.length - 1, Math.max(0, i)));
  });

  // subtle scroll parallax on the figure, and a scroll cue that fades early
  const figureY = useTransform(scrollYProgress, [0, 1], [26, -26]);
  const cueOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);

  // Reduced motion: a calm, normal-height band — no pin, no scrub.
  if (reduce) {
    return (
      <section className="mx-auto max-w-3xl px-5 pt-16 pb-4 text-center">
        <p className="eyebrow text-stone">About the project</p>
        <Headline />
        <LookFigure look={LOOKS[0]} />
        <p className="mt-6 text-sm text-stone">
          See any look on a figure — the full version changes outfits as you
          scroll.
        </p>
      </section>
    );
  }

  return (
    <section ref={ref} className="relative h-[120dvh]">
      <div className="sticky top-0 min-h-[100dvh] overflow-hidden flex flex-col items-center justify-center gap-6 px-5 py-16">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="eyebrow text-stone">About the project</p>
          <Headline />
        </motion.div>

        {/* the swapping look */}
        <motion.div style={{ y: figureY }} className="w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 22, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <LookFigure look={LOOKS[index]} />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* garment name, synced to scroll */}
        <div className="h-9">
          <AnimatePresence mode="wait">
            <motion.span
              key={LOOKS[index].label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="inline-block whitespace-nowrap px-4 py-2 rounded-full bg-accent text-paper text-sm font-medium"
            >
              {LOOKS[index].label}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* scroll cue — fades out as the section takes over */}
        <motion.div
          aria-hidden="true"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-stone"
          style={{ opacity: cueOpacity }}
        >
          <span className="text-xs font-medium tracking-wide">
            Scroll to change looks
          </span>
          <motion.svg
            viewBox="0 0 24 24"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{ y: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
          >
            <path d="M12 5v14M6 13l6 6 6-6" />
          </motion.svg>
        </motion.div>
      </div>
    </section>
  );
}
