"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { useAuth } from "@/lib/auth";
import Avatar from "./Avatar";

const ITEMS = [
  {
    href: "/outfits",
    label: "My Outfits",
    icon: (
      <path d="M9 4l3 2 3-2 5 4-2 3-2-1v10H8V10L6 11 4 8l5-4z" />
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
      </>
    ),
  },
];

/** Sidebar layout for signed-in pages (per proposal sketches 5–6). */
export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, ready } = useAuth();

  if (!ready) {
    return (
      <main id="main-content" tabIndex={-1} className="flex-1 grid place-items-center py-24">
        <span
          role="status"
          aria-label="Loading"
          className="w-6 h-6 rounded-full border-2 border-noir border-t-transparent animate-spin motion-reduce:animate-none"
        />
      </main>
    );
  }

  if (!user) {
    return (
      <main id="main-content" tabIndex={-1} className="flex-1 grid place-items-center px-5 py-24 text-center">
        <div>
          <h1 className="font-display font-semibold text-2xl tracking-tight">
            This page is for members
          </h1>
          <p className="mt-2 text-stone text-sm max-w-xs mx-auto">
            Log in to see your saved outfits and profile.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href={`/login?next=${encodeURIComponent(pathname)}`}
              className="px-6 py-3 rounded-full bg-noir text-paper font-medium hover:bg-noir-deep transition-colors"
            >
              Log in
            </Link>
            <Link
              href={`/signup?next=${encodeURIComponent(pathname)}`}
              className="px-6 py-3 rounded-full border border-mist font-medium hover:border-ink transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="flex-1 mx-auto w-full max-w-6xl px-5 py-8 md:py-12 flex flex-col md:flex-row gap-8 md:gap-12">
      <aside className="md:w-52 shrink-0">
        <div className="flex items-center gap-3 px-2">
          <Avatar user={user} size="md" className="shrink-0" />
          <div className="min-w-0">
            <p className="font-medium truncate">{user.name}</p>
            <p className="text-xs text-stone truncate">{user.email}</p>
          </div>
        </div>

        <nav className="mt-6 flex md:flex-col gap-1" aria-label="Account">
          {ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex min-h-11 items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active ? "text-noir" : "text-stone hover:text-ink hover:bg-veil/60"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="shell-active"
                    className="absolute inset-0 rounded-xl bg-veil"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <svg
                  viewBox="0 0 24 24"
                  className="relative w-4.5 h-4.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {item.icon}
                </svg>
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main id="main-content" tabIndex={-1} className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
