/**
 * Real try-on results, used across every marketing surface.
 *
 * Each entry is a genuine FASHN output: `before` is the photo that went in,
 * `after` is what came back, `garment` is the flat-lay that was tried on. The
 * landing hero, the showcase fan, the About hero and the catalog marquee all
 * read from here — previously each kept its own array of placeholder SVGs and
 * drew a grey silhouette underneath.
 */

export interface Look {
  id: string;
  /** Garment name, shown on the photo chip. */
  label: string;
  /** Matches a category in the backend catalog. */
  category: string;
  /** The original photo. */
  before: string;
  /** The try-on result. */
  after: string;
  /** The garment on its own, for catalog tiles. */
  garment: string;
}

export const LOOKS: Look[] = [
  {
    id: "devil-hunter",
    label: "Devil Hunter Tee",
    category: "T-Shirts",
    before: "/looks/base-outdoor.jpg",
    after: "/looks/look-devil-hunter.jpg",
    garment: "/catalog/devil-hunter-tee.jpg",
  },
  {
    id: "skull-tee",
    label: "Fractured Skull Tee",
    category: "T-Shirts",
    before: "/looks/base-studio-tee.jpg",
    after: "/looks/look-skull-tee.jpg",
    garment: "/catalog/skull-tee.jpg",
  },
  {
    id: "ruffle-skirt",
    label: "Black Ruffle Skirt",
    // Matches the backend catalog's own category name — the marquee tile and
    // the picker chip used to disagree about where this garment lives.
    category: "Skirts",
    before: "/looks/base-outdoor.jpg",
    after: "/looks/look-ruffle-skirt.jpg",
    garment: "/catalog/ruffle-skirt.jpg",
  },
  {
    id: "arcane-tee",
    label: "Arcane Graphic Tee",
    category: "T-Shirts",
    before: "/looks/base-studio-shirt.jpg",
    after: "/looks/look-arcane-tee.jpg",
    garment: "/catalog/arcane-tee.jpg",
  },
  {
    id: "oshi-no-ko",
    label: "Oshi No Ko Tee",
    category: "T-Shirts",
    before: "/looks/base-outdoor.jpg",
    after: "/looks/look-oshi-no-ko.jpg",
    garment: "/catalog/oshi-no-ko-tee.jpg",
  },
  {
    id: "paint-drip",
    label: "Paint Drip Tee",
    category: "T-Shirts",
    before: "/looks/base-studio-shirt.jpg",
    after: "/looks/look-paint-drip.jpg",
    garment: "/catalog/paint-drip-tee.jpg",
  },
];

/** Garments with no try-on result of their own — catalog tiles only. */
export const EXTRA_GARMENTS = [
  { label: "Sage Popover Shirt", category: "Shirts", garment: "/catalog/sage-popover-shirt.jpg" },
  { label: "B-Komachi Tee", category: "T-Shirts", garment: "/catalog/b-komachi-tee.jpg" },
  { label: "Paper Rex Match Jersey", category: "T-Shirts", garment: "/catalog/paper-rex-jersey.jpg" },
  { label: "Essential Black Tee", category: "T-Shirts", garment: "/catalog/black-tee.jpg" },
  { label: "Draped Asymmetric Top", category: "Shirts", garment: "/catalog/draped-top.jpg" },
];
