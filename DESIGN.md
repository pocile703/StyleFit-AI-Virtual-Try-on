---
name: StyleFit AI
description: Image-based virtual try-on — see it on you before buying. A monochrome, editorial fitting room.
colors:
  ink: "#0b0b0c"
  paper: "#fafaf8"
  noir: "#131315"
  noir-deep: "#000000"
  card: "#ffffff"
  veil: "#f1f1ee"
  mist: "#e4e4e1"
  ash: "#7a7a7e"
  stone: "#6e6e73"
  accent: "#0b0b0c"
typography:
  display:
    fontFamily: "Clash Display, Avenir Next, sans-serif"
    fontSize: "clamp(2.7rem, 6vw, 4.2rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Clash Display, Avenir Next, sans-serif"
    fontSize: "clamp(1.875rem, 4vw, 3rem)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Clash Display, Avenir Next, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Switzer, Helvetica Neue, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Switzer, Helvetica Neue, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.18em"
rounded:
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  3xl: "24px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.noir}"
    textColor: "{colors.paper}"
    rounded: "{rounded.full}"
    padding: "12px 24px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.noir-deep}"
    textColor: "{colors.paper}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "10px 20px"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "10px 16px"
  chip-selected:
    backgroundColor: "{colors.noir}"
    textColor: "{colors.paper}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
  chip-unselected:
    backgroundColor: "{colors.veil}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
---

# Design System: StyleFit AI

## 0. Two-Register System

StyleFit runs **two deliberate design registers**, split by surface:

- **Front-of-house (marketing): "Electric Editorial."** The landing page, the About
  page, and shared marketing chrome (Nav accents, route transitions). Here the system is
  **expressive and motion-forward — but still monochrome.** No hue: the marketing "pop" is
  carried by oversized kinetic Clash Display type, **inverted-block highlights** (the `accent`
  token aliases ink, so a `bg-accent` block is an editorial marker — ink fill + `text-paper` —
  that flips with the theme: black-on-white in light, white-on-black in dark), and 3D scroll
  motion (Lenis smooth-scroll, pinned scroll-scrub, tilt cards), plus a scroll-velocity marquee.
  This is the loud, confident front door.
- **Workroom (app / task): "The Monochrome Atelier."** The try-on wizard, outfits, profile,
  and the signed-in shell. Here restraint is non-negotiable and the **One-Ink Rule holds
  fully** — no accent color, no 3D scrub, calm task-serving motion only. A shopper mid-decision
  needs trust and focus, not spectacle. **Never leak the accent or loud motion into these surfaces.**

The two registers share the same tokens, type, and pill geometry; only the accent permission
and motion intensity differ. Sections 1–6 below describe the Atelier baseline; the Electric
Editorial layer sits **on top of it, on marketing surfaces only.**

**`accent` usage rules:** monochrome — `--color-accent` aliases `--color-ink`, so the accent is
an **inverted block**, never a hue. Use it as fill/shape (highlight behind a headline word,
active-nav underline, button hover-fill, section numbers) with **`text-paper` on it** (both
tokens invert together, so contrast is always ~18:1 in either theme). Never body text on paper,
never scattered. Recolor is a single line: repoint `--color-accent` in `globals.css`. (History:
electric lime `#d8ff3e` → electric cobalt `#2c50f4` → monochrome, per the brief for a premium
fashion register.)

## 1. Overview

**Creative North Star: "The Monochrome Atelier"** *(workroom baseline; see §0 for the
Electric Editorial marketing layer)*

StyleFit is a couturier's studio rendered in black and white. Every surface exists in service of one thing: the garment on the user's own body. The palette is disciplined to a single ink and a gallery-white paper, so nothing competes with the imagery — the try-on result is the only color in the room. Space is generous, type is confident, and structure is drawn in hairlines rather than boxes. This is a fitting room that feels expensive because of what it leaves out, not what it piles on.

The system rejects the density and noise of retail. It is deliberately *not* a shopping mall: no banner ads, no SALE badges, no filter walls. It is also not a generic SaaS product — no purple gradients, no hero-metric cards, no tracked-caps eyebrow stacked above every section. And it refuses the novelty-toy energy of an "AI tool": no neon "AI POWERED" badges, no sparkle emojis, no robot mascots. Restraint is the entire aesthetic argument. Where the interface speaks, it speaks in one voice.

Depth is behavioral, not decorative. Surfaces sit flat at rest and only lift in response to the user — the primary action rises on hover, floating chips cast a shadow because they hover over imagery. Motion is purposeful (a scan-line sweep during generation, a marquee that becomes a real scroll row under reduced motion), never ambient.

**Key Characteristics:**
- Monochrome: one ink, one paper, four neutral grays for hierarchy. No hue.
- Editorial type: Clash Display for confident headlines, Switzer for calm body.
- Pill geometry: `rounded-full` is the default shape language for actions and controls.
- Flat by default; shadow and lift are earned by interaction.
- Imagery is the only color — the generated try-on is the hero of every screen it appears on.

