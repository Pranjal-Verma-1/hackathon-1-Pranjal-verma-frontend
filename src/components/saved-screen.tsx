"use client";

import { useState, useSyncExternalStore } from "react";
import { reloadSavedCloud, removeBrowserComparison, savedCloudServerSnapshot, savedCloudSnapshot, subscribeSavedCloud } from "@/lib/cloud-browser";
import { CloudRecordsError } from "@/lib/cloud-records";
import { comparisonBadge, comparisonFigureLabel, formatApiEuros, formatApiPercent } from "@/lib/comparison-api";
import { formatSavedAt } from "@/lib/local-records";
import { headingClass, secondaryButtonClass } from "./field";

export function SavedScreen() {
  const stored = useSyncExternalStore(subscribeSavedCloud, savedCloudSnapshot, savedCloudServerSnapshot);
  const { status, records, message } = stored;
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState("");

  async function onDelete(id: string) {
    setPendingId(id);
    setNotice("");
    setError("");
    try {
      await removeBrowserComparison(id);
      await reloadSavedCloud();
      setNotice("Comparison removed from this account.");
    } catch (caught) {
      setError(caught instanceof CloudRecordsError ? caught.message : "The comparison could not be removed.");
    } finally {
      setPendingId("");
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">Your account</p>
      <h1 className={`${headingClass} mt-3`}>Saved comparisons</h1>
      <p className="mt-4 text-base leading-relaxed text-muted">
        Each card is the comparison response saved at the time, including its timestamp. Opening one shows that response again. It is not calculated a second time. Copies already in this browser are left as they are.
      </p>

      {status === "loading" ? (
        <p className="mt-8 text-sm text-muted" role="status">
          Loading comparisons saved with this account.
        </p>
      ) : null}

      {status === "signed-out" ? (
        <p className="mt-8 rounded-lg border border-line bg-sheet p-4 text-sm text-ink" role="status">
          {message} <a href="/account" className="font-semibold underline">Sign in</a>
        </p>
      ) : null}

      {status === "unavailable" ? (
        <p className="mt-8 rounded-lg border border-cost-border bg-cost-bg p-4 text-sm font-medium text-cost" role="alert">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 text-sm font-medium text-cost" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="mt-4 text-sm text-ink" role="status">
          {notice}
        </p>
      ) : null}

      {status === "ready" && records.length === 0 ? (
        <p className="mt-8 text-sm text-muted">No comparisons saved with this account.</p>
      ) : null}

      {status === "ready" ? (
        <ul className="mt-6 grid gap-4">
          {records.map((record) => {
            const percent = formatApiPercent(record.result.estimatedSavingsPercent);
            return (
              <li key={record.id} className="rounded-xl border border-line bg-sheet p-5 shadow-subtle">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">Saved {formatSavedAt(record.savedAt)}</p>
                <h2 className="mt-2 text-xl font-bold text-ink">
                  {record.result.origin} to {record.result.destination}
                </h2>
                <p className="mt-3 text-sm font-semibold text-ink">{comparisonBadge(record.result)}</p>
                <p className="mt-2 text-sm text-muted">{comparisonFigureLabel(record.result)}</p>
                <p className="mt-1 text-2xl font-bold text-ink">
                  {formatApiEuros(record.result.estimatedSavingsEuros)}
                  {percent ? <span className="ml-2 text-base">{percent}</span> : null}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-ink">{record.result.explanation}</p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={`/?saved=${encodeURIComponent(record.id)}`}
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-ink px-6 text-sm font-semibold text-white sm:w-auto"
                  >
                    Open this comparison
                  </a>
                  <button type="button" className={secondaryButtonClass} onClick={() => void onDelete(record.id)} disabled={pendingId === record.id}>
                    Delete this comparison
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
