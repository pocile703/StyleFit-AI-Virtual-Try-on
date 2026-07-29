"use client";

import { motion } from "motion/react";
import { useCalmMotion } from "@/lib/useHydrated";

/**
 * App-Router route transition. `template.tsx` remounts on every navigation, so a
 * plain enter animation crossfades each new route in. Reduced motion → instant.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useCalmMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
