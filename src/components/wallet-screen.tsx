"use client";

import { useId, useState, useSyncExternalStore, type FormEvent } from "react";
import {
  addBrowserSampleBalances,
  reloadWalletCloud,
  removeBrowserBalance,
  saveBrowserBalance,
  subscribeWalletCloud,
  walletCloudServerSnapshot,
  walletCloudSnapshot,
} from "@/lib/cloud-browser";
import { CloudRecordsError } from "@/lib/cloud-records";
import { loyaltyPrograms, sampleBalances } from "@/lib/loyalty";
import { formatPoints } from "@/lib/money";
import { controlClass, headingClass, primaryButtonClass, secondaryButtonClass, sectionTitleClass } from "./field";

function cloudMessage(error: unknown, fallback: string) {
  return error instanceof CloudRecordsError ? error.message : fallback;
}

export function WalletScreen() {
  const programFieldId = useId();
  const balanceFieldId = useId();
  const stored = useSyncExternalStore(subscribeWalletCloud, walletCloudSnapshot, walletCloudServerSnapshot);
  const { status, entries, message } = stored;
  const [programId, setProgramId] = useState(loyaltyPrograms[0]?.id ?? "");
  const [balanceText, setBalanceText] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    const balance = Number(balanceText.trim());
    setSubmitting(true);
    setNotice("");
    setError("");
    try {
      await saveBrowserBalance(programId, balance);
      await reloadWalletCloud();
      setBalanceText("");
      setNotice("Balance saved with this account.");
    } catch (caught) {
      setError(cloudMessage(caught, "The balance could not be saved."));
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(id: string) {
    setSubmitting(true);
    setNotice("");
    setError("");
    try {
      await removeBrowserBalance(id);
      await reloadWalletCloud();
      setNotice("Balance removed from this account.");
    } catch (caught) {
      setError(cloudMessage(caught, "The balance could not be removed."));
    } finally {
      setSubmitting(false);
    }
  }

  async function onSample() {
    const present = new Set(entries.map((entry) => entry.programId));
    if (sampleBalances().every((sample) => present.has(sample.programId))) {
      setError("");
      setNotice("The sample balances are already in this wallet.");
      return;
    }
    setSubmitting(true);
    setNotice("");
    setError("");
    try {
      await addBrowserSampleBalances();
      await reloadWalletCloud();
      setNotice("Sample balances were added. They are not your real balances.");
    } catch (caught) {
      setError(cloudMessage(caught, "The sample balances could not be added."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className={headingClass}>Miles wallet</h1>
      <p className="mt-4 text-base leading-relaxed text-muted">
        Balances are stored with the signed-in account. They are not sent with a comparison, and they are not treated as transferable or enough for a redemption. Copies already in this browser are left as they are.
      </p>

      {status === "loading" ? (
        <p className="mt-8 text-sm text-muted" role="status">
          Loading balances for this account.
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

      {status === "ready" ? (
        <>
          <form className="mt-8 rounded-xl border border-line bg-sheet p-5 shadow-subtle" onSubmit={onSave} aria-busy={submitting}>
            <h2 className={sectionTitleClass}>Add or edit a balance</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
              <div>
                <label htmlFor={programFieldId} className="block text-sm font-semibold text-ink">
                  Program
                </label>
                <select
                  id={programFieldId}
                  className={`${controlClass} mt-1.5`}
                  value={programId}
                  onChange={(event) => setProgramId(event.target.value)}
                >
                  {loyaltyPrograms.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor={balanceFieldId} className="block text-sm font-semibold text-ink">
                  Balance
                </label>
                <input
                  id={balanceFieldId}
                  inputMode="numeric"
                  className={`${controlClass} mt-1.5`}
                  value={balanceText}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? `${balanceFieldId}-error` : undefined}
                  onChange={(event) => setBalanceText(event.target.value)}
                />
              </div>
            </div>
            {error ? (
              <p id={`${balanceFieldId}-error`} role="alert" className="mt-3 text-sm font-medium text-cost">
                {error}
              </p>
            ) : null}
            {notice ? (
              <p className="mt-3 text-sm text-ink" role="status">
                {notice}
              </p>
            ) : null}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button type="submit" className={primaryButtonClass} disabled={submitting}>
                Save balance
              </button>
              <button type="button" className={secondaryButtonClass} onClick={() => void onSample()} disabled={submitting}>
                Add sample balances
              </button>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted">
              Sample balances are {sampleBalances().length} illustrative figures. They are added only when you press the button, and they do not replace a balance you already saved.
            </p>
          </form>

          <section className="mt-8">
            <h2 className={sectionTitleClass}>Stored balances</h2>
            {entries.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No balances saved with this account.</p>
            ) : (
              <ul className="mt-4 grid gap-3">
                {entries.map((entry) => {
                  const program = loyaltyPrograms.find((item) => item.id === entry.programId);
                  const label = program?.name ?? entry.programId;
                  return (
                    <li
                      key={entry.programId}
                      className="flex flex-col gap-3 rounded-xl border border-line bg-sheet p-4 shadow-subtle sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-ink">{label}</p>
                        <p className="text-sm text-muted">
                          {formatPoints(entry.balance)} {program?.unit ?? "points"}
                        </p>
                      </div>
                      <button type="button" className={secondaryButtonClass} onClick={() => void onDelete(entry.programId)} disabled={submitting}>
                        Remove {label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
