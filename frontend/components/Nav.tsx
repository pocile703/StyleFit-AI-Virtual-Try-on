"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "motion/react";
import Logo from "./Logo";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import Avatar from "./Avatar";

// Global site nav only. Account-scoped destinations (Outfits, Profile, Log out)
// live in the AppShell sidebar + the avatar cluster, so they aren't duplicated
// on the authed pages.
const LINKS = [
  { href: "/", label: "Home" },
  { href: "/try-on", label: "Try On" },
  { href: "/about", label: "About" },
];

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="grid place-items-center w-11 h-11 rounded-full text-stone hover:text-ink hover:bg-veil transition-colors"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={dark ? "moon" : "sun"}
          initial={{ rotate: -60, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 60, opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.25 }}
          className="grid place-items-center"
        >
          {dark ? (
            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          )}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

export default function Nav() {
  const pathname = usePathname();
  const { user, ready, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 8));

  return (
    <header
      className={`sticky top-0 z-[var(--z-sticky)] border-b transition-[background-color,backdrop-filter,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        scrolled
          ? "bg-paper/70 backdrop-blur-xl border-transparent shadow-[var(--shadow-ambient)]"
          : "bg-paper/85 backdrop-blur-md border-mist"
      }`}
    >
      <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between gap-4">
        <Logo />

        <nav className="hidden md:flex items-center gap-1" aria-label="Main">
          {LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3.5 py-2 text-sm font-medium rounded-full transition-colors ${
                  active ? "text-ink" : "text-stone hover:text-ink"
                }`}
              >
                {link.label}
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-x-2 -bottom-[1px] h-[3px] bg-accent rounded-full shadow-[0_0_10px_var(--color-accent-glow)]"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          {!ready ? null : user ? (
            <>
              <Link
                href="/profile"
                className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full hover:bg-veil transition-colors"
              >
                <Avatar user={user} size="sm" />
                <span className="text-sm font-medium">{user.name.split(" ")[0]}</span>
              </Link>
              <button
                onClick={logout}
                className="px-3.5 py-2 text-sm font-medium text-stone hover:text-ink transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium rounded-full border border-mist hover:border-stone transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 text-sm font-medium rounded-full bg-noir text-paper hover:bg-noir-deep transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        <div className="md:hidden flex items-center gap-1">
        <ThemeToggle />
        <button
          className="grid place-items-center w-11 h-11 rounded-lg hover:bg-veil"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="md:hidden overflow-hidden border-t border-mist"
            aria-label="Mobile"
          >
            <div className="px-5 py-3 flex flex-col gap-1">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-veil"
                >
                  {link.label}
                </Link>
              ))}
              <div className="h-px bg-mist my-2" />
              {user ? (
                <>
                  <Link
                    href="/outfits"
                    onClick={() => setOpen(false)}
                    className="px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-veil"
                  >
                    My Outfits
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-veil"
                  >
                    Profile — {user.name}
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setOpen(false);
                    }}
                    className="px-3 py-2.5 rounded-lg text-sm font-medium text-left text-stone hover:bg-veil"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <div className="flex gap-2 px-3 py-2">
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="flex-1 text-center px-4 py-2 text-sm font-medium rounded-full border border-mist"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setOpen(false)}
                    className="flex-1 text-center px-4 py-2 text-sm font-medium rounded-full bg-noir text-paper"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
