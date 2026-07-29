"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { useCalmMotion } from "@/lib/useHydrated";

/**
 * Pointer-driven 3D tilt card. Follows the cursor with a subtle rotate (≤9deg) on
 * a perspective plane and lifts an accent edge-glow on hover. Touch + reduced motion
 * render a plain static card (no transforms, no listeners).
 */
export default function TiltCard({
  children,
  className = "",
  max = 9,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
}) {
  const reduce = useCalmMotion();
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [max, -max]), {
    stiffness: 250,
    damping: 20,
  });
  const ry = useSpring(useTransform(px, [0, 1], [-max, max]), {
    stiffness: 250,
    damping: 20,
  });

  if (reduce) return <div className={className}>{children}</div>;

  function onMove(e: React.PointerEvent) {
    if (e.pointerType === "touch") return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  }
  function reset() {
    px.set(0.5);
    py.set(0.5);
  }

  return (
    <div className="scene-3d h-full">
      <motion.div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={reset}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        className={`group/tilt relative h-full transition-shadow duration-300 hover:shadow-[0_0_0_1px_var(--color-accent),0_18px_50px_-24px_var(--color-accent-glow)] ${className}`}
      >
        {children}
      </motion.div>
    </div>
  );
}
