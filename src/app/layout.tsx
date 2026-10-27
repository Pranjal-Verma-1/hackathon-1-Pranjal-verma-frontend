import type { Metadata } from "next";
import { Literata, Schibsted_Grotesk } from "next/font/google";
import { MileMark } from "@/components/mile-mark";
import "./globals.css";

const sans = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-schibsted",
  display: "swap",
});

const display = Literata({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-literata",
  display: "swap",
});

export const metadata: Metadata = {
  title: "A Una Milla — Flight Cash vs Points Valuation",
  description:
    "Compare a cash fare with a points redemption and estimate the saving in euros. Demo mode uses only the amounts you enter and does not book travel.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-paper font-sans text-ink antialiased">
        <a href="#main" className="skip-link">
          Skip to the trip
        </a>
        <header className="sticky top-0 z-30 border-b border-line bg-sheet/95 backdrop-blur-sm">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-ink text-marker shadow-sm transition-transform hover:scale-105">
                <MileMark className="size-5" />
              </span>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg font-bold tracking-tight text-ink sm:text-xl">
                  A Una Milla
                </span>
                <span className="hidden rounded-full border border-line bg-subtle px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted sm:inline-block">
                  Travel Ledger
                </span>
              </div>
            </div>

            <nav className="hidden items-center gap-6 text-sm font-medium text-muted md:flex" aria-label="Quick links">
              <a href="#main" className="transition-colors hover:text-ink">
                Compare
              </a>
              <a href="#how-it-works" className="transition-colors hover:text-ink">
                How it works
              </a>
              <a href="#principles" className="transition-colors hover:text-ink">
                Methodology
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-subtle px-2.5 py-1 text-xs font-semibold text-muted">
                <span className="size-1.5 rounded-full bg-emerald-600" />
                Demo Mode
              </span>
            </div>
          </div>

          <div className="border-t border-line bg-subtle/80 px-4 py-1.5 text-xs text-muted">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-0 sm:px-2">
              <p className="truncate">
                <strong className="font-semibold text-ink">Demo:</strong> Estimates use only the figures you enter. This app does not search live fares, check award seats, or sell tickets.
              </p>
              <span className="hidden shrink-0 font-mono text-[11px] text-tertiary sm:inline">
                EUR • Points valuation
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1">{children}</div>

        <footer className="border-t border-line bg-sheet mt-16">
          <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="flex size-7 items-center justify-center rounded-md bg-ink text-marker">
                    <MileMark className="size-4" />
                  </span>
                  <span className="font-serif text-base font-bold text-ink">A Una Milla</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  An editorial tool for travellers evaluating award bookings against cash fares. Make every mile count with transparent financial arithmetic.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink">Trip Steps</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted">
                  <li>1. Choose Quick Flight or Full Trip Plan</li>
                  <li>2. Enter route, dates, travellers, and prices</li>
                  <li>3. Compare net savings and value per point</li>
                  <li>4. Review your booking checklist</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink">Honest Boundaries</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  All comparisons are arithmetic on entered figures. A Una Milla does not connect to live airline APIs, hold award inventory, or issue airline tickets.
                </p>
              </div>
            </div>

            <div className="mt-10 border-t border-line pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-tertiary">
              <p>© 2026 A Una Milla. Editorial travel points comparison.</p>
              <p>Demo figures are illustrative Madrid to Barcelona sample rates.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
