"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import TryOnDemo from "@/components/landing/TryOnDemo";
import CatalogMarquee from "@/components/landing/CatalogMarquee";
import Reveal from "@/components/Reveal";
import { Stagger, StaggerItem } from "@/components/Stagger";
import TiltCard from "@/components/TiltCard";
import MagneticButton from "@/components/MagneticButton";
import Footer from "@/components/Footer";
import { LOOKS, type Look } from "@/lib/looks";
import { fetchServiceInfo } from "@/lib/api";
import { useCalmMotion } from "@/lib/useHydrated";

const HEADLINE: { word: string; accent?: boolean }[] = [
  { word: "See" },
  { word: "yourself" },
  { word: "in" },
  { word: "every" },
  { word: "style.", accent: true },
];

const FEATURES = [
  {
    title: "Upload photo",
    body: "A clear, front-facing photo is all the system needs to work with.",
    icon: (
      <path d="M12 16V4m0 0L7 9m5-5l5 5M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    ),
  },
  {
    title: "Upload clothing",
    body: "Pick from the catalog or upload any clothing image you found online.",
    icon: <path d="M9 4l3 2 3-2 5 4-2 3-2-1v10H8V10L6 11 4 8l5-4z" />,
  },
  {
    title: "AI try-on",
    body: "The AI places the garment onto your photo in seconds.",
    icon: (
      <>
        <path d="M12 2 2 7l10 5 10-5-10-5z" />
        <path d="M2 12l10 5 10-5" />
      </>
    ),
  },
  {
    title: "Save & share",
    body: "Keep the looks you like and come back to compare them anytime.",
    icon: (
      <path d="M12 21s-7-4.6-9.3-9A5.4 5.4 0 0 1 12 6.3 5.4 5.4 0 0 1 21.3 12C19 16.4 12 21 12 21z" />
    ),
  },
];

const STEPS = [
  {
    n: "01",
    title: "Upload your photo",
    body: "Front-facing, good light, no sunglasses. The photo stays yours.",
  },
  {
    n: "02",
    title: "Choose a garment",
    body: "Browse the catalog, or drop in a product shot from any store you're already browsing.",
  },
  {
    n: "03",
    title: "Preview & save",
    body: "Drag the reveal slider to compare before and after, then save the look.",
  },
];

const SHOWCASE = [LOOKS[0], LOOKS[3], LOOKS[2]];

const ArrowGlyph = (
  <svg
    viewBox="0 0 24 24"
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/* One 3D card in the fan — owns its own scroll-linked transforms. */
function ShowcaseCard({
  look,
  offset,
  progress,
  rotate,
}: {
  look: Look;
  offset: number;
  progress: MotionValue<number>;
  rotate: MotionValue<number>;
}) {
  const x = useTransform(progress, [0.1, 0.7], [0, offset * 215]);
  const ry = useTransform(progress, [0.1, 0.7], [0, offset * 26]);
  const yy = useTransform(progress, [0.1, 0.7], [offset * 8, 0]);
  return (
    <motion.div
      style={{ x, y: yy, rotate, rotateY: ry, zIndex: 10 - Math.abs(offset) }}
      className="absolute inset-0 mx-auto w-52 h-64 overflow-hidden rounded-3xl border border-mist bg-card shadow-[var(--shadow-figure)]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={look.after}
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
    </motion.div>
  );
}

/* ── Pinned 3D scroll showcase ──────────────────────────── */
function Showcase3D() {
  // This section swaps its whole tree on the motion preference, which the
  // server can't know — so the swap waits until after hydration.
  const reduce = useCalmMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const headScale = useTransform(scrollYProgress, [0, 0.5], [0.94, 1]);
  const rotate = useTransform(scrollYProgress, [0, 1], [22, -8]);

  if (reduce) {
    // Still show the proof — the motion is what's reduced, not the evidence.
    // The ref stays attached here too: useScroll() above is already watching
    // it, and an unattached target logs "ref is defined but not hydrated".
    return (
      <section ref={ref} className="mx-auto max-w-6xl px-5 py-24 text-center">
        <h2 className="font-display font-semibold text-4xl md:text-6xl tracking-tight">
          See it on <span className="bg-accent px-2 text-paper">you.</span>
        </h2>
        <p className="mt-4 text-stone max-w-md mx-auto">
          Not a model, not a size chart — the actual garment on your own photo.
        </p>
        <div className="mt-10 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          {SHOWCASE.map((look) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={look.id}
              src={look.after}
              alt={`Try-on result: ${look.label}`}
              loading="lazy"
              decoding="async"
              className="aspect-[3/4] w-full rounded-2xl border border-mist object-cover"
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="relative h-[120dvh]">
      <div className="sticky top-0 min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden scene-3d px-5">
        <motion.h2
          style={{ scale: headScale }}
          className="relative z-10 text-center font-display font-semibold text-5xl leading-[0.95] sm:text-6xl md:text-7xl tracking-tight"
        >
          See it on{" "}
          <span className="inline-block ml-1 bg-accent text-paper px-3">you.</span>
        </motion.h2>
        <p className="relative z-10 mt-5 max-w-md text-center text-stone">
          Not a model, not a size chart — the actual garment on your own photo.
        </p>

        {/* 3D garment fan that spreads + rotates with scroll */}
        <div className="mt-12 sm:mt-16 scene-3d" aria-hidden="true">
          <div className="relative h-64 w-72 sm:w-[26rem]">
            {SHOWCASE.map((look, i) => (
              <ShowcaseCard
                key={look.id}
                look={look}
                offset={i - (SHOWCASE.length - 1) / 2}
                progress={scrollYProgress}
                rotate={rotate}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const reduce = useCalmMotion();
  const heroRef = useRef<HTMLElement>(null);
  // The closing CTA used to promise "Free to sign up" while the deployed API
  // gated registration behind an invite code — a visitor who believed the hero
  // hit a wall with no door at the highest-intent moment on the page. Ask the
  // API what's actually true rather than asserting either.
  const [inviteOnly, setInviteOnly] = useState<boolean | null>(null);
  useEffect(() => {
    let live = true;
    fetchServiceInfo().then((info) => {
      if (live) setInviteOnly(info.signupRequiresInvite);
    });
    return () => {
      live = false;
    };
  }, []);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const copyY = useTransform(scrollYProgress, [0, 1], [0, 48]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const demoY = useTransform(scrollYProgress, [0, 1], [0, -64]);

  return (
    <main id="main-content" tabIndex={-1} className="flex-1">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="mx-auto max-w-6xl px-5 pt-14 pb-20 md:pt-20 md:pb-28 grid md:grid-cols-[1.1fr_0.9fr] gap-12 md:gap-8 items-center"
      >
        <motion.div style={reduce ? undefined : { y: copyY, opacity: copyOpacity }}>
          <h1 className="font-display font-semibold text-5xl leading-[0.98] sm:text-7xl md:text-[5.5rem] tracking-[-0.03em] [perspective:800px]">
            {HEADLINE.map((part, i) => (
              <span
                key={part.word}
                className="inline-block overflow-hidden align-bottom mr-[0.22em] pb-[0.14em] -mb-[0.14em]"
              >
                <motion.span
                  className={`relative inline-block origin-bottom ${
                    part.accent ? "px-2 text-paper bg-accent" : ""
                  }`}
                  initial={reduce ? false : { y: "110%", rotateX: 65, opacity: 0 }}
                  animate={{ y: 0, rotateX: 0, opacity: 1 }}
                  transition={{
                    duration: 0.85,
                    delay: 0.1 + i * 0.09,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  {part.word}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            className="mt-6 text-lg text-stone max-w-md"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.6 }}
          >
            Upload your photo and any clothing image to instantly see how it
            looks on you — before you buy it.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-wrap items-center gap-3"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.72 }}
          >
            <MagneticButton
              href="/try-on"
              icon={ArrowGlyph}
              iconWrapClassName="bg-paper/15"
              accent
              className="pl-6 pr-2 py-2 rounded-full bg-noir text-paper font-medium transition-colors"
            >
              Start try-on
            </MagneticButton>
            <MagneticButton
              href="/try-on?step=clothing"
              strength={4}
              className="px-6 py-3 rounded-full border border-mist font-medium transition-colors hover:border-ink"
            >
              Browse the catalog
            </MagneticButton>
          </motion.div>
        </motion.div>

        <motion.div
          style={reduce ? undefined : { y: demoY }}
          initial={reduce ? false : { opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <TryOnDemo />
        </motion.div>
      </section>

      {/* ── Feature row ──────────────────────────────────── */}
      <section className="border-y border-mist bg-card/50">
        <h2 className="sr-only">How StyleFit works</h2>
        <Stagger className="mx-auto max-w-6xl px-5 py-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <StaggerItem key={f.title} className="h-full">
              <TiltCard className="p-6 rounded-2xl border border-mist bg-paper">
                <span className="grid place-items-center w-10 h-10 rounded-xl bg-veil text-noir transition-colors group-hover/tilt:bg-accent group-hover/tilt:text-paper">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {f.icon}
                  </svg>
                </span>
                <h3 className="mt-4 font-display font-medium text-lg">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-sm text-stone leading-relaxed">
                  {f.body}
                </p>
              </TiltCard>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ── 3D scroll showcase ───────────────────────────── */}
      <Showcase3D />

      {/* ── Catalog marquee ──────────────────────────────── */}
      <section className="py-20 md:py-24 overflow-hidden">
        <Reveal className="mx-auto max-w-6xl px-5" blur>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-stone">The catalog</p>
              <h2 className="mt-3 font-display font-semibold text-3xl md:text-5xl tracking-tight">
                Pieces waiting to be tried on.
              </h2>
            </div>
            <Link
              href="/try-on?step=clothing"
              className="inline-flex items-center min-h-11 text-sm font-medium hover:opacity-70 transition-opacity"
            >
              <span className="border-b-2 border-accent pb-0.5">
                Browse the full catalog
              </span>
            </Link>
          </div>
        </Reveal>
        <div className="mt-10">
          <CatalogMarquee />
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <Reveal blur>
          <h2 className="font-display font-semibold text-3xl md:text-5xl tracking-tight max-w-xl">
            Three steps from photo to outfit.
          </h2>
        </Reveal>

        <Stagger className="mt-12 grid md:grid-cols-3 gap-8 md:gap-6">
          {STEPS.map((s) => (
            <StaggerItem key={s.n}>
              <span className="inline-block font-display font-semibold text-6xl leading-none bg-accent text-paper px-2">
                {s.n}
              </span>
              <h3 className="mt-5 font-display font-medium text-xl">
                {s.title}
              </h3>
              <p className="mt-2 text-stone leading-relaxed max-w-xs">
                {s.body}
              </p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ── CTA band ─────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-24">
        <Reveal>
          {/* Two decorative layers used to sit here — a radial `accent-glow`
              wash and a sweeping `accent/25` shimmer. Both were written for the
              old cobalt accent; now that the accent aliases ink they render ink
              on ink in light mode and a near-white haze on a near-white band in
              dark. They were invisible in both themes, and would be banned
              decorative gradients if they weren't. */}
          <div className="relative overflow-hidden rounded-3xl bg-ink text-paper px-8 py-16 md:px-14 md:py-20 text-center">
            <h2 className="relative font-display font-semibold text-3xl md:text-5xl tracking-tight">
              Your next look is one upload away.
            </h2>
            <p className="relative mt-3 text-paper/70 max-w-md mx-auto">
              {inviteOnly
                ? "Accounts are invite-only while this runs on a paid AI service. "
                : inviteOnly === false
                  ? "Free to sign up. "
                  : ""}
              Your photo stays on your own account — never shown publicly or to
              other users.
            </p>
            <div className="relative mt-8 flex justify-center">
              <MagneticButton
                href="/try-on"
                icon={ArrowGlyph}
                iconWrapClassName="bg-ink/10"
                accent
                className="pl-7 pr-2.5 py-2.5 rounded-full bg-paper text-ink font-medium transition-colors"
              >
                Try it now
              </MagneticButton>
            </div>
          </div>
        </Reveal>
      </section>

      <Footer />
    </main>
  );
}
