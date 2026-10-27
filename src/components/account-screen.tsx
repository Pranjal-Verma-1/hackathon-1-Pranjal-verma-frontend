"use client";

import { useId, useState, useSyncExternalStore, type FormEvent } from "react";
import { signInWithEmail, signOutAccount, signUpWithEmail } from "@/lib/auth";
import { accountClientSnapshot, accountServerSnapshot, subscribeAccount } from "@/lib/account-session";
import { browserCloudClient, reloadSavedCloud, reloadWalletCloud } from "@/lib/cloud-browser";
import { CloudRecordsError } from "@/lib/cloud-records";
import { browserStorage } from "@/lib/local-records";
import {
  accountMigrationWriter,
  legacyMigrationClientSnapshot,
  legacyMigrationPlan,
  legacyMigrationServerSnapshot,
  migrateLegacyRecords,
  migrationSummary,
  subscribeLegacyMigration,
} from "@/lib/migrate-records";
import { SupabaseConfigError, getSupabaseBrowserClient } from "@/lib/supabase";
import { controlClass, headingClass, primaryButtonClass, secondaryButtonClass } from "./field";
import { MileMark } from "./mile-mark";

export function AccountScreen() {
  const emailId = useId();
  const passwordId = useId();
  const account = useSyncExternalStore(subscribeAccount, accountClientSnapshot, accountServerSnapshot);
  const legacy = JSON.parse(
    useSyncExternalStore(subscribeLegacyMigration, legacyMigrationClientSnapshot, legacyMigrationServerSnapshot),
  ) as { ready: boolean; balances: number; comparisons: number };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState("");
  const [migrationError, setMigrationError] = useState("");

  async function authClient() {
    try {
      return getSupabaseBrowserClient().auth;
    } catch (caught) {
      const message = caught instanceof SupabaseConfigError ? caught.message : "Supabase is not configured.";
      setNotice("");
      setError(message);
      return null;
    }
  }

  async function onSignIn(event: FormEvent) {
    event.preventDefault();
    const auth = await authClient();
    if (!auth) return;
    setSubmitting(true);
    setError("");
    setNotice("");
    const result = await signInWithEmail(auth, email, password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setPassword("");
    setNotice("Signed in.");
  }

  async function onSignUp() {
    const auth = await authClient();
    if (!auth) return;
    setSubmitting(true);
    setError("");
    setNotice("");
    const redirect = `${window.location.origin}/account`;
    const result = await signUpWithEmail(auth, email, password, redirect);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setPassword("");
    setNotice(
      result.pendingConfirmation
        ? "Check your email to confirm this account. You can sign in after it is confirmed."
        : "Account created and signed in.",
    );
  }

  async function onMigrate() {
    setMigrating(true);
    setMigrationMessage("");
    setMigrationError("");
    try {
      const report = await migrateLegacyRecords(
        accountMigrationWriter(browserCloudClient()),
        legacyMigrationPlan(browserStorage()),
      );
      setMigrationMessage(migrationSummary(report));
      await Promise.allSettled([reloadWalletCloud(), reloadSavedCloud()]);
    } catch (caught) {
      const message =
        caught instanceof CloudRecordsError || caught instanceof SupabaseConfigError
          ? caught.message
          : "The browser records could not be copied.";
      setMigrationError(`${message} Nothing in this browser was removed.`);
    } finally {
      setMigrating(false);
    }
  }

  async function onSignOut() {
    const auth = await authClient();
    if (!auth) return;
    setSubmitting(true);
    setError("");
    setNotice("");
    const result = await signOutAccount(auth);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setNotice("Signed out.");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center gap-3">
        <MileMark className="size-8 text-marker" />
        <h1 className={headingClass}>Your account</h1>
      </div>
      <p className="mt-4 text-base leading-relaxed text-muted">
        Sign in with email. Balances and saved comparisons are stored with the signed-in account. Older copies already in this browser are left as they are.
      </p>

      {account.status === "loading" ? (
        <p className="mt-8 text-sm text-muted" role="status">
          Checking the session in this browser.
        </p>
      ) : null}

      {account.status === "unavailable" ? (
        <p className="mt-8 rounded-lg border border-cost-border bg-cost-bg p-4 text-sm font-medium text-cost" role="alert">
          {account.message}
        </p>
      ) : null}

      {account.status === "signed-in" ? (
        <section className="mt-8 rounded-xl border border-line bg-sheet p-5 shadow-subtle">
          <h2 className="text-base font-bold text-ink">Signed in</h2>
          <p className="mt-2 text-sm text-ink">{account.email ?? "Email address unavailable"}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            This session reads and writes the balances and saved comparisons for this account.
          </p>
          {error ? (
            <p className="mt-3 text-sm font-medium text-cost" role="alert">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p className="mt-3 text-sm text-ink" role="status">
              {notice}
            </p>
          ) : null}
          <button type="button" className={`${secondaryButtonClass} mt-5`} onClick={onSignOut} disabled={submitting || migrating}>
            Sign out
          </button>
        </section>
      ) : null}

      {account.status === "signed-in" && legacy.ready && legacy.balances + legacy.comparisons > 0 ? (
        <section className="mt-8 rounded-xl border border-line bg-sheet p-5 shadow-subtle">
          <h2 className="text-base font-bold text-ink">Browser records</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink">
            {legacy.balances} {legacy.balances === 1 ? "balance" : "balances"} and {legacy.comparisons}{" "}
            {legacy.comparisons === 1 ? "saved comparison" : "saved comparisons"} in this browser can be copied to this account.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Copying adds only records this account does not already have. A different balance or comparison is left unchanged. The browser copy stays in this browser.
          </p>
          {migrationError ? (
            <p className="mt-3 text-sm font-medium text-cost" role="alert">
              {migrationError}
            </p>
          ) : null}
          {migrationMessage ? (
            <p className="mt-3 text-sm text-ink" role="status">
              {migrationMessage}
            </p>
          ) : null}
          <button type="button" className={`${primaryButtonClass} mt-5`} onClick={() => void onMigrate()} disabled={migrating || submitting}>
            {migrating ? "Copying" : "Copy to this account"}
          </button>
        </section>
      ) : null}

      {account.status === "signed-out" ? (
        <form className="mt-8 rounded-xl border border-line bg-sheet p-5 shadow-subtle" onSubmit={onSignIn} aria-busy={submitting}>
          <h2 className="text-base font-bold text-ink">Sign in or create an account</h2>
          <div className="mt-4 grid gap-4">
            <div>
              <label htmlFor={emailId} className="block text-sm font-semibold text-ink">
                Email
              </label>
              <input
                id={emailId}
                type="email"
                autoComplete="email"
                className={`${controlClass} mt-1.5`}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor={passwordId} className="block text-sm font-semibold text-ink">
                Password
              </label>
              <input
                id={passwordId}
                type="password"
                autoComplete="current-password"
                className={`${controlClass} mt-1.5`}
                value={password}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${passwordId}-error` : undefined}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </div>
          {error ? (
            <p id={`${passwordId}-error`} className="mt-3 text-sm font-medium text-cost" role="alert">
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
              Sign in
            </button>
            <button type="button" className={secondaryButtonClass} onClick={onSignUp} disabled={submitting}>
              Create account
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
