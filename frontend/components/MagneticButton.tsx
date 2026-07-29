"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "motion/react";

interface MagneticButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  /** Optional trailing glyph rendered inside its own nested circle (Button-in-Button). */
  icon?: React.ReactNode;
  /** Tint for the nested icon circle — set to match the button's own fill. */
  iconWrapClassName?: string;
  /** Max pixels the content pulls toward the cursor. */
  strength?: number;
  /** Inverted ink fill wipes up from the bottom on hover (marketing accent). */
  accent?: boolean;
}

/**
 * A pill link that leans toward the pointer (magnetic hover) and presses on tap.
 * Monochrome by design — no color, the pull IS the flourish. Under reduced motion
 * it renders a plain, static link with no transforms.
 */
export default function MagneticButton({
  href,
  children,
  className = "",
  icon,
  iconWrapClassName = "bg-paper/15",
  strength = 6,
  accent = false,
}: MagneticButtonProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 250, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 250, damping: 18, mass: 0.4 });

  function onMove(e: React.PointerEvent) {
    if (reduce || e.pointerType === "touch") return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const relY = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    x.set(Math.max(-1, Math.min(1, relX)) * strength);
    y.set(Math.max(-1, Math.min(1, relY)) * strength);
  }

  function reset() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.span
      style={reduce ? undefined : { x: sx, y: sy }}
      className="inline-block"
      whileTap={reduce ? undefined : { scale: 0.97 }}
    >
      <Link
        ref={ref}
        href={href}
        onPointerMove={onMove}
        onPointerLeave={reset}
        className={`group/mag relative isolate inline-flex items-center gap-2 overflow-hidden ${className}`}
      >
        {accent && (
          <span
            aria-hidden="true"
            className="absolute inset-0 -z-10 translate-y-full bg-accent transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/mag:translate-y-0"
          />
        )}
        <span className={accent ? "transition-colors duration-300 group-hover/mag:text-paper" : ""}>
          {children}
        </span>
        {icon && (
          <span className={`grid place-items-center w-8 h-8 rounded-full transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/mag:translate-x-0.5 group-hover/mag:-translate-y-px group-hover/mag:scale-105 ${iconWrapClassName}`}>
            {icon}
          </span>
        )}
      </Link>
    </motion.span>
  );
}
