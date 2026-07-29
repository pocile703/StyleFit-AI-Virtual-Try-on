import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="border-t border-mist mt-auto">
      <div className="mx-auto max-w-6xl px-5 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <Logo />
          <p className="text-sm text-stone max-w-xs">
            Image-based virtual try-on. Upload a photo, pick a garment, see the
            look before you buy it.
          </p>
        </div>
        <nav className="flex gap-6 text-sm text-stone" aria-label="Footer">
          <Link href="/try-on" className="hover:text-ink transition-colors">
            Try On
          </Link>
          <Link href="/outfits" className="hover:text-ink transition-colors">
            Outfits
          </Link>
          <Link href="/about" className="hover:text-ink transition-colors">
            About
          </Link>
        </nav>
      </div>
      <div className="border-t border-mist">
        <div className="mx-auto max-w-6xl px-5 py-4 text-xs text-stone flex flex-wrap justify-between gap-2">
          <span>StyleFit AI — Independent Project, UCSI College</span>
          <span>Diploma in Information Technology · 2026</span>
        </div>
      </div>
    </footer>
  );
}
