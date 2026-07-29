import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Password reset — StyleFit AI" };

export default function ForgotPasswordPage() {
  return (
    <main id="main-content" tabIndex={-1} className="flex-1 grid place-items-center px-5 py-16">
      <div className="w-full max-w-sm text-center">
        <span className="inline-grid place-items-center w-12 h-12 rounded-2xl bg-noir text-paper">
          <svg
            viewBox="0 0 24 24"
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </span>
        <h1 className="mt-5 font-display font-semibold text-3xl tracking-tight">
          Password reset
        </h1>
        <p className="mt-3 text-stone text-sm leading-relaxed">
          Self-serve password reset isn&apos;t available in this project build
          yet. For now, sign in with the password you set — or create a new
          account to keep exploring.
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <Link
            href="/login"
            className="px-6 py-3 rounded-full bg-noir text-paper font-medium hover:bg-noir-deep transition-colors"
          >
            Back to log in
          </Link>
          <Link
            href="/signup"
            className="px-6 py-3 rounded-full border border-mist font-medium hover:border-ink transition-colors"
          >
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
