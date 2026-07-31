"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { useCalmMotion } from "@/lib/useHydrated";

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
  /**
   * Fill that wipes up from the bottom on hover. It has to be the *opposite*
   * of the button's own fill or the hover is invisible: `bg-accent` aliases
   * `--color-ink`, so `wipe="ink"` on a `bg-noir` button wiped near-black over
   * near-black in light mode and near-white over near-white in dark, and the
   * only feedback left was a 2px icon nudge. Dark-filled button → `"paper"`,
   * light-filled button → `"ink"`.
   */
  wipe?: "ink" | "paper";
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
  wipe,
}: MagneticButtonProps) {
  const reduce = useCalmMotion();
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
        {wipe && (
          <span
            aria-hidden="true"
            className={`absolute inset-0 -z-10 translate-y-full transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/mag:translate-y-0 ${
              wipe === "paper" ? "bg-paper" : "bg-accent"
            }`}
          />
        )}
        <span
          className={
            wipe
              ? `transition-colors duration-300 ${
                  wipe === "paper"
                    ? "group-hover/mag:text-ink"
                    : "group-hover/mag:text-paper"
                }`
              : ""
          }
        >
          {children}
        </span>
        {icon && (
          // The icon disc is a translucent tint of the resting fill, so it has
          // to re-tint against the wiped surface or it disappears mid-hover.
          <span
            className={`grid place-items-center w-8 h-8 rounded-full transition-[transform,background-color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/mag:translate-x-0.5 group-hover/mag:-translate-y-px group-hover/mag:scale-105 ${iconWrapClassName} ${
              wipe === "paper"
                ? "group-hover/mag:bg-ink/10"
                : wipe === "ink"
                  ? "group-hover/mag:bg-paper/15"
                  : ""
            }`}
          >
            {icon}
          </span>
        )}
      </Link>
    </motion.span>
  );
}
