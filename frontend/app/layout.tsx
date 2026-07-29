import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import Nav from "@/components/Nav";
import SmoothScroll from "@/components/SmoothScroll";

// Applies the stored theme before first paint to avoid a light-mode flash.
const themeBootScript = `(function(){try{var t=localStorage.getItem("stylefit_theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}})()`;

const clash = localFont({
  src: [
    { path: "../fonts/ClashDisplay-Medium.woff2", weight: "500" },
    { path: "../fonts/ClashDisplay-Semibold.woff2", weight: "600" },
  ],
  variable: "--font-clash",
  display: "swap",
});

const switzer = localFont({
  src: [
    { path: "../fonts/Switzer-Regular.woff2", weight: "400" },
    { path: "../fonts/Switzer-Medium.woff2", weight: "500" },
    { path: "../fonts/Switzer-Semibold.woff2", weight: "600" },
  ],
  variable: "--font-switzer",
  display: "swap",
});

export const metadata: Metadata = {
  title: "StyleFit AI — See yourself in every style",
  description:
    "Upload your photo and any clothing image to instantly preview how it looks on you. Image-based virtual try-on for online fashion.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${clash.variable} ${switzer.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <ThemeProvider>
          <AuthProvider>
            <SmoothScroll>
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[var(--z-toast)] focus:rounded-full focus:bg-noir focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-paper"
              >
                Skip to content
              </a>
              <Nav />
              {children}
            </SmoothScroll>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
