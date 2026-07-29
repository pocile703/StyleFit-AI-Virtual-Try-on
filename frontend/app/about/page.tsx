import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import { Stagger, StaggerItem } from "@/components/Stagger";
import TiltCard from "@/components/TiltCard";
import MagneticButton from "@/components/MagneticButton";
import Footer from "@/components/Footer";
import HeroShowcase from "@/components/about/HeroShowcase";

export const metadata: Metadata = { title: "About — StyleFit AI" };

const PROBLEMS = [
  {
    title: "No personalized visualization",
    body: "Most fashion platforms display clothing on standard models that rarely match a shopper's own appearance or body shape.",
  },
  {
    title: "Hard to choose with confidence",
    body: "Without seeing an outfit on themselves, shoppers struggle to judge whether a style actually suits them before paying.",
  },
  {
    title: "Limited try-on features",
    body: "Existing platforms offer little visualization beyond product photos — none of it based on the shopper's own image.",
  },
];

const OBJECTIVES = [
  "Support image-based virtual clothing try-on on the web",
  "Let users upload personal photos and clothing images",
  "Generate a digital outfit preview with try-on technology",
  "Make fashion visualization interactive, not static",
  "Improve confidence during online clothing selection",
];

const SDGS = [
  {
    n: "SDG 9",
    title: "Industry, Innovation & Infrastructure",
    body: "Brings virtual try-on innovation to fashion e-commerce and encourages digital transformation in retail.",
  },
  {
    n: "SDG 12",
    title: "Responsible Consumption & Production",
    body: "Previewing clothing before buying means fewer regretted purchases and fewer returns shipped back and forth.",
  },
  {
    n: "SDG 10",
    title: "Reduced Inequalities",
    body: "Everyone previews clothing on their own image — not on a narrow set of model body types.",
  },
];

const STACK = [
  ["Client", "React + Next.js + Tailwind CSS"],
  ["API server", "Node.js + Express REST API"],
  ["AI service", "FASHN AI Virtual Try-On (tryon-v1.6)"],
  ["Storage", "MongoDB + Cloudinary (planned)"],
];

export default function AboutPage() {
  return (
    <main className="flex-1">
      <HeroShowcase />

      <section className="mx-auto max-w-3xl px-5 pt-16 pb-12 text-center">
        <Reveal>
          <p className="eyebrow text-stone">About the project</p>
          <h1 className="mt-4 font-display font-semibold text-4xl md:text-6xl tracking-tight">
            Fashion you can preview on{" "}
            <span className="bg-accent text-paper px-2 leading-tight">yourself.</span>
          </h1>
          <p className="mt-5 text-lg text-stone leading-relaxed">
            StyleFit AI is an Independent Project for the Diploma in
            Information Technology at UCSI College. It explores image-based
            virtual try-on: upload a photo and a garment, and see the
            combination before any purchase decision.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <Reveal>
          <h2 className="font-display font-semibold text-2xl tracking-tight">
            The problem
          </h2>
        </Reveal>
        <Stagger className="mt-6 grid md:grid-cols-3 gap-4">
          {PROBLEMS.map((p) => (
            <StaggerItem key={p.title} className="h-full">
              <TiltCard className="p-6 rounded-2xl border border-mist bg-card/60">
                <h3 className="font-display font-medium text-lg">{p.title}</h3>
                <p className="mt-2 text-sm text-stone leading-relaxed">
                  {p.body}
                </p>
              </TiltCard>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <Stagger className="mx-auto max-w-6xl px-5 py-12 grid md:grid-cols-2 gap-10">
        <StaggerItem>
          <h2 className="font-display font-semibold text-2xl tracking-tight">
            Objectives
          </h2>
          <ul className="mt-5 space-y-3">
            {OBJECTIVES.map((o) => (
              <li key={o} className="flex items-start gap-3 text-stone">
                <span className="mt-1 grid place-items-center w-5 h-5 shrink-0 rounded-full bg-veil text-noir">
                  <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {o}
              </li>
            ))}
          </ul>
        </StaggerItem>

        <StaggerItem>
          <h2 className="font-display font-semibold text-2xl tracking-tight">
            System architecture
          </h2>
          <div className="mt-5 rounded-2xl border border-mist overflow-hidden">
            {STACK.map(([layer, tech], i) => (
              <div
                key={layer}
                className={`flex items-center justify-between gap-4 px-5 py-4 text-sm ${
                  i > 0 ? "border-t border-mist" : ""
                }`}
              >
                <span className="font-medium">{layer}</span>
                <span className="text-stone text-right">{tech}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 max-w-md text-xs text-stone leading-relaxed">
            Try-on generation is powered by the FASHN AI API. Without an API
            key the server falls back to an offline prototype composite, so
            the full flow works in any environment.
          </p>
        </StaggerItem>
      </Stagger>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <Reveal>
          <h2 className="font-display font-semibold text-2xl tracking-tight">
            Sustainable Development Goals
          </h2>
        </Reveal>
        <Stagger className="mt-6 grid md:grid-cols-3 gap-4">
          {SDGS.map((s) => (
            <StaggerItem key={s.n} className="h-full">
              <TiltCard className="p-6 rounded-2xl bg-veil/60">
                <span className="inline-block eyebrow text-paper bg-accent px-2 py-0.5">{s.n}</span>
                <h3 className="mt-3 font-display font-medium text-lg leading-snug">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-stone leading-relaxed">
                  {s.body}
                </p>
              </TiltCard>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
        <Reveal>
          <h2 className="font-display font-semibold text-3xl tracking-tight">
            See it in action.
          </h2>
          <div className="mt-6 flex justify-center">
            <MagneticButton
              href="/try-on"
              icon={
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              }
              iconWrapClassName="bg-paper/15"
              accent
              className="pl-7 pr-2.5 py-2.5 rounded-full bg-noir text-paper font-medium transition-colors"
            >
              Start a try-on
            </MagneticButton>
          </div>
        </Reveal>
      </section>

      <Footer />
    </main>
  );
}
