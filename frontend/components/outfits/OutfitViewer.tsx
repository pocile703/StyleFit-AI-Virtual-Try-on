"use client";

import { useState } from "react";
import { imageUrl, type Outfit } from "@/lib/api";
import RevealSlider from "@/components/tryon/RevealSlider";
import OutfitName from "./OutfitName";
import { CloseIcon, DownloadIcon } from "./icons";

interface OutfitViewerProps {
  outfit: Outfit;
  nameId: string;
  onRename: (name: string) => void;
  onDownload: () => void;
  onClose: () => void;
}

/** Contents of the full-screen outfit dialog. */
export default function OutfitViewer({
  outfit,
  nameId,
  onRename,
  onDownload,
  onClose,
}: OutfitViewerProps) {
  const canCompare = Boolean(outfit.personImageUrl);
  const [comparing, setComparing] = useState(canCompare);

  return (
    <div>
      <div className="flex items-start gap-3">
        <OutfitName
          id={nameId}
          name={outfit.name}
          onRename={onRename}
          size="lg"
          className="flex-1 min-w-0"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid place-items-center w-11 h-11 shrink-0 rounded-full text-stone hover:text-ink hover:bg-veil transition-colors"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Capped by viewport height so a 3:4 photo can't push the dialog
          off-screen on a short window. */}
      <div className="mt-4 mx-auto w-full max-w-md">
        {comparing && outfit.personImageUrl ? (
          <RevealSlider
            beforeSrc={imageUrl(outfit.personImageUrl)}
            afterSrc={imageUrl(outfit.resultUrl)}
            initialPos={55}
            className="rounded-2xl border border-mist"
          />
        ) : (
          <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-mist bg-veil">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl(outfit.resultUrl)}
              alt={outfit.name}
              className="w-full h-full object-contain"
            />
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        {canCompare && (
          <button
            type="button"
            onClick={() => setComparing((c) => !c)}
            aria-pressed={comparing}
            className="inline-flex items-center justify-center min-h-11 px-5 rounded-full border border-mist text-sm font-medium hover:border-ink transition-colors"
          >
            {comparing ? "Show result only" : "Compare with original"}
          </button>
        )}
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex items-center justify-center gap-2 min-h-11 px-5 rounded-full bg-noir text-paper text-sm font-medium hover:bg-noir-deep transition-colors"
        >
          <DownloadIcon />
          Download
        </button>
      </div>

      {canCompare && (
        <p className="mt-3 text-center text-xs text-stone">
          Drag the handle to compare your photo with the try-on.
        </p>
      )}
    </div>
  );
}
