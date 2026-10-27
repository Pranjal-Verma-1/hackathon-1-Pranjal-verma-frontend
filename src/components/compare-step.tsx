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
import { headingClass, primaryButtonClass, secondaryButtonClass, sectionTitleClass } from "./field";

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
      <div role="status" aria-live="polite" aria-busy="true" className="mx-auto max-w-3xl py-12 text-center">
        <div className="inline-flex size-12 items-center justify-center rounded-full bg-subtle text-xl animate-spin mb-4">
          ⚙
        </div>
        <h1 ref={headingRef} tabIndex={-1} className={headingClass}>
          Estimating your comparison
        </h1>
        <p className="mt-3 text-base text-muted max-w-md mx-auto">
          Working from the figures you entered. No airline is being contacted.
        </p>
        <div className="mx-auto mt-8 h-2 max-w-md overflow-hidden rounded-full bg-line" aria-hidden="true">
          <div className="estimate-bar h-full w-full bg-ink" />
        </div>
        <div className="mt-8">
          <button type="button" className={secondaryButtonClass} onClick={onBack}>
            Back to the trip
          </button>
        </div>
      </div>
    );
  }

  if (phase.name === "failed") {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-xl border border-cost-border bg-cost-bg p-6">
          <h1 ref={headingRef} tabIndex={-1} className="text-xl font-bold text-cost">
            The comparison could not be made
          </h1>
          <ul className="mt-4 space-y-2">
            {phase.issues.map((issue) => (
              <li key={issue} role="alert" className="text-sm font-medium text-cost flex items-center gap-2">
                <span>•</span>
                <span>{savingsIssueMessage(issue)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6">
          <button type="button" className={primaryButtonClass} onClick={onBack}>
            Back to the trip
          </button>
        </div>
      </div>
    );
  }

  if (phase.name === "empty") {
    return (
      <div className="mx-auto max-w-3xl py-8">
        <h1 ref={headingRef} tabIndex={-1} className={headingClass}>
          No comparison yet
        </h1>
        <p className="mt-3 text-base text-muted">
          Enter a trip and both prices first. The estimate appears after the form checks out.
        </p>
        <div className="mt-6">
          <button type="button" className={primaryButtonClass} onClick={onBack}>
            Enter a trip
          </button>
        </div>
      </div>
    );
  }

  const { trip, comparison } = phase;
  const costly = comparison.outcome === "costs-more";
  const notes = comparisonNotes(comparison);

  // Status Styling
  const badgeClass = costly
    ? "border-red-200 bg-red-50 text-red-800"
    : comparison.outcome === "even"
      ? "border-stone-200 bg-stone-100 text-stone-800"
      : "border-emerald-200 bg-emerald-50 text-emerald-800";

  const figureTone = costly
    ? "text-cost"
    : comparison.outcome === "even"
      ? "text-ink"
      : "text-save";

  const heroCardBorder = costly
    ? "border-red-200 bg-gradient-to-b from-white to-red-50/40"
    : comparison.outcome === "even"
      ? "border-line bg-sheet"
      : "border-emerald-200 bg-gradient-to-b from-white to-emerald-50/30";

  return (
    <div className="mx-auto max-w-3xl">
      {/* Route breadcrumb badge */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-sheet px-3 py-1 text-xs font-semibold text-muted shadow-subtle">
          <span className="size-1.5 rounded-full bg-marker" />
          <span>{routeSummary(trip)}</span>
        </span>
        <span className="text-xs text-muted uppercase tracking-wider font-bold">
          Stage 3 • Financial Evaluation
        </span>
      </div>

      {/* Main Focal Point: Hero Savings Card */}
      <div className={`rounded-2xl border p-6 sm:p-8 shadow-card ${heroCardBorder}`}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${badgeClass}`}>
            <span className="size-1.5 rounded-full bg-current" />
            {costly
              ? "Unfavorable Trade"
              : comparison.outcome === "even"
                ? "Neutral Result"
                : "Favorable Trade"}
          </span>

          <span className="text-xs font-semibold text-tertiary">
            Direct Financial Comparison
          </span>
        </div>

        <h1 ref={headingRef} tabIndex={-1} className="display text-2xl sm:text-3xl font-bold tracking-tight text-ink outline-none mt-4">
          {costly
            ? "Points ask for more cash."
            : comparison.outcome === "even"
              ? "The euros due match."
              : "Points cost less cash."}
        </h1>

        {/* Primary Savings Display */}
        <div className="mt-5 border-t border-b border-line/80 py-5">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">
            Net Cash Kept (Savings)
          </span>
          <div className="mt-1 flex items-baseline gap-3">
            <span className={`font-sans text-4xl sm:text-6xl font-bold tracking-tight tabular-nums ${figureTone}`}>
              {formatEurFromCents(comparison.netSavingsCents)}
            </span>
            <span className={`text-base font-bold ${figureTone}`}>
              {formatSavingsPercent(comparison.savingsPercent)}
            </span>
          </div>
          <p className="mt-2 text-base font-medium text-ink">
            {comparisonHeadline(comparison)}
          </p>
        </div>

        {usesExampleFigures(trip) ? (
          <div className="mt-4 rounded-lg border border-marker/30 bg-marker/10 p-3 text-xs text-ink">
            <strong>Illustrative example figures:</strong> These amounts match the built-in Madrid to Barcelona sample. They are not a live quote or an available award seat.
          </div>
        ) : (
          <p className="mt-4 text-xs text-muted">
            Calculated from the figures entered in your form, without airline intervention.
          </p>
        )}
      </div>

      {/* 4-Metric Grid Strip (DeskDrop Metric Strip pattern) */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-line bg-sheet p-4 shadow-subtle">
          <span className="text-xs font-semibold text-muted">Points required</span>
          <div className="mt-1.5 text-lg sm:text-xl font-bold tracking-tight tabular-nums text-ink">
            {formatPoints(comparison.pointsRequired)}
          </div>
          <span className="text-[11px] text-tertiary">Total points</span>
        </div>

        <div className="rounded-xl border border-line bg-sheet p-4 shadow-subtle">
          <span className="text-xs font-semibold text-muted">Taxes & fees</span>
          <div className="mt-1.5 text-lg sm:text-xl font-bold tracking-tight tabular-nums text-ink">
            {formatEurFromCents(comparison.taxesAndFeesCents)}
          </div>
          <span className="text-[11px] text-tertiary">Cash due on award</span>
        </div>

        <div className="rounded-xl border border-line bg-sheet p-4 shadow-subtle">
          <span className="text-xs font-semibold text-muted">Value per point</span>
          <div className="mt-1.5 text-lg sm:text-xl font-bold tracking-tight tabular-nums text-ink">
            {formatPerPoint(comparison.valuePerPointEur)}
          </div>
          <span className="text-[11px] text-tertiary">Euros per point</span>
        </div>

        <div className="rounded-xl border border-line bg-sheet p-4 shadow-subtle">
          <span className="text-xs font-semibold text-muted">Savings rate</span>
          <div className={`mt-1.5 text-lg sm:text-xl font-bold tracking-tight tabular-nums ${figureTone}`}>
            {formatSavingsPercent(comparison.savingsPercent)}
          </div>
          <span className="text-[11px] text-tertiary">Of cash fare</span>
        </div>
      </div>

      {/* Full Trip Preferences Card */}
      {trip.mode === "full" ? (
        <div className="mt-6 rounded-xl border border-line bg-sheet p-5 shadow-subtle">
          <h2 className={sectionTitleClass}>Recorded Trip Preferences</h2>
          <span className="text-xs text-muted block mt-0.5">
            Logged with your itinerary (does not alter monetary calculations)
          </span>
          <ul className="mt-3 space-y-1.5 text-xs text-muted">
            {preferenceLines(trip).map((line) => (
              <li key={line} className="flex items-center gap-2">
                <span className="size-1 rounded-full bg-ink" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Ruled Comparison Ledger */}
      <div className="mt-6 overflow-hidden rounded-xl border border-line bg-sheet shadow-subtle">
        <div className="border-b border-line bg-subtle px-5 py-3">
          <h2 className="text-sm font-bold text-ink">Side-by-Side Financial Ledger</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm tabular-nums">
            <caption className="sr-only">
              Comparison of the cash fare and the points redemption
            </caption>
            <thead>
              <tr className="border-b border-line bg-paper/60 text-xs font-bold uppercase tracking-wider text-muted">
                <th scope="col" className="py-3 px-5">Financial Item</th>
                <th scope="col" className="py-3 px-5 text-right">Cash Ticket</th>
                <th scope="col" className="py-3 px-5 text-right">Points Redemption</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <tr>
                <th scope="row" className="py-3.5 px-5 font-medium text-ink">
                  Cash Out-of-Pocket
                </th>
                <td className="py-3.5 px-5 text-right font-semibold text-ink whitespace-nowrap">
                  {formatEurFromCents(comparison.cashPriceCents)}
                </td>
                <td className="py-3.5 px-5 text-right font-semibold text-ink whitespace-nowrap">
                  <span>{formatEurFromCents(comparison.taxesAndFeesCents)}</span>
                  <span className="block text-xs font-normal text-muted">Taxes & fees</span>
                </td>
              </tr>

              <tr>
                <th scope="row" className="py-3.5 px-5 font-medium text-ink">
                  Points Spent
                </th>
                <td className="py-3.5 px-5 text-right text-muted">None (0 pts)</td>
                <td className="py-3.5 px-5 text-right font-semibold text-ink whitespace-nowrap">
                  {formatPoints(comparison.pointsRequired)}
                </td>
              </tr>

              <tr className="bg-subtle/30 font-semibold">
                <th scope="row" className="py-3.5 px-5 text-ink">
                  Net Cash Difference
                </th>
                <td colSpan={2} className={`py-3.5 px-5 text-right font-bold text-base whitespace-nowrap ${figureTone}`}>
                  {formatEurFromCents(comparison.netSavingsCents)}
                  <span className="block text-xs font-normal text-ink">
                    {costly
                      ? "Costs more cash than published ticket"
                      : comparison.outcome === "even"
                        ? "Exact same cash due"
                        : "Net euros saved"}
                  </span>
                </td>
              </tr>

              <tr>
                <th scope="row" className="py-3.5 px-5 font-medium text-ink">
                  Realized Value per Point
                </th>
                <td colSpan={2} className="py-3.5 px-5 text-right font-bold text-ink whitespace-nowrap">
                  {formatPerPoint(comparison.valuePerPointEur)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {notes.length > 0 ? (
        <div className="mt-5 rounded-lg border border-line bg-sheet p-4">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">Evaluation Notes</span>
          <ul className="mt-2 space-y-1 text-xs text-ink">
            {notes.map((note) => (
              <li key={note} className="flex items-start gap-2">
                <span>•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Primary Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
        <button type="button" className={`${primaryButtonClass} min-h-[50px] px-7 shadow-card`} onClick={onGuidance}>
          See what to do before booking
          <span aria-hidden="true">➔</span>
        </button>
        <button type="button" className={secondaryButtonClass} onClick={onBack}>
          Edit the trip
        </button>
      </div>

      {/* How this estimate is made Section */}
      <section className="mt-12 border-t border-line pt-8">
        <h2 className={sectionTitleClass}>How this estimate is calculated</h2>
        <ul className="mt-4 grid gap-2.5 text-xs text-muted">
          {SAVINGS_ASSUMPTIONS.map((assumption) => (
            <li key={assumption} className="rounded-lg border border-line bg-sheet p-3">
              {assumption}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
