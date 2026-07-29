"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "motion/react";
import Lenis from "lenis";

// Marketing surfaces only — the workroom (try-on/outfits/profile/auth) stays on
// native scroll per DESIGN.md §0 ("do not leak Lenis into the workroom").
const MARKETING_ROUTES = new Set(["/", "/about"]);

/**
 * Buttery smooth-scroll for the marketing surfaces, driving the scroll-linked 3D
 * and velocity effects. Completely disabled under prefers-reduced-motion — native
 * scroll takes over and every scroll-driven effect falls back to its static path.
 */
export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const pathname = usePathname();
  const marketing = MARKETING_ROUTES.has(pathname);

  useEffect(() => {
    if (reduce || !marketing) return;
    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => 1 - Math.pow(1 - t, 3), // ease-out-cubic
      smoothWheel: true,
    });
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [reduce, marketing]);

  return <>{children}</>;
}
