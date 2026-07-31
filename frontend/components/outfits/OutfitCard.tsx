"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { imageUrl, type Outfit } from "@/lib/api";
import RevealSlider from "@/components/tryon/RevealSlider";
import OutfitName from "./OutfitName";
import { CompareIcon, DownloadIcon, ExpandIcon, TrashIcon } from "./icons";

interface OutfitCardProps {
  outfit: Outfit;
  onExpand: () => void;
  onDownload: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}

function formatDate(iso: string) {
  // `undefined` = the visitor's own locale. Hardcoding en-MY printed Malaysian
  // date order to everyone, including the visitors this is deployed for.
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function OutfitCard({
  outfit,
  onExpand,
  onDownload,
  onRename,
  onDelete,
}: OutfitCardProps) {
  const [comparing, setComparing] = useState(false);
  // Looks saved before the photo was kept — and any generated from a catalog
  // flat-lay — have no original to compare against. Rather than a dead toggle,
  // the affordance simply isn't there.
  const canCompare = Boolean(outfit.personImageUrl);
  const nameId = `outfit-name-${outfit._id}`;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="group relative rounded-2xl overflow-hidden border border-mist bg-card/70"
    >
      <div className="relative">
        {comparing && outfit.personImageUrl ? (
          <RevealSlider
            beforeSrc={imageUrl(outfit.personImageUrl)}
            afterSrc={imageUrl(outfit.resultUrl)}
            initialPos={55}
          />
        ) : (
          <div className="aspect-[3/4] bg-veil overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl(outfit.resultUrl)}
              alt={outfit.name}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            />
          </div>
        )}

        {canCompare && (
          <button
            type="button"
            onClick={() => setComparing((c) => !c)}
            aria-pressed={comparing}
            // Sits on the photo, so it stays literal black/white in both
            // themes like the slider's own ORIGINAL/TRY-ON chips.
            className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 min-h-11 px-3 rounded-full bg-black/70 text-white text-xs font-semibold backdrop-blur hover:bg-black/85 transition-colors"
          >
            <CompareIcon />
            {comparing ? "Done" : "Compare"}
          </button>
        )}
      </div>

      <div className="p-3">
        <OutfitName id={nameId} name={outfit.name} onRename={onRename} />
        <p className="mt-0.5 px-3 text-xs text-stone">{formatDate(outfit.createdAt)}</p>

        <div className="mt-1 flex items-center gap-1">
          <button
            type="button"
            onClick={onExpand}
            aria-label={`View ${outfit.name} full screen`}
            className="grid place-items-center w-11 h-11 rounded-full text-stone hover:text-ink hover:bg-veil transition-colors"
          >
            <ExpandIcon />
          </button>
          <button
            type="button"
            onClick={onDownload}
            aria-label={`Download ${outfit.name}`}
            className="grid place-items-center w-11 h-11 rounded-full text-stone hover:text-ink hover:bg-veil transition-colors"
          >
            <DownloadIcon />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${outfit.name}`}
            className="ml-auto grid place-items-center w-11 h-11 rounded-full text-stone hover:text-ink hover:bg-veil transition-colors"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
