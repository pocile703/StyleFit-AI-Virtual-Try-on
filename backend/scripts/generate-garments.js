// Generates the seed clothing catalog as flat-lay SVG illustrations.
// Run once: node scripts/generate-garments.js
// Real product photos can replace these files later without touching the catalog data.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "public", "garments");
fs.mkdirSync(OUT, { recursive: true });

// Darken a hex color by a factor (0..1) for shading.
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (s) => Math.round(((n >> s) & 255) * (1 - f));
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0")}`;
}

const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220">${body}</svg>`;

// Each builder returns SVG body for a 200x220 canvas, flat-lay garment.
const shapes = {
  tee: (c) => `
    <path d="M62 34 L86 24 Q100 34 114 24 L138 34 L166 56 L152 84 L136 72 L136 186 Q100 196 64 186 L64 72 L48 84 L34 56 Z" fill="${c}"/>
    <path d="M86 24 Q100 34 114 24 Q112 40 100 40 Q88 40 86 24 Z" fill="${shade(c, 0.18)}"/>
    <path d="M64 176 Q100 186 136 176 L136 186 Q100 196 64 186 Z" fill="${shade(c, 0.1)}"/>
    <path d="M136 72 L152 84 L166 56 L138 34 Z" fill="${shade(c, 0.08)}"/>`,
  shirt: (c) => `
    <path d="M60 36 L88 26 L100 44 L112 26 L140 36 L168 58 L154 86 L138 74 L138 188 Q100 198 62 188 L62 74 L46 86 L32 58 Z" fill="${c}"/>
    <path d="M88 26 L100 44 L94 190 L86 190 Z" fill="${shade(c, 0.12)}"/>
    <path d="M112 26 L100 44 L106 190 L114 190 Z" fill="${shade(c, 0.06)}"/>
    <circle cx="100" cy="66" r="2.6" fill="${shade(c, 0.4)}"/>
    <circle cx="100" cy="96" r="2.6" fill="${shade(c, 0.4)}"/>
    <circle cx="100" cy="126" r="2.6" fill="${shade(c, 0.4)}"/>
    <circle cx="100" cy="156" r="2.6" fill="${shade(c, 0.4)}"/>
    <path d="M88 26 L100 44 L112 26 L106 20 L100 30 L94 20 Z" fill="${shade(c, 0.22)}"/>
    <path d="M138 74 L154 86 L168 58 L140 36 Z" fill="${shade(c, 0.08)}"/>`,
  hoodie: (c) => `
    <path d="M58 44 Q78 20 100 20 Q122 20 142 44 L170 70 L154 96 L140 84 L140 190 Q100 200 60 190 L60 84 L46 96 L30 70 Z" fill="${c}"/>
    <path d="M74 46 Q100 26 126 46 Q118 64 100 64 Q82 64 74 46 Z" fill="${shade(c, 0.28)}"/>
    <path d="M78 44 Q100 30 122 44 Q114 58 100 58 Q86 58 78 44 Z" fill="${shade(c, 0.42)}"/>
    <path d="M78 140 Q100 132 122 140 L122 178 Q100 186 78 178 Z" fill="${shade(c, 0.14)}"/>
    <line x1="92" y1="64" x2="90" y2="96" stroke="${shade(c, 0.4)}" stroke-width="3" stroke-linecap="round"/>
    <line x1="108" y1="64" x2="110" y2="96" stroke="${shade(c, 0.4)}" stroke-width="3" stroke-linecap="round"/>
    <path d="M140 84 L154 96 L170 70 L142 44 Z" fill="${shade(c, 0.1)}"/>`,
  jacket: (c) => `
    <path d="M58 38 L86 26 L100 46 L114 26 L142 38 L170 62 L154 92 L140 78 L140 188 Q100 198 60 188 L60 78 L46 92 L30 62 Z" fill="${c}"/>
    <path d="M86 26 L100 46 L100 190 L88 190 L84 60 Z" fill="${shade(c, 0.16)}"/>
    <path d="M114 26 L100 46 L100 190 L112 190 L116 60 Z" fill="${shade(c, 0.08)}"/>
    <path d="M86 26 L100 46 L88 56 L78 34 Z" fill="${shade(c, 0.3)}"/>
    <path d="M114 26 L100 46 L112 56 L122 34 Z" fill="${shade(c, 0.24)}"/>
    <rect x="66" y="120" width="16" height="22" rx="3" fill="${shade(c, 0.22)}"/>
    <rect x="118" y="120" width="16" height="22" rx="3" fill="${shade(c, 0.22)}"/>
    <path d="M60 180 Q100 190 140 180 L140 188 Q100 198 60 188 Z" fill="${shade(c, 0.3)}"/>
    <path d="M140 78 L154 92 L170 62 L142 38 Z" fill="${shade(c, 0.1)}"/>`,
  pants: (c) => `
    <path d="M62 24 L138 24 L146 200 L110 204 L100 92 L90 204 L54 200 Z" fill="${c}"/>
    <path d="M62 24 L138 24 L139 44 L61 44 Z" fill="${shade(c, 0.18)}"/>
    <path d="M100 92 L110 204 L146 200 L138 24 L100 24 Z" fill="${shade(c, 0.07)}" opacity="0.6"/>
    <line x1="100" y1="44" x2="100" y2="88" stroke="${shade(c, 0.3)}" stroke-width="2"/>
    <circle cx="100" cy="34" r="3" fill="${shade(c, 0.4)}"/>`,
  sweater: (c) => `
    <path d="M60 42 L88 28 Q100 38 112 28 L140 42 L168 66 L152 94 L138 80 L138 184 Q100 196 62 184 L62 80 L48 94 L32 66 Z" fill="${c}"/>
    <path d="M88 28 Q100 38 112 28 Q110 46 100 46 Q90 46 88 28 Z" fill="${shade(c, 0.24)}"/>
    <path d="M62 174 Q100 186 138 174 L138 184 Q100 196 62 184 Z" fill="${shade(c, 0.18)}"/>
    <g stroke="${shade(c, 0.12)}" stroke-width="3" stroke-linecap="round">
      <line x1="84" y1="52" x2="84" y2="170"/><line x1="100" y1="54" x2="100" y2="174"/><line x1="116" y1="52" x2="116" y2="170"/>
    </g>
    <path d="M138 80 L152 94 L168 66 L140 42 Z" fill="${shade(c, 0.08)}"/>`,
  dress: (c) => `
    <path d="M74 24 L92 32 Q100 38 108 32 L126 24 L134 62 L118 76 L134 130 Q148 178 128 200 Q100 210 72 200 Q52 178 66 130 L82 76 L66 62 Z" fill="${c}"/>
    <path d="M92 32 Q100 38 108 32 Q106 48 100 48 Q94 48 92 32 Z" fill="${shade(c, 0.2)}"/>
    <path d="M82 76 L118 76 L116 86 L84 86 Z" fill="${shade(c, 0.14)}"/>
    <path d="M100 86 Q104 140 118 198 Q109 204 100 204 Z" fill="${shade(c, 0.07)}" opacity="0.7"/>
    <path d="M66 130 Q100 142 134 130 L131 120 Q100 131 69 120 Z" fill="${shade(c, 0.1)}"/>`,
  skirt: (c) => `
    <path d="M70 30 L130 30 L138 52 Q156 130 146 188 Q100 202 54 188 Q44 130 62 52 Z" fill="${c}"/>
    <path d="M70 30 L130 30 L133 46 L67 46 Z" fill="${shade(c, 0.2)}"/>
    <path d="M100 46 Q102 120 112 194 Q106 197 100 198 Z" fill="${shade(c, 0.08)}" opacity="0.7"/>
    <path d="M54 178 Q100 192 146 178 L146 188 Q100 202 54 188 Z" fill="${shade(c, 0.12)}"/>`,
  cap: (c) => `
    <path d="M44 120 Q44 56 100 56 Q156 56 156 120 L156 132 Q100 148 44 132 Z" fill="${c}"/>
    <path d="M100 56 Q104 90 102 132 Q100 133 98 132 Q96 90 100 56 Z" fill="${shade(c, 0.18)}"/>
    <path d="M44 126 Q20 132 24 146 Q60 156 100 150 L100 138 Q70 140 44 126 Z" fill="${shade(c, 0.26)}"/>
    <circle cx="100" cy="60" r="5" fill="${shade(c, 0.3)}"/>`,
};

