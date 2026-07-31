import Link from "next/link";

/**
 * The one place the 44px tap-target floor lives.
 *
 * The project has stated "44px, enforced site-wide" through three audits, and
 * three times the rule was re-applied by hand to whichever elements that audit
 * happened to measure — so it held on the nav and the footer and quietly failed
 * on the undo toast, the mobile menu and every workroom pill. A rule that is
 * re-derived per call site is not a rule. Route actions through this and the
 * floor is structural: `min-h-11` is not overridable from the outside, because
 * `className` is appended for layout only.
 *
 * Geometry follows DESIGN.md §5 — pills for every action, in both registers.
 */

type Variant = "primary" | "secondary" | "ghost" | "inverse" | "link";
type Size = "default" | "compact" | "none";

const VARIANTS: Record<Variant, string> = {
  // Primary action. Darkens and lifts on hover per DESIGN.md §5.
  primary:
    "bg-noir text-paper hover:bg-noir-deep disabled:bg-transparent disabled:border disabled:border-mist disabled:text-stone disabled:cursor-not-allowed",
  // Secondary: hairline that firms up on hover.
  secondary:
    "border border-mist hover:border-ink disabled:text-stone disabled:cursor-not-allowed",
  // Quiet control — icon rows, menu items, anything that shouldn't compete.
  ghost: "text-stone hover:text-ink hover:bg-veil",
  // For use *on* an ink surface (the undo toast, overlays on dark fills).
  inverse: "bg-paper/15 text-paper hover:bg-paper/25",
  // Text-weight action. Still a 44px target — that's the whole point.
  link: "text-stone underline underline-offset-4 hover:text-ink",
};

const SIZES: Record<Size, string> = {
  default: "px-5",
  compact: "px-4",
  none: "",
};

const BASE =
  "inline-flex items-center justify-center gap-2 min-h-11 rounded-full text-sm font-medium transition-colors";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

type ButtonProps = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: undefined;
  };

type LinkProps = CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children" | "href"> & {
    /** Renders a Next `Link` (internal) or a plain anchor (mailto:, external). */
    href: string;
  };

export default function Button(props: ButtonProps | LinkProps) {
  const {
    variant = "primary",
    size = "default",
    className = "",
    children,
    ...rest
  } = props;

  const classes = `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`;

  if (typeof props.href === "string") {
    const { href, ...anchorRest } = rest as LinkProps;
    // mailto:/tel:/absolute URLs aren't routes — Link would try to prefetch them.
    const external = /^[a-z]+:/i.test(href) && !href.startsWith("/");
    if (external) {
      return (
        <a href={href} className={classes} {...anchorRest}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} {...anchorRest}>
        {children}
      </Link>
    );
  }

  const { type = "button", ...buttonRest } = rest as ButtonProps;
  return (
    <button type={type} className={classes} {...buttonRest}>
      {children}
    </button>
  );
}
