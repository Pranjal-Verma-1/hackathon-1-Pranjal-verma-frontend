"use client";

import Link from "next/link";
import { useId, useState, useSyncExternalStore } from "react";
import {
  savedCloudServerSnapshot,
  savedCloudSnapshot,
  subscribeSavedCloud,
  walletCloudServerSnapshot,
  walletCloudSnapshot,
  subscribeWalletCloud,
} from "@/lib/cloud-browser";
import { formatApiEuros, formatApiPercent } from "@/lib/comparison-api";
import {
  barWidthPercent,
  chartScale,
  comparisonsToCsv,
  explorerAccountState,
  explorerMetrics,
  fareChartRows,
  filterComparisons,
  pointsReadiness,
  pointsReadinessText,
  summaryHtmlDocument,
  tripSummaryText,
  type SavingsSort,
} from "@/lib/explorer";
import { formatSavedAt, type SavedComparison } from "@/lib/local-records";
import { controlClass, headingClass, secondaryButtonClass } from "./field";

export function ExplorerScreen() {
  const originId = useId();
  const destinationId = useId();
  const sortId = useId();
  const saved = useSyncExternalStore(subscribeSavedCloud, savedCloudSnapshot, savedCloudServerSnapshot);
  const wallet = useSyncExternalStore(subscribeWalletCloud, walletCloudSnapshot, walletCloudServerSnapshot);
  const account = explorerAccountState(saved, wallet);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [sort, setSort] = useState<SavingsSort>("savings-desc");
  const [copyNotice, setCopyNotice] = useState("");
  const [exportError, setExportError] = useState("");

  const rows = account.status === "ready" ? filterComparisons(account.records, { origin, destination, sort }) : [];
  const metrics = explorerMetrics(rows);
  const chart = fareChartRows(rows);
  const scale = chartScale(chart);
  const average = formatApiPercent(metrics.averageSavingsPercent);

  async function onCopy(record: SavedComparison) {
    setExportError("");
    setCopyNotice("");
    try {
      await navigator.clipboard.writeText(tripSummaryText(record));
      setCopyNotice(`Summary copied for ${record.result.origin} to ${record.result.destination}.`);
    } catch {
      setExportError("The summary could not be copied.");
    }
  }

  function onCsv() {
    setExportError("");
    const csv = comparisonsToCsv(rows);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "a-una-milla-comparisons.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function onPrint() {
    setExportError("");
    const popup = window.open("", "_blank", "noopener,noreferrer");
    if (!popup) {
      setExportError("The print summary could not be opened.");
      return;
    }
    popup.document.open();
    popup.document.write(summaryHtmlDocument(rows));
    popup.document.close();
    popup.focus();
    popup.print();
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className={headingClass}>Trip explorer</h1>
      <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted">
        These figures are estimates from comparisons you saved. Each one uses the cash fare, points, and taxes entered at the time. They are not live fares, award seats, or bookings.
      </p>

      {account.status === "loading" ? (
        <p className="mt-8 text-sm text-muted" role="status">
          Loading saved comparisons for this account.
        </p>
      ) : null}

      {account.status === "signed-out" ? (
        <p className="mt-8 rounded-lg border border-line bg-sheet p-4 text-sm text-ink" role="status">
          {account.message}{" "}
          <Link href="/account" className="font-semibold underline">
            Sign in
          </Link>
        </p>
      ) : null}

      {account.status === "unavailable" ? (
        <p className="mt-8 rounded-lg border border-cost-border bg-cost-bg p-4 text-sm font-medium text-cost" role="alert">
          {account.message}
        </p>
      ) : null}

      {account.status === "ready" && account.records.length === 0 ? (
        <div className="mt-8 rounded-xl border border-line bg-sheet p-5 shadow-subtle">
          <h2 className="text-base font-bold text-ink">No saved comparisons yet</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Save a comparison after you compare a trip. The explorer will total those saved estimates here.
          </p>
          <Link href="/" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-ink underline">
            Compare a trip
          </Link>
        </div>
      ) : null}

      {account.status === "ready" && account.records.length > 0 ? (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor={originId} className="block text-sm font-semibold text-ink">
                Origin
              </label>
              <input
                id={originId}
                value={origin}
                onChange={(event) => setOrigin(event.target.value)}
                className={`${controlClass} mt-1.5`}
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor={destinationId} className="block text-sm font-semibold text-ink">
                Destination
              </label>
              <input
                id={destinationId}
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                className={`${controlClass} mt-1.5`}
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor={sortId} className="block text-sm font-semibold text-ink">
                Sort by estimated savings
              </label>
              <select
                id={sortId}
                value={sort}
                onChange={(event) => setSort(event.target.value === "savings-asc" ? "savings-asc" : "savings-desc")}
                className={`${controlClass} mt-1.5`}
              >
                <option value="savings-desc">Highest estimated savings</option>
                <option value="savings-asc">Lowest estimated savings</option>
              </select>
            </div>
          </div>

          {exportError ? (
            <p className="mt-4 text-sm font-medium text-cost" role="alert">
              {exportError}
            </p>
          ) : null}
          {copyNotice ? (
            <p className="mt-4 text-sm text-ink" role="status">
              {copyNotice}
            </p>
          ) : null}

          {rows.length === 0 ? (
            <p className="mt-8 text-sm text-muted" role="status">
              No saved comparisons match this route.
            </p>
          ) : (
            <>
              <section className="mt-8 grid border-y border-line sm:grid-cols-2 lg:grid-cols-4" aria-label="Estimate totals">
                <Metric label="Saved comparisons" value={String(metrics.count)} note="Each saved comparison is counted once." />
                <Metric
                  label="Total estimated difference"
                  value={formatApiEuros(metrics.totalEstimatedSavingsEuros)}
                  note="Sum of the saved euro differences, including extra cash due."
                />
                <Metric
                  label="Best estimated difference"
                  value={metrics.best ? `${metrics.best.result.origin} to ${metrics.best.result.destination}` : "None"}
                  note={metrics.best ? formatApiEuros(metrics.best.result.estimatedSavingsEuros) : "No saved comparison is shown."}
                />
                <Metric
                  label="Average savings percentage"
                  value={average ?? "Not available"}
                  note={
                    metrics.definedPercentCount === 0
                      ? "None of the shown comparisons included a percentage."
                      : `From ${metrics.definedPercentCount} shown ${metrics.definedPercentCount === 1 ? "comparison" : "comparisons"} with a percentage.`
                  }
                />
              </section>

              <section className="mt-8 rounded-xl border border-line bg-sheet p-5 shadow-subtle" aria-labelledby="fare-chart-title">
                <h2 id="fare-chart-title" className="text-base font-bold text-ink">
                  Cash fare and redemption taxes
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Each pair uses the cash fare and the redemption taxes and fees saved with that comparison. The bars do not price points and are not live fares.
                </p>
                <ul className="mt-5 grid gap-5">
                  {chart.map((row) => (
                    <li key={row.id}>
                      <p className="text-sm font-semibold text-ink">{row.route}</p>
                      <Bar label="Cash fare" amount={formatApiEuros(row.cashFareEuros)} width={barWidthPercent(row.cashFareEuros, scale)} tone="ink" />
                      <Bar
                        label="Redemption taxes and fees"
                        amount={formatApiEuros(row.redemptionTaxesFeesEuros)}
                        width={barWidthPercent(row.redemptionTaxesFeesEuros, scale)}
                        tone="marker"
                      />
                    </li>
                  ))}
                </ul>
              </section>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button type="button" className={secondaryButtonClass} onClick={onCsv}>
                  Download CSV
                </button>
                <button type="button" className={secondaryButtonClass} onClick={onPrint}>
                  Print summary
                </button>
              </div>

              <ul className="mt-6 grid gap-4">
                {rows.map((record) => {
                  const percent = formatApiPercent(record.result.estimatedSavingsPercent);
                  const readiness = pointsReadinessText(pointsReadiness(record, account.balances));
                  return (
                    <li key={record.id} className="rounded-xl border border-line bg-sheet p-5 shadow-subtle">
                      <p className="text-sm text-muted">Saved {formatSavedAt(record.savedAt)}</p>
                      <h2 className="mt-2 text-xl font-bold text-ink">
                        {record.result.origin} to {record.result.destination}
                      </h2>
                      <p
                        className={`mt-3 text-3xl font-semibold tabular-nums ${
                          record.result.appearsWorthwhile && record.result.estimatedSavingsEuros > 0
                            ? "text-save"
                            : record.result.estimatedSavingsEuros < 0
                              ? "text-cost"
                              : "text-ink"
                        }`}
                      >
                        {formatApiEuros(record.result.estimatedSavingsEuros)}
                        {percent ? <span className="ml-2 text-base">{percent}</span> : <span className="ml-2 text-base text-muted">Percentage unavailable</span>}
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-ink">{record.result.explanation}</p>
                      <p className="mt-3 text-sm leading-relaxed text-muted">{readiness}</p>
                      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                        <button type="button" className={secondaryButtonClass} onClick={() => void onCopy(record)}>
                          Copy summary
                        </button>
                        <Link href={`/?saved=${encodeURIComponent(record.id)}`} className="inline-flex min-h-12 items-center text-sm font-semibold text-ink underline">
                          Open this comparison
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </>
      ) : null}
    </div>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <article className="border-b border-line py-4 lg:border-b-0 lg:border-r lg:pr-4 lg:last:border-r-0">
      <h3 className="text-sm text-muted">{label}</h3>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-ink">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{note}</p>
    </article>
  );
}

function Bar({ label, amount, width, tone }: { label: string; amount: string; width: number; tone: "ink" | "marker" }) {
  return (
    <div className="mt-2">
      <div className="flex items-baseline justify-between gap-3 text-xs text-muted">
        <span>{label}</span>
        <span className="font-semibold text-ink">{amount}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-subtle" aria-hidden="true">
        <div className={`h-2 rounded-full ${tone === "ink" ? "bg-ink" : "bg-marker"}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
