"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  imageUrl,
  errorMessage,
  errorKind,
  errorCode,
  errorRetryAfter,
  formatWait,
  runTryOn,
  downloadImage,
  outfitFilename,
  saveOutfit as saveOutfitRequest,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import RevealSlider from "./RevealSlider";
import FormError from "@/components/FormError";
import { creditCost, type TryOnSettings } from "@/lib/tryon";

const PHASES = [
  "Reading your photo…",
  "Placing the garment…",
  "Matching the fit…",
  "Finishing the look…",
];

interface Failure {
  title: string;
  detail: string;
  /** Whether pressing the same button again could plausibly work. */
  retryable: boolean;
  /** A corrective action that would work when retrying wouldn't. */
  fix: "photo" | "settings" | null;
}

/** Map a failed generation to shopper-facing recovery copy by its cause. */
function describeFailure(err: unknown): Failure {
  switch (errorCode(err)) {
    case "input_image":
      return {
        title: "That photo couldn't be read",
        detail:
          "The AI couldn't make out a person in it. A clear, front-facing full-body shot in even light works best.",
        retryable: false,
        fix: "photo",
      };
    case "moderation":
      return {
        title: "That image was blocked",
        detail:
          "The try-on provider's content filter rejected this photo or garment. Try a different one.",
        retryable: false,
        fix: "photo",
      };
    case "credits":
      return {
        title: "The try-on service is out of credits",
        detail:
          "Nothing was charged and nothing's wrong with your photo — the account behind the AI needs topping up.",
        retryable: false,
        fix: null,
      };
    case "auth":
      return {
        title: "The try-on service isn't available",
        detail:
          "It isn't configured correctly right now. This one's on us, not on your photo.",
        retryable: false,
        fix: null,
      };
    case "rate_limit": {
      // Two different limiters land here: a per-user hourly window and a
      // whole-deployment daily cap that doesn't clear until UTC midnight. The
      // server sends the real wait for each, so use it rather than assuming the
      // short one — telling someone to wait a minute for a cap that lasts until
      // tomorrow just loops them into the same failure.
      const wait = errorRetryAfter(err);
      const soon = wait === null || wait <= 15 * 60;
      return {
        title: soon ? "Too many try-ons at once" : "You've used up today's try-ons",
        detail:
          `${errorMessage(err)}${wait ? ` Try again in about ${formatWait(wait)}.` : ""}` +
          " Nothing was charged.",
        retryable: soon,
        fix: null,
      };
    }
    case "timeout":
      return {
        title: "That took too long",
        detail:
          "The try-on didn't finish in time. It usually works on the second attempt.",
        retryable: true,
        fix: null,
      };
    case "notfound":
      return {
        title: "That photo's no longer available",
        detail:
          "It may have expired. Head back and upload a fresh photo to carry on.",
        retryable: false,
        fix: "photo",
      };
    default:
      break;
  }

  // No code from the API — fall back to the coarse status classification.
  switch (errorKind(err)) {
    case "network":
      return {
        title: "The connection dropped",
        detail:
          "We couldn't reach the try-on service. Check your connection and try again.",
        retryable: true,
        fix: null,
      };
    case "notfound":
      return {
        title: "That photo's no longer available",
        detail:
          "It may have expired. Try again, or head back and upload a fresh photo.",
        retryable: true,
        fix: "photo",
      };
    default:
      return {
        title: "The try-on didn't come through",
        detail:
          "The service couldn't finish this one. A clear, front-facing full-body photo works best — give it another try.",
        retryable: true,
        fix: null,
      };
  }
}

/** A finished generation, so leaving and returning doesn't re-run (and re-bill) it. */
export interface GeneratedResult {
  resultUrl: string;
  engine: string | null;
  credits: number | null;
}

interface ResultStageProps {
  personUrl: string;
  personPreview: string;
  garmentUrl: string;
  garmentLabel: string;
  settings: TryOnSettings;
  onTryOther: () => void;
  onChangePhoto?: () => void;
  /** A previous run for these exact inputs — shown as-is instead of regenerating. */
  initialResult?: GeneratedResult | null;
  /** Hands a finished run up to the wizard so it survives step navigation. */
  onResult?: (result: GeneratedResult) => void;
  /** Whether the paid engine is on, so a re-run only quotes real credit costs. */
  engineLive?: boolean;
}

