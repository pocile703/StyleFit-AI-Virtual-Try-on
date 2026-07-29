import Link from "next/link";

export function HangerMark({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 4.5a2 2 0 1 1 2 2c-.9.3-1.4 1-1.4 1.9v.4l8.1 5.6c1.2.8.6 2.6-.8 2.6H4.1c-1.4 0-2-1.8-.8-2.6l8.1-5.6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 text-ink hover:opacity-80 transition-opacity"
    >
      <span className="grid place-items-center w-8 h-8 rounded-lg bg-noir text-paper">
        <HangerMark className="w-5 h-5" />
      </span>
      {!compact && (
        <span className="font-display font-semibold text-lg tracking-tight">
          StyleFit <span className="text-ash">AI</span>
        </span>
      )}
    </Link>
  );
}
