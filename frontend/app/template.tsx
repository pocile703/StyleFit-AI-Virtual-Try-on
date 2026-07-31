"use client";

import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useCalmMotion } from "@/lib/useHydrated";

// Same split as SmoothScroll: the enter animation is an Electric Editorial
// flourish, so it belongs to the marketing surfaces. In the workroom it was
// stacking on top of the wizard's own 350ms step slide, which made every step
// change wait on two animations before the new step settled.
const MARKETING_ROUTES = new Set(["/", "/about"]);

/**
 * App-Router route transition. `template.tsx` remounts on every navigation, so a
 * plain enter animation crossfades each new route in. Reduced motion → instant.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useCalmMotion();
  const pathname = usePathname();
  const animate = !reduce && MARKETING_ROUTES.has(pathname);

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 12 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
