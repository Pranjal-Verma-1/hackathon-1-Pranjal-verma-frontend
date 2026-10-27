import type { Metadata } from "next";
import { Literata, Schibsted_Grotesk } from "next/font/google";
import Link from "next/link";
import { HeaderLinks } from "@/components/header-links";
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
  title: "A Una Milla — Cash fare versus points savings",
  description:
    "Compare a flight cash fare with a points redemption you already have. A Una Milla estimates the euro difference. Points are treated as already earned and are not given a price. The app does not search live fares, check award seats, or book flights.",
  applicationName: "A Una Milla",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-paper font-sans text-ink antialiased">
        <a href="#main" className="skip-link">
          Skip to the trip
        </a>
        <header className="sticky top-0 z-30 bg-ink text-foam">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 px-4 sm:px-6 md:h-16 md:flex-nowrap">
            <Link href="/" className="header-link flex h-16 items-center gap-2.5 rounded-sm text-foam">
              <MileMark className="size-8 text-marker" />
              <span className="font-serif text-xl font-semibold tracking-[-0.03em]">A Una Milla</span>
            </Link>

            <HeaderLinks />

            <p className="hidden h-16 items-center text-sm text-foam-muted lg:flex">Points against the cash fare</p>
          </div>

          <div className="border-t border-white/10 bg-sheet px-4 py-2 text-ink">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 sm:px-2">
              <p className="min-w-0 text-sm leading-5">
                <strong className="font-semibold">Demo.</strong> Estimates use only the figures you enter. This app does not search live fares, check award seats, or book flights.
              </p>
              <span className="hidden shrink-0 text-xs text-muted sm:inline">EUR · Savings estimate</span>
            </div>
          </div>
        </header>

        <div className="flex-1">{children}</div>

        <footer className="mt-16 border-t border-line">
          <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
            <div className="flex items-center gap-2.5">
              <MileMark className="size-6 text-marker" />
              <span className="font-serif text-lg font-semibold tracking-[-0.03em]">A Una Milla</span>
            </div>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
              A cash fare compared with a points redemption you already have. Points are treated as already earned and are not given a euro price.
            </p>
            <p className="mt-6 text-xs text-muted">Demo figures for Madrid to Barcelona are illustrative.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
