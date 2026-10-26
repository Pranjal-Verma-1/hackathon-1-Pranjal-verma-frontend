import type { RefObject } from "react";
import {
  SAVINGS_ASSUMPTIONS,
  comparisonHeadline,
  comparisonNotes,
  formatPerPoint,
  formatSavingsPercent,
  savingsIssueMessage,
  type SavingsComparison,
  type SavingsIssueCode,
} from "@/lib/savings";
import { formatEurFromCents, formatPoints } from "@/lib/money";
import { preferenceLines, routeSummary, type ValidatedTrip } from "@/lib/trip";
import { usesExampleFigures } from "@/lib/validation";
import { primaryButtonClass, secondaryButtonClass } from "./field";

export type ComparePhase =
  | { name: "calculating" }
  | { name: "ready"; trip: ValidatedTrip; comparison: SavingsComparison }
  | { name: "failed"; issues: SavingsIssueCode[] }
  | { name: "empty" };

export function CompareStep({
  phase,
  headingRef,
  onBack,
  onGuidance,
}: {
  phase: ComparePhase;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onBack: () => void;
  onGuidance: () => void;
}) {
  if (phase.name === "calculating") {
    return (
      <div role="status" aria-live="polite" aria-busy="true">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-3xl font-semibold tracking-tight outline-none"
        >
          Estimating your comparison
        </h1>
        <p className="mt-4 max-w-prose text-base leading-7 text-muted">
          Working from the figures you entered. No airline is being contacted.
        </p>
        <div className="mt-8 h-1 bg-line" aria-hidden="true">
          <div className="estimate-bar h-1 w-full bg-depth" />
        </div>
        <button type="button" className={`${secondaryButtonClass} mt-8`} onClick={onBack}>
          Back to the trip
        </button>
      </div>
    );
  }

  if (phase.name === "failed") {
    return (
      <div>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-3xl font-semibold tracking-tight outline-none"
        >
          The comparison could not be made
        </h1>
        <ul className="mt-4 grid gap-2">
          {phase.issues.map((issue) => (
            <li key={issue} role="alert" className="text-sm font-medium text-cost">
              {savingsIssueMessage(issue)}
            </li>
          ))}
        </ul>
        <button type="button" className={`${primaryButtonClass} mt-8`} onClick={onBack}>
          Back to the trip
        </button>
      </div>
    );
  }

  if (phase.name === "empty") {
    return (
      <div>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-3xl font-semibold tracking-tight outline-none"
        >
          No comparison yet
        </h1>
        <p className="mt-4 max-w-prose text-base leading-7 text-muted">
          Enter a trip and both prices first. The estimate appears after the form checks out.
        </p>
        <button type="button" className={`${primaryButtonClass} mt-8`} onClick={onBack}>
          Enter a trip
        </button>
      </div>
    );
  }

  const { trip, comparison } = phase;
  const costly = comparison.outcome === "costs-more";
  const notes = comparisonNotes(comparison);

  return (
    <div>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-3xl font-semibold tracking-tight text-balance outline-none sm:text-4xl"
      >
        Cash fare against points
      </h1>
      <p className="mt-4 max-w-prose text-base leading-7 text-muted">{routeSummary(trip)}</p>
      <p
        className={`mt-6 px-4 py-4 text-lg font-semibold leading-snug ${
          costly ? "bg-cost text-cost-foam" : "bg-depth text-foam"
        }`}
      >
        {comparisonHeadline(comparison)}
      </p>
      {usesExampleFigures(trip) ? (
        <p className="mt-4 max-w-prose text-sm leading-6 text-ink">
          These amounts still match the built-in example. They are not a live fare or an available
          award seat.
        </p>
      ) : (
        <p className="mt-4 max-w-prose text-sm leading-6 text-muted">
          Calculated from the amounts in your form, not from an airline.
        </p>
      )}

      {trip.mode === "full" ? (
        <div className="mt-6">
          <h2 className="text-lg font-semibold">Recorded, not priced</h2>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-muted">
            {preferenceLines(trip).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-8 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm tabular-nums">
          <caption className="sr-only">
            Comparison of the cash fare and the points redemption
          </caption>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="py-3 pr-3 font-semibold">
                <span className="sr-only">Item</span>
              </th>
              <th scope="col" className="px-3 py-3 font-semibold">
                Cash fare
              </th>
              <th scope="col" className="py-3 pl-3 font-semibold">
                Points redemption
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-line">
              <th scope="row" className="py-3 pr-3 font-medium">
                Euros due
              </th>
              <td className="whitespace-nowrap px-3 py-3 align-top">
                {formatEurFromCents(comparison.cashPriceCents)}
              </td>
              <td className="py-3 pl-3 align-top">
                <span className="whitespace-nowrap">{formatEurFromCents(comparison.taxesAndFeesCents)}</span>
                <span className="mt-1 block text-muted">Taxes and fees</span>
              </td>
            </tr>
            <tr className="border-b border-line">
              <th scope="row" className="py-3 pr-3 font-medium">
                Points
              </th>
              <td className="px-3 py-3 align-top">None</td>
              <td className="whitespace-nowrap py-3 pl-3 align-top">
                {formatPoints(comparison.pointsRequired)}
              </td>
            </tr>
            <tr className="border-b border-line">
              <th scope="row" className="py-3 pr-3 font-semibold">
                Estimated savings
              </th>
              <td colSpan={2} className={`py-3 pl-3 font-semibold ${costly ? "text-cost" : "text-ink"}`}>
                {formatEurFromCents(comparison.netSavingsCents)}
                <span className="mt-1 block text-sm font-medium">
                  {costly
                    ? "More cash than the fare"
                    : comparison.outcome === "even"
                      ? "Same euros due"
                      : "Less cash than the fare"}
                </span>
                <span className="mt-1 block text-sm font-medium">
                  Savings percentage: {formatSavingsPercent(comparison.savingsPercent)}
                </span>
              </td>
            </tr>
            <tr>
              <th scope="row" className="py-3 pr-3 font-semibold">
                Value per point
              </th>
              <td colSpan={2} className="py-3 pl-3 font-semibold">
                {formatPerPoint(comparison.valuePerPointEur)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {notes.length > 0 ? (
        <ul className="mt-4 grid gap-2 text-sm leading-6 text-ink">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button type="button" className={primaryButtonClass} onClick={onGuidance}>
          See what to do before booking
        </button>
        <button type="button" className={secondaryButtonClass} onClick={onBack}>
          Edit the trip
        </button>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">How this estimate is made</h2>
        <ul className="mt-4 grid gap-3 text-sm leading-6 text-muted">
          {SAVINGS_ASSUMPTIONS.map((assumption) => (
            <li key={assumption}>{assumption}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