## 2. Colors

A strict monochrome scale: one near-black ink used as both text and the sole action color, one warm-neutral gallery white, and a graded set of grays for hierarchy and structure. Every token inverts under `.dark` (see Named Rules).

### Primary
- **Atelier Ink** (`#0b0b0c`): The single accent. Body text at full strength, and the color of every primary action's fill (`noir` `#131315` is its action-surface sibling, near-identical, used for button and chip backgrounds). This is the only "color" the system permits.
- **Pure Noir** (`#000000`): Reserved for the pressed/hover state of primary actions (`noir-deep`) — the button darkens to true black on hover. A deliberate one-step deepening, not a new color.

### Neutral
- **Gallery Paper** (`#fafaf8`): The warm-white page background. Slightly off-pure so it reads as paper, not screen.
- **Card White** (`#ffffff`): Raised card/surface fill, distinct from the paper page beneath it (in light mode). Use `card`, never a hardcoded `bg-white`, so it inverts to near-black in dark mode.
- **Veil** (`#f1f1ee`): Quiet fill — unselected chips, hover backgrounds, icon-tile surfaces. The lowest-contrast fill in the system.
- **Mist** (`#e4e4e1`): Hairline borders and dividers. Structure is drawn with `mist`, not with boxes or heavy rules.
- **Ash** (`#7a7a7e`) / **Stone** (`#6e6e73`): Muted text — captions, secondary labels, placeholder-adjacent copy. Ash for the lighter muted tier, Stone for the slightly stronger one.

### Named Rules
**The One-Ink Rule** *(workroom surfaces — try-on, outfits, profile, shell).* On the app/task
surfaces, color is prohibited: exactly one accent — black — earning its authority by being the
only non-neutral value on screen. If such a screen needs a second color, the layout is wrong,
not the palette. The only chromatic thing permitted there is user or garment imagery. **On
marketing surfaces the accent is an inverted ink block, not a hue** (see §0) — so the palette
stays monochrome everywhere; only motion intensity and type scale separate the two registers.

**The Inversion Rule.** Every token carries a `.dark` value that inverts the scale — ink becomes near-white, paper becomes near-black — so the *same* class names work in both themes. Never hardcode `text-white` / `bg-white` on UI chrome; that breaks the inversion. The one sanctioned exception is chips that sit *on top of imagery* (ORIGINAL/TRY-ON labels, garment name tags), which stay literal `bg-black/70 text-white` in both themes because they live on a photo, not on UI.

## 3. Typography

**Display Font:** Clash Display (with Avenir Next fallback) — self-hosted, weights 500 and 600 only.
**Body Font:** Switzer (with Helvetica Neue fallback) — self-hosted, weights 400 / 500 / 600.

**Character:** A geometric-editorial display paired with a clean humanist-grotesque body. Clash carries the fashion-magazine confidence in headlines; Switzer keeps long copy calm and legible. The pairing contrasts on the display-vs-text axis rather than fighting as two similar sans-serifs.

### Hierarchy
- **Display** (Clash 600, `clamp(2.7rem, 6vw, 4.2rem)`, line-height 1.05, `tracking-tight`): Hero headlines only. One per page, at most.
- **Headline** (Clash 600, `clamp(1.875rem, 4vw, 3rem)`, `tracking-tight`): Section headings (`text-3xl md:text-4xl` in practice).
- **Title** (Clash 500–600, `1.25rem`–`1.5rem`, `tracking-tight`): Card titles, step titles, sub-section heads.
- **Body** (Switzer 400, `1rem`, line-height ~1.6): Paragraph copy. Cap measure at 65–75ch.
- **Label** (Switzer 600, `0.72rem`, letter-spacing `0.18em`, UPPERCASE): The `.eyebrow` class — step labels and functional section markers only.

### Named Rules
**The Outline Headline Rule.** In a monochrome system, color cannot carry emphasis — so the hero's emphasized word is rendered as outline text via `-webkit-text-stroke: 2px var(--color-ink)` with a transparent fill, not a colored or gradient fill. Outline text reads as an intentional editorial choice. Gradient text is forbidden.

**The Earned-Eyebrow Rule.** The letterspaced uppercase `.eyebrow` is permitted as a *functional* label (a wizard step, a single named section marker) — never as decorative scaffolding stacked above every section. One deliberate kicker is voice; an eyebrow on every block is AI grammar.

## 4. Elevation

Flat by default. Surfaces rest with no shadow; depth is a *response to state*, not a resting property. Hierarchy at rest is carried by the tonal neutrals (`paper` under `card`, `veil` fills, `mist` hairlines), not by drop shadows. Shadows enter only when the user acts or when an element genuinely floats over imagery.

