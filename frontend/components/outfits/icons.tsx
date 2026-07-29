/** Shared 24×24 stroke icons for the outfit tools. */

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const CompareIcon = ({ className = "w-4 h-4" }) => (
  <svg {...base} className={className}>
    <path d="M12 3v18M8 7L4 12l4 5M16 7l4 5-4 5" />
  </svg>
);

export const ExpandIcon = ({ className = "w-4 h-4" }) => (
  <svg {...base} className={className}>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </svg>
);

export const DownloadIcon = ({ className = "w-4 h-4" }) => (
  <svg {...base} className={className}>
    <path d="M12 3v12M7 11l5 5 5-5M4 21h16" />
  </svg>
);

export const TrashIcon = ({ className = "w-4 h-4" }) => (
  <svg {...base} className={className}>
    <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6" />
  </svg>
);

export const PencilIcon = ({ className = "w-4 h-4" }) => (
  <svg {...base} className={className}>
    <path d="M4 20h4l10-10-4-4L4 16v4zM14 6l4 4" />
  </svg>
);

export const CloseIcon = ({ className = "w-4 h-4" }) => (
  <svg {...base} className={className}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
