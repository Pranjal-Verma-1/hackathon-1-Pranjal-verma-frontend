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
import { ArrowIcon } from "./mile-mark";

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
      <div role="status" aria-live="polite" aria-busy="true" className="mx-auto max-w-3xl py-8">
        <h1 ref={headingRef} tabIndex={-1} className={headingClass}>
          Estimating your comparison
        </h1>
        <p className="mt-3 text-base text-muted max-w-md mx-auto">
          Asking the comparison service about the figures you entered. No airline is being contacted,
          and nothing is being booked.
        </p>
        <div className="mt-8 h-1 max-w-md overflow-hidden rounded-full bg-line" aria-hidden="true">
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
    ? "bg-save-bg text-save"
    : negative
      ? "bg-cost-bg text-cost"
      : "bg-subtle text-ink";

  const figureTone = worthwhile ? "text-save" : negative ? "text-cost" : "text-ink";

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm text-muted">
        {phase.savedAt
          ? `${result.origin} to ${result.destination}. Saved ${formatSavedAt(phase.savedAt)}.`
          : routeSummary(trip)}
      </p>

      <div className="mt-4 border-t border-line pt-6">
        <h1 ref={headingRef} tabIndex={-1} className={`${headingClass} mt-0`}>
          {comparisonHeading(result)}
        </h1>
        <p className={`mt-3 inline-flex rounded-sm px-2 py-1 text-sm font-semibold ${badgeClass}`}>{comparisonBadge(result)}</p>

        <p className="mt-6 text-sm font-semibold text-muted">{comparisonFigureLabel(result)}</p>
        <p className={`mt-1 font-sans text-5xl font-semibold tracking-[-0.025em] tabular-nums sm:text-6xl ${figureTone}`}>
          {formatApiEuros(result.estimatedSavingsEuros)}
        </p>
        <p className={`mt-2 text-lg font-semibold tabular-nums ${percent ? figureTone : "text-muted"}`}>
          {percent ?? "Percentage not available"}
        </p>
        <p className="mt-4 max-w-2xl text-base leading-7 text-ink">{result.explanation}</p>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Points are treated as already earned and do not receive a euro price.
        </p>

        {usesExampleFigures(trip) ? (
          <p className="mt-4 max-w-2xl rounded-lg border border-line bg-sheet p-3 text-sm leading-6 text-ink">
            <strong className="font-semibold">Illustrative example figures.</strong> These amounts match the built-in Madrid to Barcelona sample. They are not a live quote or an available award seat.
          </p>
        ) : (
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
            Returned by the comparison service from the figures you entered. Not a live fare, an award seat, or a booking.
          </p>
        )}
      </div>

      <dl className="mt-8 grid border-y border-line sm:grid-cols-3">
        <div className="border-b border-line py-4 sm:border-b-0 sm:border-r sm:pr-4">
          <dt className="text-sm text-muted">Cash fare</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums text-ink">{formatApiEuros(result.cashFareEuros)}</dd>
        </div>
        <div className="border-b border-line py-4 sm:border-r sm:border-b-0 sm:px-4">
          <dt className="text-sm text-muted">Redemption taxes and fees</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums text-ink">{formatApiEuros(result.redemptionTaxesFeesEuros)}</dd>
        </div>
        <div className="py-4 sm:pl-4">
          <dt className="text-sm text-muted">Points required</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums text-ink">{formatApiPoints(result.pointsRequired)}</dd>
        </div>
      </dl>

      <WalletBalanceComparison pointsRequired={result.pointsRequired} />

      {/* Full Trip Preferences Card */}
      {trip.mode === "full" ? (
        <div className="mt-8 border-t border-line pt-6">
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
      <div className="mt-8 border-t border-line pt-6">
        <h2 className={sectionTitleClass}>Cash fare beside the redemption</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm tabular-nums">
            <caption className="sr-only">
              Comparison of the cash fare and the points redemption
            </caption>
            <thead>
              <tr className="border-b border-ink text-sm text-muted">
                <th scope="col" className="py-3 pr-4 font-semibold">Item</th>
                <th scope="col" className="py-3 pr-4 text-right font-semibold">Cash fare</th>
                <th scope="col" className="py-3 text-right font-semibold">Points redemption</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <tr>
                <th scope="row" className="py-3.5 pr-4 font-medium text-ink">
                  Cash Out-of-Pocket
                </th>
                <td className="py-3.5 pr-4 text-right font-semibold text-ink whitespace-nowrap">
                  {formatApiEuros(result.cashFareEuros)}
                </td>
                <td className="py-3.5 text-right font-semibold text-ink whitespace-nowrap">
                  <span>{formatApiEuros(result.redemptionTaxesFeesEuros)}</span>
                  <span className="block text-xs font-normal text-muted">Taxes & fees</span>
                </td>
              </tr>

              <tr>
                <th scope="row" className="py-3.5 pr-4 font-medium text-ink">
                  Points Spent
                </th>
                <td className="py-3.5 pr-4 text-right text-muted">None</td>
                <td className="py-3.5 text-right font-semibold text-ink whitespace-nowrap">
                  {formatApiPoints(result.pointsRequired)}
                </td>
              </tr>

              <tr className="bg-subtle/30 font-semibold">
                <th scope="row" className="py-3.5 pr-4 text-ink">
                  Euro difference
                </th>
                <td colSpan={2} className={`py-3.5 text-right font-semibold whitespace-nowrap ${figureTone}`}>
                  {formatApiEuros(result.estimatedSavingsEuros)}
                  <span className="block text-xs font-normal text-ink">{comparisonDifferenceNote(result)}</span>
                </td>
              </tr>

              <tr>
                <th scope="row" className="py-3.5 pr-4 font-medium text-ink">
                  Worth trying
                </th>
                <td colSpan={2} className="py-3.5 text-right font-semibold text-ink whitespace-nowrap">
                  {comparisonBadge(result)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {percent === null ? (
        <p className="mt-5 max-w-2xl text-sm leading-6 text-muted">
          A savings percentage is not shown because the comparison did not return one.
        </p>
      ) : null}

      {/* Primary Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
        <button type="button" className={primaryButtonClass} onClick={onGuidance}>
          See what to do before booking
          <ArrowIcon />
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
        <ul className="mt-4 max-w-2xl list-disc space-y-2 pl-5 text-sm leading-6 text-muted">
          {API_RESULT_NOTES.map((assumption) => (
            <li key={assumption}>{assumption}</li>
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
    <section className="mt-8 border-t border-line pt-6" aria-labelledby="wallet-balance-title">
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
        <div className="mt-4 border-t border-line pt-4 text-sm leading-6 text-ink">
          <p className="font-serif text-xl font-semibold tracking-[-0.03em]">{comparison.programName}</p>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-muted">Wallet balance</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums">
                {formatApiPoints(comparison.balance)} {comparison.unit}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Points required</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums">{formatApiPoints(comparison.pointsRequired)}</dd>
            </div>
          </dl>
          <p className="mt-3 font-semibold">
            {comparison.shortfall === null
              ? "The wallet balance covers the entered points requirement."
              : `${formatApiPoints(comparison.shortfall)} more ${comparison.unit} would be needed.`}
          </p>
          <p className="mt-2 text-muted">{comparison.note}</p>
        </div>
      ) : null}
    </section>
  );
}