### Shadow Vocabulary
- **Action lift** (`box-shadow: 0 12px 30px -10px rgba(11,11,12,0.45)` on hover): The primary button's hover state — a soft, low ink-tinted glow paired with a `-2px` translate and `active:scale-[0.98]` press. Tactile and confident.
- **Floating overlay** (`shadow-md` / `shadow-lg`): Chips, tags, and controls layered directly on top of photos (garment name tags, reveal-slider handle, avatar camera badge). The shadow separates them from the busy image beneath, not from the page.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. A shadow that exists before the user has done anything is a bug. Elevation is earned by hover, drag, focus, or by literally floating over an image — never applied to a static card to make it "pop."

## 5. Components

### Buttons
- **Shape:** Fully pill (`rounded-full`, `9999px`). This is the signature geometry — actions are always pills.
- **Primary:** `noir` (`#131315`) fill, `paper` text, `12px 24px` padding (`px-6 py-3`), Switzer medium. Tactile and confident: hovers darken to `noir-deep` (`#000000`), lift `-2px` with the action-lift shadow, and press to `scale-[0.98]`.
- **Hover / Focus:** Background → `noir-deep`; transform lift; `active:scale`. Focus shows the global `:focus-visible` ring (`2px solid ink`, `3px offset`).
- **Secondary / Ghost:** Transparent/`paper` fill with a `mist` hairline border; hover shifts the border to `ink`. Same pill shape, slightly tighter padding (`px-5 py-2.5`).

### Chips
- **Style:** Pill (`rounded-full`), Switzer medium, `8px 16px`.
- **State:** Selected → `noir` fill, `paper` text. Unselected → `veil` fill, `ink` text (or `mist` hairline border for toggle groups). Segmented toggles sit inside a `veil` track (`p-1 rounded-full bg-veil`).

### Cards / Containers
- **Corner Style:** `rounded-2xl` (`16px`) for standard cards, `rounded-3xl` (`24px`) for larger feature surfaces; icon tiles use `rounded-xl` (`12px`).
- **Background:** `card` (`#ffffff` light / near-black dark). Never hardcoded `bg-white`.
- **Shadow Strategy:** Flat at rest per the Flat-By-Default Rule; no resting shadow.
- **Border:** `mist` hairline where structure is needed; often borderless on `paper`.
- **Internal Padding:** `lg` (`24px`) typical.

### Inputs / Fields
- **Style:** Pill (`rounded-full`), `mist` hairline border, `card/70` fill, `10px 16px` padding.
- **Focus:** Border shifts to `noir` (`focus:border-noir`); no glow. Paired with the global focus ring for keyboard users.
- **Placeholder:** Keep placeholder contrast readable — muted `ash`/`stone`, not a faint gray that drops below legibility.

### Navigation
- **Style:** Minimal top bar on `paper`; wordmark left, links + `Avatar` + theme toggle right. Links are `stone` at rest → `ink` on hover, often with a `veil` hover pill or a `2px` ink underline for the active route.
- **Mobile:** Hamburger paired with the theme toggle in a shared flex wrapper; `Avatar` uses the shared component at `sm` size.

### Signature: The Reveal Slider
A before/after comparison for the try-on result — a draggable handle (`w-11 h-11 rounded-full bg-white shadow-lg`) splits ORIGINAL and TRY-ON, with the labels as `bg-black/70 text-white` photo-overlay chips. The `role="slider"` element is a **44px-wide transparent column** centred on the split, with the hairline divider as a child: the divider itself used to carry the role, which made the target 2px wide. This is the payoff component: it *shows* the garment on the user, the core of "see it on you."

## 6. Do's and Don'ts

### Do:
- **Do** keep to the One-Ink Rule: black is the only accent; let user/garment imagery be the only color on screen.
- **Do** use `rounded-full` for every action and control — pills are the signature geometry.
- **Do** use the `card` token for surfaces, never `bg-white`, so dark mode inverts correctly.
- **Do** carry emphasis with weight, size, or the `-webkit-text-stroke` outline headline — never color.
- **Do** keep surfaces flat at rest; add shadow only on hover, drag, focus, or when floating over a photo.
- **Do** honor `prefers-reduced-motion` everywhere (marquee → scroll row, sweep/reveals collapse) — motion is already gated, keep it that way.

### Don't:
- **Don't** look like cluttered e-commerce — no busy retail grids, banner ads, red SALE badges, or filter walls.
- **Don't** look like a generic SaaS template — no purple gradients, no rounded-everything hero-metric cards, no tracked-caps eyebrow above every section.
- **Don't** look like a cheesy AI-gimmick tool — no neon "AI POWERED" badges, no sparkle emojis, no robot mascots.
- **Don't** look like a sterile enterprise dashboard — no gray-on-gray admin panels, no corporate blue, no data-dense tables.
- **Don't** introduce a second color. If a screen seems to need one, the layout is wrong, not the palette.
- **Don't** use gradient text or `background-clip: text`. The outline headline is the sanctioned emphasis device.
- **Don't** hardcode `text-white` / `bg-white` on UI chrome — the only exception is chips sitting directly on imagery.
- **Don't** apply a resting shadow to a static card to make it "pop." A shadow before interaction is a bug.
