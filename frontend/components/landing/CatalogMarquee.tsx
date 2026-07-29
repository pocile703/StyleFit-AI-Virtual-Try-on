"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  useAnimationFrame,
  useMotionValue,
  wrap,
} from "motion/react";
import { EXTRA_GARMENTS, LOOKS } from "@/lib/looks";
import { useCalmMotion } from "@/lib/useHydrated";

// The same garments the try-on catalog serves, so "Try it →" leads somewhere
// that looks like what was clicked.
const TRIED = LOOKS.map((l) => ({ src: l.garment, name: l.label, category: l.category }));
const OTHERS = EXTRA_GARMENTS.map((g) => ({
  src: g.garment,
  name: g.label,
  category: g.category,
}));

/**
 * Alternate the two sets rather than running one after the other. The looks
 * with try-on results are nearly all black tees, so grouping them puts six
 * near-identical tiles in a row.
 */
const ITEMS = Array.from(
  { length: Math.max(TRIED.length, OTHERS.length) },
  (_, i) => [TRIED[i], OTHERS[i]]
)
  .flat()
  .filter(Boolean);

const HALF = Math.floor(ITEMS.length / 2);
const SECOND_ROW = [...ITEMS.slice(HALF), ...ITEMS.slice(0, HALF)];

function GarmentCard({ item }: { item: (typeof ITEMS)[number] }) {
  return (
    <Link
      href="/try-on?step=clothing"
      draggable={false}
      className="group relative shrink-0 w-44 sm:w-52 rounded-2xl border border-mist bg-card/70 p-4 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-2 hover:border-accent hover:shadow-[0_18px_40px_-18px_var(--color-accent-glow)]"
      aria-label={`Try on the ${item.name}`}
    >
      <span className="block aspect-square rounded-xl bg-veil p-5 overflow-hidden">
        <img
          src={item.src}
          alt=""
          draggable={false}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-contain transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-rotate-3"
        />
      </span>
      <span className="mt-3 block text-sm font-medium leading-tight">
        {item.name}
      </span>
      <span className="mt-0.5 flex items-center justify-between text-xs text-stone">
        {item.category}
        <span className="inline-flex items-center gap-1 opacity-0 -translate-x-1 transition-[opacity,transform] duration-300 group-hover:opacity-100 group-hover:translate-x-0 [@media(hover:none)]:opacity-100 [@media(hover:none)]:translate-x-0 font-semibold text-ink">
          <span className="px-1.5 py-0.5 rounded-full bg-accent text-paper">Try it →</span>
        </span>
      </span>
    </Link>
  );
}

/**
 * A row that auto-advances, reacts to page-scroll velocity (speeds up + skews, and
 * flips direction with scroll direction), and can be dragged to scrub. It never
 * pauses on hover. `baseVelocity` sign sets the resting direction.
 */
function MarqueeRow({
  baseVelocity,
  items,
}: {
  baseVelocity: number;
  items: typeof ITEMS;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smooth = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smooth, [0, 1000], [0, 4], { clamp: false });
  const skew = useTransform(smooth, [-1500, 1500], [6, -6], { clamp: true });

  // Two copies of the list → wrap over -50%..0 loops seamlessly.
  const x = useTransform(baseX, (v) => `${wrap(-50, 0, v)}%`);
  const direction = useRef(1);
  const dragDelta = useRef(0);
  const dragging = useRef(false);
  // Total pointer travel since press — used to tell a scrub-drag from a tap so a
  // drag doesn't fall through into a card's link navigation.
  const dragDistance = useRef(0);

  useAnimationFrame((_, delta) => {
    let moveBy = direction.current * baseVelocity * (delta / 1000);
    const vf = velocityFactor.get();
    if (vf < 0) direction.current = -1;
    else if (vf > 0) direction.current = 1;
    moveBy += direction.current * moveBy * vf;
    if (!dragging.current) baseX.set(baseX.get() + moveBy + dragDelta.current);
    else baseX.set(baseX.get() + dragDelta.current);
    dragDelta.current = 0;
  });

  function onDown(e: React.PointerEvent) {
    dragging.current = true;
    dragDistance.current = 0;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function onMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    dragDistance.current += Math.abs(e.movementX);
    const w = trackRef.current?.offsetWidth ?? 1;
    // movementX in px → percent of the (2×) track width.
    dragDelta.current += (e.movementX / w) * 100;
  }
  function onUp(e: React.PointerEvent) {
    dragging.current = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  }
  // Capture phase fires before the card's <Link> click: if the pointer travelled
  // past the tap threshold, this was a scrub — cancel the navigation. A still tap
  // (no travel) falls through and opens the garment as before.
  function onClickCapture(e: React.MouseEvent) {
    if (dragDistance.current > 6) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  return (
    <motion.div
      ref={trackRef}
      style={{ x, skewX: skew }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onClickCapture={onClickCapture}
      className="flex gap-4 w-max cursor-grab active:cursor-grabbing select-none will-change-transform"
    >
      {[...items, ...items].map((item, i) => (
        <GarmentCard key={`${item.src}-${i}`} item={item} />
      ))}
    </motion.div>
  );
}

/**
 * Full-bleed catalog marquee. Two rows drift in opposite directions, react to
 * scroll velocity, and can be grabbed and scrubbed — never pausing on hover.
 * Reduced motion → a single plain scrollable row.
 */
export default function CatalogMarquee() {
  const reduce = useCalmMotion();

  if (reduce) {
    return (
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-4 px-5 w-max">
          {ITEMS.map((item) => (
            <GarmentCard key={item.src} item={item} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden space-y-4">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-28 z-10 bg-gradient-to-r from-paper to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-28 z-10 bg-gradient-to-l from-paper to-transparent" />
      <MarqueeRow baseVelocity={-2.4} items={ITEMS} />
      {/* offset so the two rows never sit garment-above-garment */}
      <MarqueeRow baseVelocity={2.4} items={SECOND_ROW} />
    </div>
  );
}
