"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import StepRail from "@/components/tryon/StepRail";
import Dropzone from "@/components/tryon/Dropzone";
import CatalogPicker from "@/components/tryon/CatalogPicker";
import ResultStage, { type GeneratedResult } from "@/components/tryon/ResultStage";
import TryOnSettings from "@/components/tryon/TryOnSettings";
import { fetchEngineInfo, imageUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  DEFAULT_CREDIT_RATES,
  DEFAULT_SETTINGS,
  creditCost,
  hydrateSettings,
  type CreditRates,
  type TryOnSettings as Settings,
} from "@/lib/tryon";

// Wizard state survives navigation (e.g. logging in mid-flow to save a look).
const STORAGE_KEY = "stylefit_wizard";
// The last uploaded photo persists across sessions so repeat visits can skip
// re-uploading — the server URL stays valid, unlike a per-session blob preview.
const LAST_PERSON_KEY = "stylefit_last_person";

const TIPS = [
  "Use a full-body photo, head to feet",
  "Use a well-lit, front-facing photo",
  "Face the camera directly",
  "No sunglasses or hats",
];

function TryOnWizard() {
  const searchParams = useSearchParams();
  const reduce = useReducedMotion();
  const { user } = useAuth();

  const [step, setStep] = useState(
    searchParams.get("step") === "clothing" ? 1 : 0
  );
  const [personUrl, setPersonUrl] = useState<string | null>(null);
  const [personPreview, setPersonPreview] = useState<string | null>(null);
  const [garmentUrl, setGarmentUrl] = useState<string | null>(null);
  const [garmentLabel, setGarmentLabel] = useState("Selected garment");
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [engineLive, setEngineLive] = useState(false);
  const [rates, setRates] = useState<CreditRates>(DEFAULT_CREDIT_RATES);
  const [runId, setRunId] = useState(0);
  const [lastPerson, setLastPerson] = useState<string | null>(null);
  // The finished run, tagged with the inputs that produced it. Stepping back to
  // change a photo used to throw the result away, and coming forward billed a
  // fresh generation for the same three inputs — an accidental way to spend
  // real credits and lose an unsaved look at the same time.
  const [result, setResult] = useState<
    (GeneratedResult & { key: string }) | null
  >(null);

  const runKey = JSON.stringify({ personUrl, garmentUrl, settings });
  const cachedResult = result?.key === runKey ? result : null;

  const keepResult = useCallback(
    (r: GeneratedResult) => setResult({ ...r, key: runKey }),
    [runKey]
  );

  // Advancing a step unmounts the button that had focus, dropping it to <body>
  // with nothing announcing the move. Focus lands on the new step's heading
  // instead — but never on first paint, which would yank a fresh visitor's
  // focus out of the page they just opened.
  const mounted = useRef(false);
  const focusHeading = useCallback((node: HTMLHeadingElement | null) => {
    if (!node) return;
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    node.focus();
  }, []);

  // Restore after mount (avoids SSR/client hydration mismatch).
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
      if (!saved) return;
      if (saved.personUrl) {
        setPersonUrl(saved.personUrl);
        setPersonPreview(imageUrl(saved.personUrl));
      }
      if (saved.garmentUrl) {
        setGarmentUrl(saved.garmentUrl);
        setGarmentLabel(saved.garmentLabel || "Selected garment");
      }
      if (saved.settings) setSettings(hydrateSettings(saved.settings));
    } catch {
      // corrupted state — start fresh
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ personUrl, garmentUrl, garmentLabel, settings })
    );
  }, [personUrl, garmentUrl, garmentLabel, settings]);

  // Credit costs are only shown when the paid engine is actually configured —
  // quoting a price against the offline mock would be a lie. The rates come
  // from the same response, so the number on the button is the server's, not a
  // constant compiled into the client.
  useEffect(() => {
    fetchEngineInfo()
      .then((info) => {
        setEngineLive(info.live);
        // The endpoint reports `{standard: 0, high: 0}` when the engine is off,
        // so a truthiness check would adopt zeros and quote "0 credits" the
        // moment a key was added. Only take rates that are actually priced.
        if (info.credits?.standard > 0 && info.credits?.high > 0) {
          setRates(info.credits);
        }
      })
      .catch(() => setEngineLive(false));
  }, []);


  // Remember the most recent photo across sessions (for the reuse shortcut).
  useEffect(() => {
    try {
      const v = localStorage.getItem(LAST_PERSON_KEY);
      if (v) setLastPerson(v);
    } catch {
      // storage unavailable — reuse shortcut just won't appear
    }
  }, []);

  useEffect(() => {
    if (!personUrl) return;
    try {
      localStorage.setItem(LAST_PERSON_KEY, personUrl);
    } catch {
      // ignore quota/availability failures
    }
    setLastPerson(personUrl);
  }, [personUrl]);

  // Forget the remembered photo — important on a shared device.
  const forgetLastPerson = () => {
    try {
      localStorage.removeItem(LAST_PERSON_KEY);
    } catch {
      // ignore
    }
    setLastPerson(null);
  };

  const slide = {
    initial: reduce ? {} : { opacity: 0, x: 42 },
    animate: { opacity: 1, x: 0 },
    exit: reduce ? {} : { opacity: 0, x: -42 },
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
  };

  return (
    <main id="main-content" tabIndex={-1} className="flex-1 mx-auto w-full max-w-6xl px-5 py-10 md:py-14">
      <StepRail current={step} onStepClick={(i) => setStep(i)} />

      <div className="mt-10 md:mt-14 overflow-x-clip">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.section key="photo" {...slide} aria-label="Upload your photo">
              <div className="max-w-xl mx-auto text-center">
                <h1
                  ref={focusHeading}
                  tabIndex={-1}
                  className="font-display font-semibold text-3xl md:text-4xl tracking-tight"
                >
                  Upload your photo
                </h1>
                <p className="mt-2 text-stone">
                  A full-body, front-facing photo gives the best try-on result.
                </p>
              </div>

              <div className="mt-8 max-w-md mx-auto">
                {user ? (
                  <Dropzone
                    label="Click to upload your photo"
                    onUploaded={(url, local) => {
                      setPersonUrl(url);
                      setPersonPreview(local);
                    }}
                    previewUrl={personPreview}
                  />
                ) : (
                  // Photos are stored against an account, so uploading needs
                  // one. Browsing the catalog doesn't — hence the second link.
                  <div className="rounded-2xl border border-mist bg-card/60 px-6 py-8 text-center">
                    <p className="font-medium">Sign in to upload your photo</p>
                    <p className="mt-1.5 text-sm text-stone leading-relaxed">
                      Your photo is kept on your own account, never shown
                      publicly or to other users.
                    </p>
                    <Link
                      href="/login?next=/try-on"
                      className="mt-5 inline-flex items-center px-6 py-3 rounded-full bg-noir text-paper font-medium hover:bg-noir-deep transition-colors"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/try-on?step=clothing"
                      onClick={() => setStep(1)}
                      className="mt-3 flex min-h-11 items-center justify-center text-sm font-medium text-stone underline underline-offset-4 hover:text-ink transition-colors"
                    >
                      Browse the catalog first
                    </Link>
                  </div>
                )}

                {user && lastPerson && !personUrl && (
                  <div className="mt-3 flex items-center gap-3 rounded-2xl border border-mist px-4 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        setPersonUrl(lastPerson);
                        setPersonPreview(imageUrl(lastPerson));
                      }}
                      className="flex flex-1 items-center gap-3 text-left"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl(lastPerson)}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover bg-veil"
                      />
                      <span className="text-sm font-medium">Use your previous photo</span>
                      <span className="ml-auto text-xs font-medium text-stone">Reuse</span>
                    </button>
                    <button
                      type="button"
                      onClick={forgetLastPerson}
                      aria-label="Forget this saved photo"
                      className="grid place-items-center w-11 h-11 shrink-0 rounded-full text-stone hover:text-ink hover:bg-veil transition-colors"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </div>
                )}

                <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-veil/70 px-4 py-3 text-left">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4 mt-0.5 shrink-0 text-noir"
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
                  <p className="text-sm text-ink leading-relaxed">
                    <span className="font-medium">Your photo stays private.</span>{" "}
                    It&apos;s only used to create your try-on — never shown publicly
                    or to other users. When live AI try-on is on, it&apos;s sent
                    securely to our try-on provider to generate the result.
                  </p>
                </div>

                <ul className="mt-6 space-y-2">
                  {TIPS.map((tip, i) => (
                    <motion.li
                      key={tip}
                      initial={reduce ? false : { opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.08 }}
                      className="flex items-center gap-2.5 text-sm text-stone"
                    >
                      <span className="grid place-items-center w-5 h-5 rounded-full bg-veil text-noir">
                        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      {tip}
                    </motion.li>
                  ))}
                </ul>

                <motion.button
                  onClick={() => setStep(1)}
                  disabled={!personUrl}
                  whileTap={personUrl ? { scale: 0.97 } : undefined}
                  className="mt-8 w-full py-3.5 rounded-full font-medium transition-colors enabled:bg-noir enabled:text-paper enabled:hover:bg-noir-deep disabled:bg-transparent disabled:border disabled:border-mist disabled:text-stone disabled:cursor-not-allowed"
                >
                  {personUrl ? "Continue" : "Upload a photo to continue"}
                </motion.button>

                <details className="group mt-8 text-left border-t border-mist pt-5">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm font-medium text-stone hover:text-ink transition-colors">
                    <span>Tips &amp; common questions</span>
                    <svg
                      viewBox="0 0 24 24"
                      className="w-4 h-4 transition-transform group-open:rotate-180"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </summary>
                  <dl className="mt-4 space-y-4">
                    {[
                      {
                        q: "What photo works best?",
                        a: "A full-body, front-facing shot in even light, plain background, arms slightly away from your body. Avoid heavy shadows, sunglasses, and hats.",
                      },
                      {
                        q: "Is my photo shared or kept?",
                        a: "It's only used to generate your try-on — never shown publicly or to other users. When live AI try-on is on, it's sent securely to our try-on provider to render the result.",
                      },
                      {
                        q: "Why did my result look off?",
                        a: "Busy backgrounds, angled poses, or low light make the fit harder to place. Try a cleaner full-body photo and a flat-lay garment on a plain background.",
                      },
                    ].map((item) => (
                      <div key={item.q}>
                        <dt className="text-sm font-medium text-ink">{item.q}</dt>
                        <dd className="mt-1 text-sm text-stone leading-relaxed">
                          {item.a}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </details>
              </div>
            </motion.section>
          )}

          {step === 1 && (
            <motion.section key="clothing" {...slide} aria-label="Select clothing">
              <div className="max-w-xl mx-auto text-center mb-8">
                <h1
                  ref={focusHeading}
                  tabIndex={-1}
                  className="font-display font-semibold text-3xl md:text-4xl tracking-tight"
                >
                  Pick the garment
                </h1>
                <p className="mt-2 text-stone">
                  Choose from the catalog or upload any clothing image.
                </p>
              </div>

              <CatalogPicker
                selectedUrl={garmentUrl}
                onSelect={(url, label) => {
                  setGarmentUrl(url);
                  setGarmentLabel(label);
                }}
              />

              <div className="mx-auto max-w-xl">
                <TryOnSettings
                  value={settings}
                  onChange={setSettings}
                  engineLive={engineLive}
                  rates={rates}
                />
              </div>

              <div className="mt-8 flex justify-center gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="px-6 py-3 rounded-full border border-mist font-medium hover:border-ink transition-colors"
                >
                  Back
                </button>
                {user ? (
                  <motion.button
                    onClick={() => {
                      if (!personUrl) {
                        setStep(0);
                        return;
                      }
                      // Only bump runId — which forces ResultStage to remount and
                      // generate — when there's nothing already paid for.
                      if (!cachedResult) setRunId((n) => n + 1);
                      setStep(2);
                    }}
                    disabled={!garmentUrl}
                    whileTap={garmentUrl ? { scale: 0.97 } : undefined}
                    className="px-7 py-3 rounded-full font-medium transition-colors enabled:bg-noir enabled:text-paper enabled:hover:bg-noir-deep disabled:bg-transparent disabled:border disabled:border-mist disabled:text-stone disabled:cursor-not-allowed"
                  >
                    {!personUrl
                      ? "Add your photo first"
                      : cachedResult
                        ? "Back to your result"
                        : `Generate preview${
                            engineLive
                              ? ` · ${creditCost(settings, rates)} credit${
                                  creditCost(settings, rates) === 1 ? "" : "s"
                                }`
                              : ""
                          }`}
                  </motion.button>
                ) : (
                  // Generating spends real credits, so it's account-gated. The
                  // wizard state is in sessionStorage and survives the trip.
                  <Link
                    href="/login?next=/try-on"
                    className="inline-flex items-center px-7 py-3 rounded-full bg-noir text-paper font-medium hover:bg-noir-deep transition-colors"
                  >
                    Sign in to generate
                  </Link>
                )}
              </div>

              {!user && (
                <p className="mt-3 text-center text-xs text-stone">
                  Your photo and garment are saved here while you sign in.
                </p>
              )}
            </motion.section>
          )}

          {step === 2 && personUrl && personPreview && garmentUrl && (
            <motion.section key={`result-${runId}`} {...slide} aria-label="Preview result">
              <h1 ref={focusHeading} tabIndex={-1} className="sr-only">
                Your try-on preview
              </h1>
              <ResultStage
                personUrl={personUrl}
                personPreview={personPreview}
                garmentUrl={garmentUrl}
                garmentLabel={garmentLabel}
                settings={settings}
                onTryOther={() => setStep(1)}
                onChangePhoto={() => setStep(0)}
                initialResult={cachedResult}
                onResult={keepResult}
                engineLive={engineLive}
                rates={rates}
              />
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

export default function TryOnPage() {
  return (
    <Suspense fallback={null}>
      <TryOnWizard />
    </Suspense>
  );
}
