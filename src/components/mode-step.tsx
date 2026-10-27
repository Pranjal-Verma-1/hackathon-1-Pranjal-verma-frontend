import type { RefObject } from "react";
import { modeForHeroContinue } from "@/lib/journey-rules";
import type { TripMode } from "@/lib/trip";
import { primaryButtonClass, secondaryButtonClass, sectionTitleClass } from "./field";
import { ArrowIcon, CheckIcon, HopMark } from "./mile-mark";
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
  onContinue: (mode?: TripMode) => void;
}) {
  const handlePrimaryCompare = () => {
    onContinue(modeForHeroContinue(mode));
  };

  return (
    <div className="w-full">
      {/* Two-Column Hero Section */}
      <section className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12 py-4 sm:py-8">
        {/* Left Column: Editorial Headline & Actions */}
        <div className="flex flex-col justify-center lg:col-span-7">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="display text-[2.35rem] font-semibold leading-[1.08] tracking-[-0.03em] text-balance text-ink outline-none sm:text-5xl"
          >
            Make every mile count.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-muted sm:text-lg">
            Compare a cash fare with a points redemption you already have. The result is the euro difference. Points are treated as already earned and are not given a price.
          </p>

          {/* Primary & Secondary Hero CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handlePrimaryCompare}
              className={primaryButtonClass}
            >
              Compare a trip
              <ArrowIcon />
            </button>

            <a
              href="#how-it-works"
              className={`${secondaryButtonClass} no-underline`}
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
              <legend className={sectionTitleClass}>Select your entry mode</legend>

              <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2">
                {MODES.map((option) => {
                  const selected = mode === option.id;
                  return (
                    <label
                      key={option.id}
                      className={`choice group relative flex min-h-36 cursor-pointer flex-col justify-between rounded-lg border p-4 transition-colors hover-card ${
                        selected
                          ? "border-ink bg-ink text-foam shadow-float"
                          : "border-line bg-sheet text-ink"
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
                            className={`rounded-sm px-2 py-0.5 text-xs font-semibold ${
                              selected ? "bg-marker text-ink" : "bg-subtle text-muted"
                            }`}
                          >
                            {option.tag}
                          </span>
                          <span
                            className={`flex size-5 items-center justify-center rounded-full border ${
                              selected ? "border-marker bg-marker text-ink" : "border-line text-transparent"
                            }`}
                          >
                            <CheckIcon />
                          </span>
                        </div>

                        <span className="mt-3 block font-serif text-xl font-semibold tracking-[-0.03em]">
                          {option.title}
                        </span>

                        <span className={`mt-1.5 block text-sm leading-6 ${selected ? "text-foam-muted" : "text-muted"}`}>
                          {option.detail}
                        </span>
                      </div>

                      <div className={`mt-4 flex items-center justify-between border-t pt-3 ${selected ? "border-white/15" : "border-line"}`}>
                        <span className={`text-xs ${selected ? "text-foam-muted" : "text-muted"}`}>
                          {option.stops === 2 ? "Direct comparison" : "Comparison plus preferences"}
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
    </div>
  );
}
