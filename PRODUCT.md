# Product

## Register

product

## Platform

web

## Users

Everyday online clothing shoppers deciding whether to buy. They arrive mid-consideration — a garment caught their eye and the open question is "will this actually look right on me?" They use StyleFit on desktop or phone, often in the same session as browsing a store, and the job to be done is to buy with confidence and avoid the return-it-later gamble. The interface speaks to these shoppers directly; the design serves the try-on workflow they came to complete.

## Product Purpose

StyleFit is an image-based virtual try-on tool: a shopper uploads their own photo, picks a garment, and gets a realistic generated image of that garment on themselves, which they can save into a personal outfit collection. It exists to collapse the confidence gap between seeing clothes on a model and seeing them on your own body. Success is a real, shippable product — a try-on flow that works end-to-end, holds up on empty/error/edge states, and feels premium enough that a shopper would trust it with a purchase decision, not just a demo that survives a happy path.

## Positioning

See it on *you* before buying. Not a model, not a size chart, not an imagined fit — your own photo wearing the actual garment. Every screen reinforces that the person in the result is the user.

## Brand Personality

Premium, editorial, and confident — with **two voices split by surface**. The **marketing front-of-house** (landing, About) is expressive and high-voltage — but still monochrome: oversized kinetic type, inverted black/white block highlights, and 3D scroll motion that says "this is worth your attention." The **workflow itself** (upload → pick → generate → save) stays quiet and restrained — a fashion gallery, not a shopping mall — because a shopper mid-decision needs trust and focus, not spectacle. It sells by showing the result, not by shouting adjectives or stacking feature badges. The loud front door earns the click; the calm workroom earns the purchase.

## Anti-references

Actively avoid all four of these looks:
- **Cluttered e-commerce** — busy retail grids, banner ads, SALE badges, filter walls, fast-fashion density.
- **Generic SaaS template** — purple gradients, rounded-everything, hero-metric cards, tracked-caps eyebrows above every section, the AI-startup landing look.
- **Cheesy AI-gimmick tool** — neon "AI POWERED" badges, sparkle emojis, robot mascots, novelty-toy energy that undercuts trust.
- **Sterile enterprise dashboard** — gray-on-gray admin panels, data-dense tables, corporate blue, cold utility.

## Design Principles

- **Confidence before checkout.** Every screen exists to shrink the "will this look right on me?" doubt. If an element doesn't build trust in the fit, question whether it belongs.
- **Show, don't tell.** The try-on result is the proof. Let the generated image and real garment photography carry the persuasion; never substitute adjectives for evidence.
- **Restraint is the luxury.** The premium feel comes from what's removed. Monochrome, whitespace, and one confident type voice read as intentional; density and decoration read as cheap.
- **Frictionless flow.** Upload → pick → generate → save should be the shortest honest path. Never make the shopper stop and think about the tool instead of the clothes.
- **Ship-grade, not demo-grade.** Design the empty state, the failed generation, the slow network, and the first-run moment as deliberately as the happy path — this is meant to survive real shoppers, not just a walkthrough.

## Accessibility & Inclusion

No formal conformance target is being certified against; the standard is best-effort accessibility that doesn't degrade the premium feel. The current build already ships visible `:focus-visible` outlines, `::selection` styling, and a full `prefers-reduced-motion` fallback (the marquee becomes a plain scroll row, sweep/reveal animations collapse). Hold that line: honor reduced motion everywhere, keep monochrome contrast high (body text on paper is near-black by design), and never gate meaning on color alone.
