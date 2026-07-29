"use client";

import { motion } from "motion/react";
import { useCalmMotion } from "@/lib/useHydrated";

/** Scroll-triggered rise + fade. Wrap any block that should reveal on scroll. */
export default function Reveal({
  children,
  delay = 0,
  y = 28,
  blur = false,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  /** Distance the block rises from, in px. */
  y?: number;
  /** Add a soft blur-in for a heavier, more cinematic entrance. */
  blur?: boolean;
  className?: string;
}) {
  const reduce = useCalmMotion();
  return (
    <motion.div
      className={className}
      initial={
        reduce
          ? false
          : { opacity: 0, y, ...(blur ? { filter: "blur(8px)" } : {}) }
      }
      whileInView={{ opacity: 1, y: 0, ...(blur ? { filter: "blur(0px)" } : {}) }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: blur ? 0.75 : 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
