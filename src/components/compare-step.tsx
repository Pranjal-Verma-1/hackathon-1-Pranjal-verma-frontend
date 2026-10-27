import Link from "next/link";
import { useId, useState, useSyncExternalStore, type RefObject } from "react";
import {
  API_RESULT_NOTES,
  comparisonBadge,
  comparisonDifferenceNote,
  comparisonFigureLabel,
  comparisonHeading,
  formatApiEuros,
  formatApiPercent,
  formatApiPoints,
  type ComparisonResult,
} from "@/lib/comparison-api";
import { subscribeWalletCloud, walletCloudServerSnapshot, walletCloudSnapshot } from "@/lib/cloud-browser";
import { resultBalanceComparison } from "@/lib/explorer";
import { formatSavedAt } from "@/lib/local-records";
import { loyaltyPrograms } from "@/lib/loyalty";
import { preferenceLines, routeSummary, type ValidatedTrip } from "@/lib/trip";
import { usesExampleFigures } from "@/lib/validation";
import { controlClass, headingClass, primaryButtonClass, secondaryButtonClass, sectionTitleClass } from "./field";

export type ComparePhase =
  | { name: "calculating" }
  | { name: "ready"; trip: ValidatedTrip; result: ComparisonResult; savedAt?: string }
  | { name: "unavailable"; trip: ValidatedTrip; message: string }
  | { name: "empty" };