export default function ResultStage({
  personUrl,
  personPreview,
  garmentUrl,
  garmentLabel,
  settings,
  onTryOther,
  onChangePhoto,
  initialResult = null,
  onResult,
  engineLive = false,
}: ResultStageProps) {
  const reduce = useReducedMotion();
  const { user } = useAuth();
  const [resultUrl, setResultUrl] = useState<string | null>(
    initialResult?.resultUrl ?? null
  );
  const [error, setError] = useState<Failure | null>(null);
  const [phase, setPhase] = useState(0);
  const [longWait, setLongWait] = useState(false);
  const [outfitName, setOutfitName] = useState(`${garmentLabel} look`);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [engine, setEngine] = useState<string | null>(initialResult?.engine ?? null);
  const [credits, setCredits] = useState<number | null>(initialResult?.credits ?? null);
  const [confirmRerun, setConfirmRerun] = useState(false);
  // A result handed down from the wizard has already been paid for — don't let
  // the mount effect below spend another credit reproducing it.
  const started = useRef(Boolean(initialResult));
  const controller = useRef<AbortController | null>(null);

  const cost = creditCost(settings);

  const generate = useCallback(async () => {
    setError(null);
    setResultUrl(null);
    const ac = new AbortController();
    controller.current = ac;
    try {
      const result = await runTryOn(
        {
          personImageUrl: personUrl,
          garmentImageUrl: garmentUrl,
          settings,
        },
        { signal: ac.signal }
      );
      setEngine(result.engine ?? null);
      setCredits(result.credits ?? null);
      setResultUrl(result.resultUrl);
      onResult?.({
        resultUrl: result.resultUrl,
        engine: result.engine ?? null,
        credits: result.credits ?? null,
      });
    } catch (err) {
      // A user-initiated cancel aborts the request and navigates away — don't
      // flash the failure screen on the way out.
      if (ac.signal.aborted) return;
      setError(describeFailure(err));
    }
  }, [personUrl, garmentUrl, settings, onResult]);

  /** Abort an in-flight generation and step back to garment selection. */
  const cancel = useCallback(() => {
    controller.current?.abort();
    onTryOther();
  }, [onTryOther]);

  /** Re-run the try-on in place with the same photo + garment. */
  const regenerate = useCallback(() => {
    setSavedId(null);
    setSaveError(null);
    setConfirmRerun(false);
    generate();
  }, [generate]);

  /** Retry after a failure. */
  const retry = useCallback(() => {
    started.current = false;
    setError(null);
    generate();
  }, [generate]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    generate();
  }, [generate]);

  useEffect(() => {
    if (resultUrl || error) {
      setLongWait(false);
      return;
    }
    // High quality runs roughly three times as long, so the copy has to move
    // slower or it cycles for half a minute and reads as stuck.
    const phaseMs = settings.quality === "high" ? 2000 : 850;
    const id = setInterval(() => setPhase((p) => (p + 1) % PHASES.length), phaseMs);
    // After ~2 full cycles, hold a steady reassurance line instead.
    const wait = setTimeout(() => setLongWait(true), PHASES.length * phaseMs * 2);
    return () => {
      clearInterval(id);
      clearTimeout(wait);
    };
  }, [resultUrl, error, settings.quality]);

  const download = useCallback(async () => {
    if (!resultUrl) return;
    try {
      await downloadImage(resultUrl, outfitFilename(outfitName, resultUrl));
    } catch (err) {
      setSaveError(errorMessage(err));
    }
  }, [resultUrl, outfitName]);

  const saveOutfit = useCallback(async () => {
    if (!resultUrl) return;
    setSaving(true);
    setSaveError(null);
    try {
      const outfit = await saveOutfitRequest({
        name: outfitName,
        resultUrl,
        personImageUrl: personUrl,
        garmentImageUrl: garmentUrl,
      });
      setSavedId(outfit._id);
    } catch (err) {
      // A failed save must not discard the generated result — keep the
      // preview and surface the error inline next to the Save button.
      setSaveError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }, [resultUrl, outfitName, personUrl, garmentUrl]);

  /* One status region for the whole stage, rendered above every branch so it
     survives the swap from generating to result. It used to live inside the
     generating branch and unmounted the instant the image arrived, which meant
     a screen-reader user waited out a 10–60s generation and was never told it
     had finished. Errors are left to the branch's own role="alert". */
  const liveStatus = (
    <span className="sr-only" role="status" aria-live="polite">
      {error
        ? ""
        : resultUrl
          ? "Your try-on is ready."
          : longWait
            ? "Still working. A good try-on takes a few seconds."
            : "Generating your try-on."}
    </span>
  );

  /* ── generating ── */
  if (!resultUrl && !error) {
    return (
      <>
        {liveStatus}
      <div className="max-w-sm mx-auto text-center">
        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-mist">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={personPreview}
            alt="Your photo"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-noir/10" />
          {!reduce && (
            <div className="absolute inset-0 overflow-hidden">
              <div className="scan-line absolute left-0 right-0 h-14 bg-gradient-to-b from-transparent via-noir/40 to-transparent" />
            </div>
          )}
          {/* corner brackets */}
          <svg className="absolute inset-3 pointer-events-none text-white/80" viewBox="0 0 100 133" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 8 V0 H6 M94 0 H100 V8 M100 125 V133 H94 M6 133 H0 V125" stroke="currentColor" strokeWidth="1.5" fill="none" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
        {/* The rotating copy below is decorative — the stable announcement for
            assistive tech is the stage-level status region above. */}
        <div className="mt-5 h-6" aria-hidden="true">
          <AnimatePresence mode="wait">
            <motion.p
              key={PHASES[phase]}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="text-sm font-medium text-noir"
            >
              {PHASES[phase]}
            </motion.p>
          </AnimatePresence>
        </div>
        {!reduce && (
          <div className="mt-4 mx-auto h-1 w-40 rounded-full bg-veil overflow-hidden">
            <motion.div
              className="h-full w-1/3 rounded-full bg-noir"
              animate={{ x: ["-120%", "360%"] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            />
          </div>
        )}
        <div className="mt-3 h-5">
          <AnimatePresence>
            {longWait && (
              <motion.p
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-stone"
              >
                Still working — a good try-on takes a few seconds.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={cancel}
          className="mt-5 text-sm font-medium text-stone underline underline-offset-4 hover:text-ink transition-colors"
        >
          Cancel
        </button>
      </div>
      </>
    );
  }

  /* ── error ── */
  if (error) {
    return (
      <>
        {liveStatus}
      <div className="max-w-sm mx-auto text-center py-10" role="alert">
        <span className="mx-auto grid place-items-center w-14 h-14 rounded-full bg-veil text-noir">
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
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
        </span>
        <h2 className="mt-5 font-display font-semibold text-xl tracking-tight">
          {error.title}
        </h2>
        <p className="mt-2 text-sm text-stone leading-relaxed">
          {error.detail}
        </p>
        <p className="mt-3 text-xs text-stone leading-relaxed">
          Nothing was charged, no outfit was saved, and your photo is still
          here — you won&apos;t have to start over.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {/* The primary action is whatever could actually work. Offering
              "Try again" against an out-of-credits or blocked-image failure
              just spends the user's patience on a guaranteed repeat. */}
          {error.fix === "photo" && onChangePhoto ? (
            <button
              onClick={onChangePhoto}
              className="px-5 py-2.5 rounded-full bg-noir text-paper font-medium hover:bg-noir-deep transition-colors"
            >
              Use a different photo
            </button>
          ) : error.retryable ? (
            <button
              onClick={retry}
              className="px-5 py-2.5 rounded-full bg-noir text-paper font-medium hover:bg-noir-deep transition-colors"
            >
              Try again
            </button>
          ) : null}
          <button
            onClick={onTryOther}
            className="px-5 py-2.5 rounded-full border border-mist font-medium hover:border-ink transition-colors"
          >
            Pick another garment
          </button>
          {!error.retryable && error.fix !== "photo" && (
            <button
              onClick={retry}
              className="px-5 py-2.5 text-sm font-medium text-stone underline underline-offset-4 hover:text-ink transition-colors"
            >
              Try again anyway
            </button>
          )}
        </div>
      </div>
      </>
    );
  }

  /* ── result ── */
  return (
    <>
      {liveStatus}
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="grid md:grid-cols-[minmax(280px,420px)_minmax(280px,360px)] gap-10 items-start justify-center"
    >
      <RevealSlider
        beforeSrc={personPreview}
        afterSrc={imageUrl(resultUrl!)}
        className="rounded-2xl border border-mist"
      />

      <div className="max-w-sm">
        <p className="eyebrow text-stone">Preview ready</p>
        <h2 className="mt-2 font-display font-semibold text-2xl tracking-tight">
          {garmentLabel}
        </h2>
        <p className="mt-2 text-stone text-sm leading-relaxed">
          Drag the handle to compare the original photo with the try-on
          result.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {savedId ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-2xl bg-veil"
            >
              <p className="font-medium text-sm">Saved to your outfits.</p>
              <Link
                href="/outfits"
                className="mt-1 inline-block text-sm font-medium text-noir hover:text-noir-deep"
              >
                View my outfits →
              </Link>
            </motion.div>
          ) : user ? (
            <div>
              <div className="flex gap-2">
                <input
                  value={outfitName}
                  onChange={(e) => setOutfitName(e.target.value)}
                  aria-label="Outfit name"
                  className="flex-1 min-w-0 px-4 py-2.5 rounded-full border border-mist bg-card/70 text-sm focus:border-noir"
                />
                <button
                  onClick={saveOutfit}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-full bg-noir text-paper text-sm font-medium hover:bg-noir-deep transition-colors disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save outfit"}
                </button>
              </div>
              <FormError
                message={
                  saveError
                    ? `${saveError} Your try-on is still here — tap Save to retry.`
                    : null
                }
                className="mt-2"
              />
            </div>
          ) : (
            <p className="p-4 rounded-2xl bg-veil text-sm">
              <Link href="/login" className="font-medium text-noir hover:text-noir-deep">
                Log in
              </Link>{" "}
              to save this look to your outfits.
            </p>
          )}

          {/* one secondary action — the main "what next" */}
          <button
            onClick={onTryOther}
            className="w-full px-5 py-2.5 rounded-full border border-mist text-sm font-medium hover:border-ink transition-colors"
          >
            Try another garment
          </button>

          {/* Download is free and Regenerate spends credits, so they can't look
              alike. Download stays a plain text link; the re-run sits apart and
              asks first, with the price on the confirming button. */}
          <div className="flex items-center text-sm">
            <button
              onClick={download}
              className="inline-flex items-center min-h-11 font-medium text-stone underline underline-offset-4 hover:text-ink transition-colors"
            >
              Download
            </button>
          </div>

          <div className="border-t border-mist pt-3">
            {confirmRerun ? (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={regenerate}
                  className="px-4 py-2 rounded-full bg-noir text-paper text-sm font-medium hover:bg-noir-deep transition-colors"
                >
                  Generate again
                  {engineLive && ` · ${cost} credit${cost === 1 ? "" : "s"}`}
                </button>
                <button
                  onClick={() => setConfirmRerun(false)}
                  className="inline-flex items-center min-h-11 text-sm font-medium text-stone underline underline-offset-4 hover:text-ink transition-colors"
                >
                  Keep this one
                </button>
                <p className="w-full text-xs text-stone leading-relaxed">
                  This replaces the result above with a fresh one. Save it first
                  if you want to keep both.
                </p>
              </div>
            ) : (
              <button
                onClick={() => setConfirmRerun(true)}
                className="inline-flex items-center min-h-11 text-sm font-medium text-stone underline underline-offset-4 hover:text-ink transition-colors"
              >
                Not quite right? Run it again
                {engineLive && ` (${cost} credit${cost === 1 ? "" : "s"})`}
              </button>
            )}
          </div>
        </div>

        <p className="mt-6 text-xs text-stone leading-relaxed">
          {engine?.startsWith("tryon")
            ? `Generated by FASHN AI (${engine})` +
              (credits ? ` · ${credits} credit${credits === 1 ? "" : "s"}.` : ".")
            : "Preview only — the full AI try-on runs on the live site."}
        </p>
      </div>
    </motion.div>
    </>
  );
}
