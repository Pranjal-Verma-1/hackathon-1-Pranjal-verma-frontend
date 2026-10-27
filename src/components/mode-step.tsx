import type { RefObject } from "react";
import type { TripMode } from "@/lib/trip";
import { primaryButtonClass, secondaryButtonClass, sectionTitleClass } from "./field";
import { HopMark } from "./mile-mark";
import { HeroVisual } from "./hero-visual";

const MODES: { id: TripMode; title: string; tag: string; detail: string; stops: 2 | 3 }[] = [
  {
    id: "quick",
    title: "Quick Flight",
    tag: "Fastest comparison",
    detail: "Origin, destination, dates, travellers, and the two prices you already have.",
    stops: 2,
  },
  {
    id: "full",
    title: "Full Trip Plan",
    tag: "Custom preferences",
    detail: "The same prices, plus a date window, nearby airports, a split party, cabin, and a note.",
    stops: 3,
  },
];

export function ModeStep({
  mode,
  headingRef,
  onMode,
  onContinue,
}: {
  mode: TripMode | null;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onMode: (mode: TripMode) => void;
  onContinue: () => void;
}) {
  const handlePrimaryCompare = () => {
    if (mode) {
      onContinue();
    } else {
      onMode("quick");
      onContinue();
    }
  };

  return (
    <div className="w-full">
      {/* Two-Column Hero Section */}
      <section className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12 py-4 sm:py-8">
        {/* Left Column: Editorial Headline & Actions */}
        <div className="flex flex-col justify-center lg:col-span-7">
          <div className="self-start inline-flex items-center gap-2 rounded-full border border-line bg-sheet px-3.5 py-1 text-xs font-semibold text-muted shadow-subtle mb-5">
            <span className="size-2 rounded-full bg-marker" />
            <span>Editorial Travel Valuation</span>
          </div>

          <h1
            ref={headingRef}
            tabIndex={-1}
            className="display text-4xl font-bold leading-[1.08] tracking-tight text-ink outline-none sm:text-5xl lg:text-6xl text-balance"
          >
            Make every mile count.
          </h1>

          <p className="mt-5 text-base sm:text-lg leading-relaxed text-muted max-w-xl">
            Compare the cash fare with your points redemption, understand the real savings, and plan
            your next journey with confidence.
          </p>

          {/* Primary & Secondary Hero CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handlePrimaryCompare}
              className={`${primaryButtonClass} text-base px-7 min-h-[50px] shadow-card`}
            >
              Compare a trip
              <span aria-hidden="true" className="ml-1">➔</span>
            </button>

            <a
              href="#how-it-works"
              className={`${secondaryButtonClass} text-base px-6 min-h-[50px] no-underline`}
            >
              How it works
            </a>
          </div>

          {/* Form for mode selection cards */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              onContinue();
            }}
            className="mt-10"
          >
            <fieldset>
              <div className="flex items-center justify-between">
                <legend className={sectionTitleClass}>Select your entry mode</legend>
                <span className="text-xs text-muted">2 options available</span>
              </div>

              <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2">
                {MODES.map((option) => {
                  const selected = mode === option.id;
                  return (
                    <label
                      key={option.id}
                      className={`choice group relative flex min-h-40 cursor-pointer flex-col justify-between rounded-xl border p-5 transition-all hover-card ${
                        selected
                          ? "border-ink bg-sheet ring-2 ring-ink shadow-card"
                          : "border-line bg-sheet text-ink hover:border-line-strong hover:bg-subtle/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="entry-mode"
                        value={option.id}
                        checked={selected}
                        onChange={() => onMode(option.id)}
                        className="sr-only"
                      />

                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              selected
                                ? "bg-ink text-white"
                                : "bg-subtle text-muted group-hover:bg-line"
                            }`}
                          >
                            {option.tag}
                          </span>
                          <span
                            className={`size-4 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                              selected ? "border-ink bg-ink text-white" : "border-line-strong text-transparent"
                            }`}
                          >
                            ✓
                          </span>
                        </div>

                        <span className="mt-3 block text-base font-bold tracking-tight text-ink">
                          {option.title}
                        </span>

                        <span className="mt-1.5 block text-xs leading-5 text-muted">
                          {option.detail}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-line/80 pt-3">
                        <span className="text-[11px] font-medium text-tertiary">
                          {option.stops === 2 ? "2 data stops" : "3 data stops"}
                        </span>
                        <HopMark stops={option.stops} />
                      </div>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                className={`${primaryButtonClass} w-full sm:w-auto`}
                disabled={mode === null}
              >
                {mode === "quick"
                  ? "Continue with Quick Flight"
                  : mode === "full"
                    ? "Continue with Full Trip Plan"
                    : "Select a mode to continue"}
              </button>

              <p className="text-xs text-muted sm:ml-2">
                You enter quotes you already have. No fare is looked up.
              </p>
            </div>
          </form>
        </div>

        {/* Right Column: Bespoke Travel Visual Art */}
        <div className="lg:col-span-5">
          <HeroVisual />
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="mt-16 border-t border-line pt-12">
        <div className="max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">Methodology</span>
          <h2 className="display text-2xl sm:text-3xl font-bold tracking-tight text-ink mt-1">
            How A Una Milla evaluates your trade
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Frequent flyer programs make redemptions deliberately confusing. We reduce every award
            ticket to clean financial arithmetic so you never burn points on a bad flight.
          </p>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-line bg-sheet p-5 shadow-subtle">
            <span className="flex size-8 items-center justify-center rounded-lg bg-subtle text-xs font-bold text-ink">
              01
            </span>
            <h3 className="mt-3 text-base font-bold text-ink">Bring Your Quotes</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              Enter the cash ticket price and the award points quote you already received from your
              airline or booking platform.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-sheet p-5 shadow-subtle">
            <span className="flex size-8 items-center justify-center rounded-lg bg-subtle text-xs font-bold text-ink">
              02
            </span>
            <h3 className="mt-3 text-base font-bold text-ink">Uncover Real Math</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              We deduct taxes and fees from the cash price to calculate actual euros saved and your
              exact euro-cents value per point.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-sheet p-5 shadow-subtle">
            <span className="flex size-8 items-center justify-center rounded-lg bg-subtle text-xs font-bold text-ink">
              03
            </span>
            <h3 className="mt-3 text-base font-bold text-ink">Book With Clarity</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              Review a pre-booking checklist to confirm seat availability, transfer times, and refund
              rules before ticketing.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