export function CompareStep({
  phase,
  headingRef,
  onBack,
  onRetry,
  onSave,
  saveNotice,
  saveError = "",
  saving = false,
  onGuidance,
}: {
  phase: ComparePhase;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onBack: () => void;
  onRetry: () => void;
  onSave: () => void;
  saveNotice: string;
  saveError?: string;
  saving?: boolean;
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
          Asking the comparison service about the figures you entered. No airline is being contacted,
          and nothing is being booked.
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

  if (phase.name === "unavailable") {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-xl border border-cost-border bg-cost-bg p-6">
          <h1 ref={headingRef} tabIndex={-1} className="text-xl font-bold text-cost">
            The comparison could not be reached
          </h1>
          <p role="alert" className="mt-4 text-sm font-medium text-cost">
            {phase.message}
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button type="button" className={primaryButtonClass} onClick={onRetry}>
            Try the comparison again
          </button>
          <button type="button" className={secondaryButtonClass} onClick={onBack}>
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

  const { trip, result } = phase;
  const percent = formatApiPercent(result.estimatedSavingsPercent);
  const negative = result.estimatedSavingsEuros < 0;
  const positive = result.estimatedSavingsEuros > 0;
  const worthwhile = result.appearsWorthwhile && positive;

  const badgeClass = worthwhile
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : negative
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-stone-200 bg-stone-100 text-stone-800";

  const figureTone = worthwhile ? "text-save" : negative ? "text-cost" : "text-ink";

  const heroCardBorder = worthwhile
    ? "border-emerald-200 bg-gradient-to-b from-white to-emerald-50/30"
    : negative
      ? "border-red-200 bg-gradient-to-b from-white to-red-50/40"
      : "border-line bg-sheet";

  return (
    <div className="mx-auto max-w-3xl">
      {/* Route breadcrumb badge */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-sheet px-3 py-1 text-xs font-semibold text-muted shadow-subtle">
          <span className="size-1.5 rounded-full bg-marker" />
          <span>
            {phase.savedAt
              ? `${result.origin} to ${result.destination}. Saved ${formatSavedAt(phase.savedAt)}.`
              : routeSummary(trip)}
          </span>
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
            {comparisonBadge(result)}
          </span>

          <span className="text-xs font-semibold text-tertiary">
            Direct Financial Comparison
          </span>
        </div>

        <h1 ref={headingRef} tabIndex={-1} className="display text-2xl sm:text-3xl font-bold tracking-tight text-ink outline-none mt-4">
          {comparisonHeading(result)}
        </h1>

        {/* Primary Savings Display */}
        <div className="mt-5 border-t border-b border-line/80 py-5">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">
            {comparisonFigureLabel(result)}
          </span>
          <div className="mt-1 flex items-baseline gap-3">
            <span className={`font-sans text-4xl sm:text-6xl font-bold tracking-tight tabular-nums ${figureTone}`}>
              {formatApiEuros(result.estimatedSavingsEuros)}
            </span>
            {percent ? <span className={`text-base font-bold ${figureTone}`}>{percent}</span> : null}
          </div>
          <p className="mt-2 text-base font-medium text-ink">{result.explanation}</p>
        </div>

        {usesExampleFigures(trip) ? (
          <div className="mt-4 rounded-lg border border-marker/30 bg-marker/10 p-3 text-xs text-ink">
            <strong>Illustrative example figures:</strong> These amounts match the built-in Madrid to Barcelona sample. They are not a live quote or an available award seat.
          </div>
        ) : (
          <p className="mt-4 text-xs text-muted">
            Returned by the comparison service from the figures you entered. Not a live fare, an award
            seat, or a booking.
          </p>
        )}
      </div>

      {/* 4-Metric Grid Strip (DeskDrop Metric Strip pattern) */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-line bg-sheet p-4 shadow-subtle">
          <span className="text-xs font-semibold text-muted">Points required</span>
          <div className="mt-1.5 text-lg sm:text-xl font-bold tracking-tight tabular-nums text-ink">
            {formatApiPoints(result.pointsRequired)}
          </div>
          <span className="text-[11px] text-tertiary">Total points</span>
        </div>

        <div className="rounded-xl border border-line bg-sheet p-4 shadow-subtle">
          <span className="text-xs font-semibold text-muted">Taxes & fees</span>
          <div className="mt-1.5 text-lg sm:text-xl font-bold tracking-tight tabular-nums text-ink">
            {formatApiEuros(result.redemptionTaxesFeesEuros)}
          </div>
          <span className="text-[11px] text-tertiary">Cash due on award</span>
        </div>

        <div className="rounded-xl border border-line bg-sheet p-4 shadow-subtle">
          <span className="text-xs font-semibold text-muted">Worth trying</span>
          <div className="mt-1.5 text-lg sm:text-xl font-bold tracking-tight text-ink">
            {result.appearsWorthwhile ? "Yes" : "No"}
          </div>
          <span className="text-[11px] text-tertiary">On these numbers</span>
        </div>

        <div className="rounded-xl border border-line bg-sheet p-4 shadow-subtle">
          <span className="text-xs font-semibold text-muted">Savings rate</span>
          <div className={`mt-1.5 text-lg sm:text-xl font-bold tracking-tight tabular-nums ${figureTone}`}>
            {percent ?? "Not available"}
          </div>
          <span className="text-[11px] text-tertiary">Of cash fare</span>
        </div>
      </div>

      <WalletBalanceComparison pointsRequired={result.pointsRequired} />

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
                  {formatApiEuros(result.cashFareEuros)}
                </td>
                <td className="py-3.5 px-5 text-right font-semibold text-ink whitespace-nowrap">
                  <span>{formatApiEuros(result.redemptionTaxesFeesEuros)}</span>
                  <span className="block text-xs font-normal text-muted">Taxes & fees</span>
                </td>
              </tr>

              <tr>
                <th scope="row" className="py-3.5 px-5 font-medium text-ink">
                  Points Spent
                </th>
                <td className="py-3.5 px-5 text-right text-muted">None (0 pts)</td>
                <td className="py-3.5 px-5 text-right font-semibold text-ink whitespace-nowrap">
                  {formatApiPoints(result.pointsRequired)}
                </td>
              </tr>

              <tr className="bg-subtle/30 font-semibold">
                <th scope="row" className="py-3.5 px-5 text-ink">
                  Net Cash Difference
                </th>
                <td colSpan={2} className={`py-3.5 px-5 text-right font-bold text-base whitespace-nowrap ${figureTone}`}>
                  {formatApiEuros(result.estimatedSavingsEuros)}
                  <span className="block text-xs font-normal text-ink">{comparisonDifferenceNote(result)}</span>
                </td>
              </tr>

              <tr>
                <th scope="row" className="py-3.5 px-5 font-medium text-ink">
                  Worth trying
                </th>
                <td colSpan={2} className="py-3.5 px-5 text-right font-bold text-ink whitespace-nowrap">
                  {comparisonBadge(result)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {percent === null ? (
        <div className="mt-5 rounded-lg border border-line bg-sheet p-4">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">Evaluation Notes</span>
          <p className="mt-2 text-xs text-ink">
            A savings percentage is not shown because the comparison did not return one.
          </p>
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
        {phase.savedAt ? null : (
          <button type="button" className={secondaryButtonClass} onClick={onSave} disabled={saving}>
            {saving ? "Saving" : "Save this comparison"}
          </button>
        )}
      </div>
      {saveError ? (
        <p className="mt-3 text-sm font-medium text-cost" role="alert">
          {saveError}
        </p>
      ) : null}
      {saveNotice ? (
        <p className="mt-3 text-sm text-ink" role="status">
          {saveNotice}
        </p>
      ) : null}

      {/* How this estimate is made Section */}
      <section className="mt-12 border-t border-line pt-8">
        <h2 className={sectionTitleClass}>How this estimate is calculated</h2>
        <ul className="mt-4 grid gap-2.5 text-xs text-muted">
          {API_RESULT_NOTES.map((assumption) => (
            <li key={assumption} className="rounded-lg border border-line bg-sheet p-3">
              {assumption}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function WalletBalanceComparison({ pointsRequired }: { pointsRequired: number }) {
  const programIdField = useId();
  const wallet = useSyncExternalStore(subscribeWalletCloud, walletCloudSnapshot, walletCloudServerSnapshot);
  const [programId, setProgramId] = useState("");
  const comparison = resultBalanceComparison(programId, pointsRequired, wallet);

  return (
    <section className="mt-6 rounded-xl border border-line bg-sheet p-5 shadow-subtle" aria-labelledby="wallet-balance-title">
      <h2 id="wallet-balance-title" className={sectionTitleClass}>
        Wallet balance
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Optional. Choose one program to compare its stored balance with the points in this result.
      </p>
      <label htmlFor={programIdField} className="mt-4 block text-sm font-semibold text-ink">
        Loyalty program
      </label>
      <select
        id={programIdField}
        className={`${controlClass} mt-1.5`}
        value={programId}
        onChange={(event) => setProgramId(event.target.value)}
      >
        <option value="">No program selected</option>
        {loyaltyPrograms.map((program) => (
          <option key={program.id} value={program.id}>
            {program.name}
          </option>
        ))}
      </select>

      {comparison.status === "undetermined" ? <p className="mt-3 text-sm leading-relaxed text-muted">{comparison.message}</p> : null}
      {comparison.status === "loading" ? (
        <p className="mt-3 text-sm text-muted" role="status">
          Loading the wallet balance.
        </p>
      ) : null}
      {comparison.status === "signed-out" ? (
        <p className="mt-3 text-sm text-ink" role="status">
          {comparison.message}{" "}
          <Link href="/account" className="font-semibold underline">
            Sign in
          </Link>
        </p>
      ) : null}
      {comparison.status === "unavailable" ? (
        <p className="mt-3 text-sm font-medium text-cost" role="alert">
          {comparison.message}
        </p>
      ) : null}
      {comparison.status === "ready" ? (
        <div className="mt-3 text-sm leading-relaxed text-ink">
          <p className="font-semibold">{comparison.programName}</p>
          <p className="mt-1">
            Wallet balance: {formatApiPoints(comparison.balance)} {comparison.unit}
          </p>
          <p>Points required: {formatApiPoints(comparison.pointsRequired)}</p>
          <p className="mt-1">
            {comparison.shortfall === null
              ? "The wallet balance covers the entered points requirement."
              : `${formatApiPoints(comparison.shortfall)} more ${comparison.unit} would be needed.`}
          </p>
          <p className="mt-2 text-xs text-muted">{comparison.note}</p>
        </div>
      ) : null}
    </section>
  );
}
