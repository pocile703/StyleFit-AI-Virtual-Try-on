"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { api, imageUrl, ClothingItem } from "@/lib/api";
import Dropzone from "./Dropzone";
import SegmentedControl from "@/components/ui/SegmentedControl";

interface CatalogPickerProps {
  selectedUrl: string | null;
  onSelect: (url: string, label: string) => void;
}

export default function CatalogPicker({
  selectedUrl,
  onSelect,
}: CatalogPickerProps) {
  const [tab, setTab] = useState<"catalog" | "upload">("catalog");
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState<string>("All");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/api/clothing")
      .then((res) => {
        setItems(res.data.items);
        setCategories(["All", ...res.data.categories]);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  const visible =
    category === "All" ? items : items.filter((i) => i.category === category);

  return (
    <div>
      <SegmentedControl
        options={[
          { value: "catalog", label: "Choose from catalog" },
          { value: "upload", label: "Upload image" },
        ]}
        value={tab}
        onChange={setTab}
        variant="tabs"
        layoutId="picker-tab"
        label="Garment source"
        idPrefix="picker-tab"
        className="w-fit mx-auto"
      />

      <AnimatePresence mode="wait">
        {tab === "catalog" ? (
          <motion.div
            key="catalog"
            id="picker-tab-panel-catalog"
            role="tabpanel"
            aria-labelledby="picker-tab-catalog"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mt-7"
          >
            {/* category chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`inline-flex shrink-0 items-center min-h-11 px-4 rounded-full text-sm font-medium transition-colors ${
                    category === c
                      ? "bg-noir text-paper"
                      : "bg-veil text-stone hover:text-ink"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* grid */}
            {loading ? (
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border-2 border-mist p-3 pb-4"
                  >
                    <div className="aspect-square rounded-xl bg-veil animate-pulse" />
                    <div className="mt-3 h-3.5 w-2/3 rounded-full bg-veil animate-pulse" />
                    <div className="mt-2 h-3 w-1/3 rounded-full bg-veil animate-pulse" />
                  </div>
                ))}
              </div>
            ) : loadError ? (
              <p className="mt-8 text-center text-stone">
                Couldn&apos;t load the catalog. Check that the API server is
                running, then refresh.
              </p>
            ) : visible.length === 0 ? (
              <p className="mt-8 text-center text-stone">
                Nothing in {category} yet. Try another category, or upload your
                own clothing image.
              </p>
            ) : (
              <motion.div layout className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {visible.map((item) => {
                    const selected = selectedUrl === item.imageUrl;
                    return (
                      <motion.button
                        key={item._id}
                        layout
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.92 }}
                        transition={{ duration: 0.25 }}
                        onClick={() => onSelect(item.imageUrl, item.name)}
                        aria-pressed={selected}
                        className={`group relative text-left rounded-2xl border-2 p-3 pb-4 transition-[transform,box-shadow,border-color] hover:-translate-y-1 hover:shadow-[0_14px_30px_-16px_rgba(11,11,12,0.25)] ${
                          selected
                            ? "border-noir bg-veil/60"
                            : "border-mist bg-card/70 hover:border-stone"
                        }`}
                      >
                        <span className="block aspect-square rounded-xl bg-gradient-to-b from-veil/60 to-mist/40 p-4">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imageUrl(item.imageUrl)}
                            alt={item.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                          />
                        </span>
                        <span className="mt-3 block text-sm font-medium leading-tight">
                          {item.name}
                        </span>
                        <span className="mt-0.5 block text-xs text-stone">
                          {item.category}
                        </span>
                        <AnimatePresence>
                          {selected && (
                            <motion.span
                              initial={{ scale: 0, rotate: -30 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 24 }}
                              className="absolute top-2.5 right-2.5 grid place-items-center w-7 h-7 rounded-full bg-noir text-paper shadow-md"
                            >
                              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 13l4 4L19 7" />
                              </svg>
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            id="picker-tab-panel-upload"
            role="tabpanel"
            aria-labelledby="picker-tab-upload"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mt-7 max-w-md mx-auto"
          >
            <Dropzone
              label="Upload a clothing image"
              onUploaded={(url, local) => {
                setUploadPreview(local);
                onSelect(url, "Custom garment");
              }}
              previewUrl={uploadPreview}
              compact
            />
            <p className="mt-3 text-sm text-stone text-center">
              Flat-lay or product photos on a plain background work best.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
