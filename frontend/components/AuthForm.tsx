"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { useAuth } from "@/lib/auth";
import { errorMessage, fetchServiceInfo } from "@/lib/api";
import { HangerMark } from "./Logo";
import FormError from "./FormError";

/** Reveal control for a password field. Both fields share one shown state, so
 *  either toggle flips both — each field still needs its own affordance. */
function RevealToggle({
  shown,
  onToggle,
}: {
  shown: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? "Hide password" : "Show password"}
      aria-pressed={shown}
      className="absolute inset-y-0 right-1.5 my-auto grid place-items-center w-11 h-11 rounded-full text-stone hover:text-ink hover:bg-veil transition-colors"
    >
      <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {shown ? (
          <>
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </>
        ) : (
          <>
            <path d="M3 3l18 18" />
            <path d="M10.6 10.6a3 3 0 0 0 4.2 4.2" />
            <path d="M9.4 5.2A9.5 9.5 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.2 6.2A17 17 0 0 0 2 12s3.5 7 10 7a9.5 9.5 0 0 0 3-.5" />
          </>
        )}
      </svg>
    </button>
  );
}

/** The one route to an invite code, shared by sign-up and the reset stub. */
export const REQUEST_ACCESS_MAILTO =
  "mailto:pocile703@gmail.com?subject=StyleFit%20AI%20%E2%80%94%20invite%20code%20request";

function AuthFormInner({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduce = useReducedMotion();
  const { login, register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [inviteRequired, setInviteRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isLogin = mode === "login";
  const next = searchParams.get("next") || "/try-on";

  // Only the public deployment gates sign-up; locally the field would be noise.
  useEffect(() => {
    if (isLogin) return;
    let live = true;
    fetchServiceInfo().then((info) => {
      if (live) setInviteRequired(info.signupRequiresInvite);
    });
    return () => {
      live = false;
    };
  }, [isLogin]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLogin && password !== confirm) {
      setError("Those passwords don't match. Re-enter them to continue.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password, inviteCode);
      }
      router.push(next);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <main id="main-content" tabIndex={-1} className="flex-1 grid place-items-center px-5 py-16">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        <div className="text-center">
          <span className="inline-grid place-items-center w-12 h-12 rounded-2xl bg-noir text-paper">
            <HangerMark className="w-7 h-7" />
          </span>
          <h1 className="mt-5 font-display font-semibold text-3xl tracking-tight">
            {isLogin ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-stone text-sm">
            {isLogin
              ? "Log in to see your saved outfits."
              : "Sign up to save and revisit your try-on looks."}
          </p>
        </div>

        <form onSubmit={submit} className="mt-8 flex flex-col gap-3.5">
          {!isLogin && (
            <label className="block">
              <span className="block mb-1.5 text-sm font-medium">Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                className="w-full px-5 py-3 rounded-full border border-mist bg-card/70 focus:border-noir transition-colors"
                placeholder="Your name"
              />
            </label>
          )}
          <label className="block">
            <span className="block mb-1.5 text-sm font-medium">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-5 py-3 rounded-full border border-mist bg-card/70 focus:border-noir transition-colors"
              placeholder="you@example.com"
            />
          </label>
          <label className="block">
            <span className="block mb-1.5 text-sm font-medium">Password</span>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="w-full pl-5 pr-12 py-3 rounded-full border border-mist bg-card/70 focus:border-noir transition-colors"
                placeholder={isLogin ? "Your password" : "At least 6 characters"}
              />
              <RevealToggle shown={showPw} onToggle={() => setShowPw((v) => !v)} />
            </div>
          </label>

          {!isLogin && (
            <label className="block">
              <span className="block mb-1.5 text-sm font-medium">
                Confirm password
              </span>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full pl-5 pr-12 py-3 rounded-full border border-mist bg-card/70 focus:border-noir transition-colors"
                  placeholder="Re-enter your password"
                />
                <RevealToggle shown={showPw} onToggle={() => setShowPw((v) => !v)} />
              </div>
            </label>
          )}

          {!isLogin && inviteRequired && (
            <label className="block">
              <span className="block mb-1.5 text-sm font-medium">Invite code</span>
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                required
                autoComplete="off"
                className="w-full px-5 py-3 rounded-full border border-mist bg-card/70 focus:border-noir transition-colors"
                placeholder="The code you were given"
              />
              <span className="mt-1.5 block text-xs text-stone">
                Every try-on runs on a paid AI service, so accounts are handed out by
                code while this is a student project.{" "}
                {/* Without this there is no door: the gate is announced but
                    nothing anywhere tells a visitor how to get through it. */}
                <a
                  href={REQUEST_ACCESS_MAILTO}
                  className="inline-flex items-center min-h-11 font-medium text-ink underline underline-offset-2"
                >
                  Ask for a code
                </a>{" "}
                and you&apos;ll get one back by email.
              </span>
            </label>
          )}

          {isLogin && (
            <div className="-mt-1 text-right">
              <Link
                href="/forgot-password"
                className="inline-flex items-center min-h-11 text-xs font-medium text-stone hover:text-ink transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          )}

          <FormError message={error} />

          <motion.button
            type="submit"
            disabled={busy}
            whileTap={busy ? undefined : { scale: 0.98 }}
            className="mt-2 w-full py-3.5 rounded-full bg-noir text-paper font-medium hover:bg-noir-deep transition-colors disabled:opacity-60"
          >
            {busy ? "One moment…" : isLogin ? "Log in" : "Sign up"}
          </motion.button>
        </form>

        <p className="mt-6 text-center text-sm text-stone">
          {isLogin ? (
            <>
              New to StyleFit?{" "}
              <Link href={`/signup?next=${encodeURIComponent(next)}`} className="inline-flex items-center justify-center min-h-11 min-w-11 px-1 font-medium text-noir hover:text-noir-deep">
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href={`/login?next=${encodeURIComponent(next)}`} className="inline-flex items-center justify-center min-h-11 min-w-11 px-1 font-medium text-noir hover:text-noir-deep">
                Log in
              </Link>
            </>
          )}
        </p>
      </motion.div>
    </main>
  );
}

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  return (
    <Suspense fallback={null}>
      <AuthFormInner mode={mode} />
    </Suspense>
  );
}