const catalog = [
  { file: "tee-white", shape: "tee", color: "#F1F1EF", name: "Classic White Tee", category: "T-Shirts" },
  { file: "tee-black", shape: "tee", color: "#26262B", name: "Everyday Black Tee", category: "T-Shirts" },
  { file: "tee-graphite", shape: "tee", color: "#46464B", name: "Graphite Crew Tee", category: "T-Shirts" },
  { file: "shirt-blue", shape: "shirt", color: "#7FA8D9", name: "Washed Denim Shirt", category: "Shirts" },
  { file: "shirt-sage", shape: "shirt", color: "#A9BCA0", name: "Sage Linen Shirt", category: "Shirts" },
  { file: "hoodie-black", shape: "hoodie", color: "#2E2B36", name: "Black Oversized Hoodie", category: "Hoodies" },
  { file: "hoodie-ash", shape: "hoodie", color: "#B7B7B2", name: "Ash Fleece Hoodie", category: "Hoodies" },
  { file: "jacket-camel", shape: "jacket", color: "#C18E5A", name: "Camel Utility Jacket", category: "Jackets" },
  { file: "jacket-ink", shape: "jacket", color: "#3A3644", name: "Ink Bomber Jacket", category: "Jackets" },
  { file: "pants-denim", shape: "pants", color: "#5E7CA8", name: "Straight Denim Jeans", category: "Pants" },
  { file: "pants-stone", shape: "pants", color: "#B8B0A4", name: "Stone Chinos", category: "Pants" },
  { file: "sweater-cream", shape: "sweater", color: "#E8DECB", name: "Cream Knit Sweater", category: "Sweaters" },
  { file: "sweater-rust", shape: "sweater", color: "#B96A4B", name: "Rust Ribbed Sweater", category: "Sweaters" },
  { file: "dress-blush", shape: "dress", color: "#EDB8C4", name: "Blush Midi Dress", category: "Dresses" },
  { file: "dress-noir", shape: "dress", color: "#312D3B", name: "Noir Slip Dress", category: "Dresses" },
  { file: "skirt-camel", shape: "skirt", color: "#CBA06E", name: "Camel A-Line Skirt", category: "More" },
  { file: "cap-noir", shape: "cap", color: "#1E1E21", name: "Noir Baseball Cap", category: "More" },
];

for (const item of catalog) {
  fs.writeFileSync(path.join(OUT, `${item.file}.svg`), svg(shapes[item.shape](item.color)));
}

fs.writeFileSync(
  path.join(__dirname, "..", "data", "catalog-seed.json"),
  JSON.stringify(
    catalog.map(({ file, name, category, color }) => ({
      name,
      category,
      color,
      imageUrl: `/garments/${file}.svg`,
    })),
    null,
    2
  )
);

console.log(`Generated ${catalog.length} garment SVGs + catalog-seed.json`);
