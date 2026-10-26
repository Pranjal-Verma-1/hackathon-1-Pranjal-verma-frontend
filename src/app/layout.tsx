import type { Metadata } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import { MileMark } from "@/components/mile-mark";
import "./globals.css";

const sans = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-schibsted",
  display: "swap",
});

export const metadata: Metadata = {
  title: "A Una Milla",
  description:
    "Compare a cash fare with a points redemption and estimate the saving in euros. Demo mode uses only the amounts you enter and does not book travel.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans antialiased">
        <a href="#main" className="skip-link">
          Skip to the trip
        </a>
        <header className="bg-depth text-foam">
          <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-5 py-4">
            <MileMark className="size-8 shrink-0 text-marker" />
            <p className="text-lg font-semibold tracking-tight">A Una Milla</p>
          </div>
        </header>
        <p className="bg-marker px-5 py-2 text-center text-sm font-medium leading-5 text-ink">
          Demo mode. Estimates use the amounts you enter. This app does not search live fares,
          check award seats, or book tickets.
        </p>
        <div className="flex-1">{children}</div>
        <footer className="mx-auto w-full max-w-3xl px-5 py-8 text-sm leading-6 text-muted">
          A Una Milla does not book travel, hold seats, or connect to an airline. The comparison
          is arithmetic on the amounts you enter.
        </footer>
      </body>
    </html>
  );
}
