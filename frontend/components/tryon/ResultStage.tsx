"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { api, imageUrl, errorMessage, errorKind } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import RevealSlider from "./RevealSlider";
import FormError from "@/components/FormError";

const PHASES = [
  "Reading your photo…",
  "Placing the garment…",
  "Matching the fit…",
  "Finishing the look…",
];

/** Map a failed generation to shopper-facing recovery copy by its cause. */
function describeFailure(err: unknown): { title: string; detail: string } {
  switch (errorKind(err)) {
    case "network":
      return {
        title: "The connection dropped",
        detail:
          "We couldn't reach the try-on service. Check your connection and try again.",
      };
    case "notfound":
      return {
        title: "That photo's no longer available",
        detail:
          "It may have expired. Try again, or head back and upload a fresh photo.",
      };
    case "engine":
      return {
        title: "The try-on didn't come through",
        detail:
          "The service couldn't finish this one. A clear, front-facing full-body photo works best — give it another try.",
      };
    default:
      return {
        title: "The try-on didn't come through",
        detail:
          "Something went wrong on our end. Give it another try in a moment.",
      };
  }
}

interface ResultStageProps {
  personUrl: string;
  personPreview: string;
  garmentUrl: string;
  garmentLabel: string;
  onTryOther: () => void;
}

export default function ResultStage({
  personUrl,
  personPreview,
  garmentUrl,
  garmentLabel,
  onTryOther,
}: ResultStageProps) {
  const reduce = useReducedMotion();
  const { user } = useAuth();
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<{ title: string; detail: string } | null>(
    null
  );
  const [phase, setPhase] = useState(0);
  const [longWait, setLongWait] = useState(false);
  const [outfitName, setOutfitName] = useState(`${garmentLabel} look`);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [engine, setEngine] = useState<string | null>(null);
  const started = useRef(false);
  const controller = useRef<AbortController | null>(null);

  const generate = useCallback(async () => {
    setError(null);
    setResultUrl(null);
    const ac = new AbortController();
    controller.current = ac;
    try {
      const res = await api.post(
        "/api/tryon",
        { personImageUrl: personUrl, garmentImageUrl: garmentUrl },
        { signal: ac.signal }
      );
      setEngine(res.data.engine ?? null);
      setResultUrl(res.data.resultUrl);
    } catch (err) {
      // A user-initiated cancel aborts the request and navigates away — don't
      // flash the failure screen on the way out.
      if (ac.signal.aborted) return;
      setError(describeFailure(err));
    }
  }, [personUrl, garmentUrl]);

  /** Abort an in-flight generation and step back to garment selection. */
  const cancel = useCallback(() => {
    controller.current?.abort();
    onTryOther();
  }, [onTryOther]);

  /** Re-run the try-on in place with the same photo + garment. */
  const regenerate = useCallback(() => {
    setSavedId(null);
    setSaveError(null);
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
    const id = setInterval(
      () => setPhase((p) => (p + 1) % PHASES.length),
      850
    );
    // After ~2 full phase cycles, a real FASHN call is still running and the
    // looping copy alone reads as stuck — hold a steady reassurance line.
    const wait = setTimeout(() => setLongWait(true), PHASES.length * 850 * 2);
    return () => {
      clearInterval(id);
      clearTimeout(wait);
    };
  }, [resultUrl, error]);

  const download = useCallback(async () => {
    if (!resultUrl) return;
    const res = await fetch(imageUrl(resultUrl));
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "stylefit-tryon.png";
    a.click();
    URL.revokeObjectURL(a.href);
  }, [resultUrl]);

  const saveOutfit = useCallback(async () => {
    if (!resultUrl) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await api.post("/api/outfits", {
        name: outfitName,
        resultUrl,
        personImageUrl: personUrl,
        garmentImageUrl: garmentUrl,
      });
      setSavedId(res.data.outfit._id);
    } catch (err) {
      // A failed save must not discard the generated result — keep the
      // preview and surface the error inline next to the Save button.
      setSaveError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }, [resultUrl, outfitName, personUrl, garmentUrl]);

  /* ── generating ── */
  if (!resultUrl && !error) {
    return (
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
        {/* One stable status for assistive tech — the rotating copy below is
            decorative and would otherwise re-announce every 850ms. */}
        <span className="sr-only" role="status" aria-live="polite">
          {longWait
            ? "Still working. A good try-on takes a few seconds."
            : "Generating your try-on."}
        </span>
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
    );
  }

  /* ── error ── */
  if (error) {
    return (
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
          No outfit was saved, and your photo is still here — retrying won&apos;t
          make you start over.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => {
              started.current = false;
              setError(null);
              generate();
            }}
            className="px-5 py-2.5 rounded-full bg-noir text-paper font-medium hover:bg-noir-deep transition-colors"
          >
            Try again
          </button>
          <button
            onClick={onTryOther}
            className="px-5 py-2.5 rounded-full border border-mist font-medium hover:border-ink transition-colors"
          >
            Pick another garment
          </button>
        </div>
      </div>
    );
  }

  /* ── result ── */
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="grid md:grid-cols-[minmax(280px,420px)_minmax(280px,360px)] gap-10 items-start justify-center"
    >
      <RevealSlider
        beforeSrc={personPreview}
        afterSrc={imageUrl(resultUrl!)}
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

          {/* tertiary utilities — manage this look */}
          <div className="flex items-center gap-5 text-sm">
            <button
              onClick={download}
              className="font-medium text-stone underline underline-offset-4 hover:text-ink transition-colors"
            >
              Download
            </button>
            <button
              onClick={regenerate}
              className="font-medium text-stone underline underline-offset-4 hover:text-ink transition-colors"
            >
              Regenerate
            </button>
          </div>
        </div>

        <p className="mt-6 text-xs text-stone leading-relaxed">
          {engine?.startsWith("tryon")
            ? `Generated by FASHN AI (${engine}).`
            : "Preview only — the full AI try-on runs on the live site."}
        </p>
      </div>
    </motion.div>
  );
}
