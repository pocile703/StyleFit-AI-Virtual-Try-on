"use client";

import { motion, AnimatePresence } from "motion/react";

/**
 * The single error treatment for the whole app. Ink-based, not a second hue —
 * a small warning triangle plus `text-ink` copy, so it obeys the One-Ink Rule
 * and inverts correctly in dark mode. Renders nothing when `message` is null.
 */
export default function FormError({
  message,
  className = "",
}: {
  message: string | null;
  className?: string;
}) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          role="alert"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`flex items-start gap-2 text-sm font-medium text-ink ${className}`}
        >
          <svg
            viewBox="0 0 24 24"
            className="mt-[0.15em] w-4 h-4 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
          <span>{message}</span>
        </motion.p>
      )}
    </AnimatePresence>
  );
}
