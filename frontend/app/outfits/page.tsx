"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import AppShell from "@/components/AppShell";
import FormError from "@/components/FormError";
import Lightbox from "@/components/ui/Lightbox";
import OutfitCard from "@/components/outfits/OutfitCard";
import OutfitViewer from "@/components/outfits/OutfitViewer";
import {
  api,
  downloadImage,
  errorMessage,
  outfitFilename,
  renameOutfit,
  Outfit,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

function OutfitsContent() {
  const { user } = useAuth();
  const [outfits, setOutfits] = useState<Outfit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Lightbox handles returning focus to whatever opened it.
  const [viewingId, setViewingId] = useState<string | null>(null);
  // A delete is optimistic but reversible: the row disappears immediately and
  // the API call only fires after a 5s undo window (or sooner, on unmount /
  // another delete). Undo restores the row before the call is ever made.
  const [pending, setPending] = useState<Outfit | null>(null);
  const pendingRef = useRef<Outfit | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;
    api
      .get("/api/outfits")
      .then((res) => setOutfits(res.data.outfits))
      .catch((err) => setError(errorMessage(err)));
  }, [user]);

  const commitDelete = useCallback(async (id: string) => {
    try {
      await api.delete(`/api/outfits/${id}`);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  const clearPending = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    pendingRef.current = null;
    setPending(null);
  }, []);

  function remove(outfit: Outfit) {
    // Flush any already-pending delete before opening a new undo window.
    if (pendingRef.current && pendingRef.current._id !== outfit._id) {
      commitDelete(pendingRef.current._id);
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    setOutfits((prev) => prev?.filter((o) => o._id !== outfit._id) ?? null);
    pendingRef.current = outfit;
    setPending(outfit);
    timerRef.current = setTimeout(() => {
      commitDelete(outfit._id);
      clearPending();
    }, 5000);
  }

  function undoDelete() {
    const outfit = pendingRef.current;
    if (!outfit) return;
    setOutfits((prev) =>
      [...(prev ?? []), outfit].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    );
    clearPending();
  }

  // If the user leaves with a delete still pending, commit it.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (pendingRef.current) commitDelete(pendingRef.current._id);
    };
  }, [commitDelete]);

  /** Rename optimistically — a failed save puts the old name back. */
  const rename = useCallback(async (outfit: Outfit, name: string) => {
    setError(null);
    setOutfits((prev) =>
      prev?.map((o) => (o._id === outfit._id ? { ...o, name } : o)) ?? null
    );
    try {
      await renameOutfit(outfit._id, name);
    } catch (err) {
      setOutfits((prev) =>
        prev?.map((o) => (o._id === outfit._id ? { ...o, name: outfit.name } : o)) ??
        null
      );
      setError(errorMessage(err));
    }
  }, []);

  const download = useCallback(async (outfit: Outfit) => {
    setError(null);
    try {
      await downloadImage(outfit.resultUrl, outfitFilename(outfit.name, outfit.resultUrl));
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  const viewing = outfits?.find((o) => o._id === viewingId) ?? null;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display font-semibold text-3xl tracking-tight">
            My Outfits
          </h1>
          <p className="mt-1 text-stone text-sm">
            Your saved try-on looks, newest first.
          </p>
        </div>
        {/* The empty state carries its own, better-worded call to action, so
            this one would just be the same link twice on an empty page. */}
        {outfits && outfits.length > 0 && (
          <Link
            href="/try-on"
            className="px-5 py-2.5 rounded-full bg-noir text-paper text-sm font-medium hover:bg-noir-deep transition-colors"
          >
            + New try-on
          </Link>
        )}
      </div>

      <FormError message={error} className="mt-6" />

      {!outfits ? (
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-2xl bg-veil animate-pulse" />
          ))}
        </div>
      ) : outfits.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-16 text-center py-16 rounded-3xl border-2 border-dashed border-mist"
        >
          <p className="font-display font-medium text-xl">No looks saved yet</p>
          <p className="mt-2 text-stone text-sm max-w-xs mx-auto">
            Generate a try-on preview and save it — it will show up here.
          </p>
          <Link
            href="/try-on"
            className="inline-block mt-6 px-6 py-3 rounded-full bg-noir text-paper font-medium hover:bg-noir-deep transition-colors"
          >
            Start your first try-on
          </Link>
        </motion.div>
      ) : (
        <motion.div layout className="mt-8 grid grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {outfits.map((outfit) => (
              <OutfitCard
                key={outfit._id}
                outfit={outfit}
                onExpand={() => setViewingId(outfit._id)}
                onDownload={() => download(outfit)}
                onRename={(name) => rename(outfit, name)}
                onDelete={() => remove(outfit)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <Lightbox
        open={Boolean(viewing)}
        onClose={() => setViewingId(null)}
        labelledBy={viewing ? `viewer-name-${viewing._id}` : ""}
      >
        {viewing && (
          <OutfitViewer
            outfit={viewing}
            nameId={`viewer-name-${viewing._id}`}
            onRename={(name) => rename(viewing, name)}
            onDownload={() => download(viewing)}
            onClose={() => setViewingId(null)}
          />
        )}
      </Lightbox>

      <AnimatePresence>
        {pending && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            role="status"
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[var(--z-toast)] flex items-center gap-4 pl-5 pr-2 py-2 rounded-full bg-noir text-paper shadow-[0_12px_30px_-10px_rgba(11,11,12,0.5)]"
          >
            <span className="text-sm font-medium">Look deleted</span>
            <button
              onClick={undoDelete}
              className="px-4 py-1.5 rounded-full bg-paper/15 text-sm font-semibold hover:bg-paper/25 transition-colors"
            >
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function OutfitsPage() {
  return (
    <AppShell>
      <OutfitsContent />
    </AppShell>
  );
}
