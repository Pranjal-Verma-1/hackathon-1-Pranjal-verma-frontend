import type { RefObject } from "react";
import type { TripMode } from "@/lib/trip";
import { primaryButtonClass } from "./field";

const MODES: { id: TripMode; title: string; detail: string }[] = [
  {
    id: "quick",
    title: "Quick Flight",
    detail: "Origin, destination, dates, travellers, and the two prices you already have.",
  },
  {
    id: "full",
    title: "Full Trip Plan",
    detail:
      "The same prices, plus a date window, nearby airports, a split party, cabin, and a note.",
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
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onContinue();
      }}
    >
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="max-w-[16ch] text-3xl font-semibold tracking-tight text-balance outline-none sm:text-4xl"
      >
        See if points beat the cash fare
      </h1>
      <p className="mt-4 max-w-prose text-base leading-7 text-muted">
        Enter a fare you have already found and the points quote beside it. A Una Milla estimates
        the cash difference, the percentage, and what each point is worth on that trade.
      </p>
      <fieldset className="mt-10">
        <legend className="text-lg font-semibold">How much do you want to enter?</legend>
        <div className="mt-4 border-t border-line">
          {MODES.map((option) => {
            const selected = mode === option.id;
            return (
              <label
                key={option.id}
                className={`choice block cursor-pointer border-b border-line px-4 py-4 ${
                  selected ? "bg-depth text-foam" : "bg-sheet text-ink hover:bg-paper"
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
                <span className="block text-lg font-semibold">{option.title}</span>
                <span className={`mt-1 block max-w-prose text-sm leading-6 ${selected ? "text-foam-muted" : "text-muted"}`}>
                  {option.detail}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      {mode === null ? (
        <p className="mt-4 text-sm text-muted">Choose a way to enter the trip first.</p>
      ) : null}
      <div className="mt-8">
        <button type="submit" className={primaryButtonClass} disabled={mode === null}>
          {mode === "quick" ? "Continue with Quick Flight" : mode === "full" ? "Continue with Full Trip Plan" : "Continue"}
        </button>
      </div>
    </form>
  );
}
