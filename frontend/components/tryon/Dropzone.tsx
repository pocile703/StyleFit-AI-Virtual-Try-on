"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { errorMessage, uploadPhoto } from "@/lib/api";
import FormError from "@/components/FormError";

interface DropzoneProps {
  label: string;
  hint?: string;
  /** Called with the uploaded image's API URL once the upload finishes. */
  onUploaded: (url: string, localPreview: string) => void;
  previewUrl?: string | null;
  compact?: boolean;
}

export default function Dropzone({
  label,
  hint = "JPG, PNG or WebP up to 10MB",
  onUploaded,
  previewUrl,
  compact = false,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("That file isn't an image. Use JPG, PNG or WebP.");
        return;
      }
      const MAX_BYTES = 10 * 1024 * 1024;
      if (file.size > MAX_BYTES) {
        setError(
          `That image is ${(file.size / 1024 / 1024).toFixed(
            1
          )}MB — the limit is 10MB. Try a smaller file.`
        );
        return;
      }
      setError(null);
      setBusy(true);
      const local = URL.createObjectURL(file);
      try {
        onUploaded(await uploadPhoto(file), local);
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setBusy(false);
      }
    },
    [onUploaded]
  );

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label={label}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        className={`relative grid place-items-center rounded-2xl border-2 border-dashed cursor-pointer transition-colors overflow-hidden ${
          compact ? "min-h-44" : "min-h-72"
        } ${
          dragging
            ? "dz-active"
            : previewUrl
              ? "border-mist"
              : "border-mist hover:border-noir bg-card/60"
        }`}
      >
        <AnimatePresence mode="wait">
          {previewUrl ? (
            <motion.img
              key={previewUrl}
              src={previewUrl}
              alt="Uploaded preview"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 p-8 text-center"
            >
              <motion.span
                animate={dragging ? { y: [-2, 2, -2] } : { y: 0 }}
                transition={
                  dragging ? { repeat: Infinity, duration: 0.7 } : undefined
                }
                className="grid place-items-center w-14 h-14 rounded-full bg-veil text-noir"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 16V6m0 0L8 10m4-4l4 4" />
                  <path d="M4 16.5V18a2.5 2.5 0 0 0 2.5 2.5h11A2.5 2.5 0 0 0 20 18v-1.5" />
                </svg>
              </motion.span>
              <div>
                <p className="font-medium">
                  {dragging ? "Drop it here" : label}
                </p>
                <p className="mt-1 text-sm text-stone">
                  or drag and drop · {hint}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {previewUrl && !busy && (
          <span className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-black/75 text-white text-xs font-medium backdrop-blur">
            Click to replace
          </span>
        )}

        {busy && (
          <div className="absolute inset-0 grid place-items-center bg-paper/70 backdrop-blur-[2px]">
            <div className="flex items-center gap-2.5 text-sm font-medium">
              {/* CSS animate-spin (not Framer JS) so the global
                  prefers-reduced-motion rule can calm it. */}
              <span
                className="w-4 h-4 rounded-full border-2 border-noir border-t-transparent animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
              Uploading…
            </div>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      <FormError message={error} className="mt-2.5" />
    </div>
  );
}
