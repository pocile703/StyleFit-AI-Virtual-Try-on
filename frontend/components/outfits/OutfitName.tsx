"use client";

import { useEffect, useRef, useState } from "react";
import { PencilIcon } from "./icons";

interface OutfitNameProps {
  id: string;
  name: string;
  onRename: (name: string) => void;
  /** Heading level styling — cards use the small form, the viewer the large one. */
  size?: "sm" | "lg";
  className?: string;
}

const MAX = 60;

/**
 * The outfit name, editable in place. Enter commits, Escape reverts, blur
 * commits — the same contract a rename in a file manager has.
 */
export default function OutfitName({
  id,
  name,
  onRename,
  size = "sm",
  className = "",
}: OutfitNameProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);
  // Escape must not also fire the commit that blur would.
  const cancelled = useRef(false);

  useEffect(() => {
    if (!editing) setDraft(name);
  }, [name, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function commit() {
    setEditing(false);
    const next = draft.trim().slice(0, MAX);
    if (next && next !== name) onRename(next);
    else setDraft(name);
  }

  const text = size === "lg" ? "text-lg font-medium" : "text-sm font-medium";

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        maxLength={MAX}
        aria-label="Outfit name"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (cancelled.current) {
            cancelled.current = false;
            setDraft(name);
            return;
          }
          commit();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            // Stop the dialog from closing too when renaming inside the viewer.
            e.stopPropagation();
            cancelled.current = true;
            setEditing(false);
          }
        }}
        className={`w-full min-w-0 px-3 py-1.5 rounded-full border border-mist bg-card/70 focus:border-noir transition-colors ${text} ${className}`}
      />
    );
  }

  return (
    <div className={`flex items-center gap-1 min-w-0 ${className}`}>
      <h2 id={id} className={`truncate ${text}`}>
        {name}
      </h2>
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={`Rename ${name}`}
        className="grid place-items-center w-11 h-11 shrink-0 rounded-full text-stone hover:text-ink hover:bg-veil transition-colors"
      >
        <PencilIcon />
      </button>
    </div>
  );
}
