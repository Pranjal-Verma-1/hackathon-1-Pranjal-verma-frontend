import assert from "node:assert/strict";
import test from "node:test";
import { CloudRecordsError, type CloudClient, type CloudQuery } from "./cloud-records";
import {
  barWidthPercent,
  comparisonsToCsv,
  explorerAccountState,
  explorerMetrics,
  filterComparisons,
  loadExplorerRecords,
  pointsReadiness,
  resultBalanceComparison,
  summaryHtmlDocument,
  tripSummaryText,
  uniqueComparisons,
} from "./explorer";
import type { SavedCloudView, WalletCloudView } from "./cloud-browser";
import type { ComparisonResult } from "./comparison-api";
import type { SavedComparison, WalletEntry } from "./local-records";

function result(overrides: Partial<ComparisonResult> = {}): ComparisonResult {
  return {
    origin: "MAD",
    destination: "BCN",
    cashFareEuros: 186,
    pointsRequired: 12500,
    redemptionTaxesFeesEuros: 42,
    estimatedSavingsEuros: 144,
    estimatedSavingsPercent: 77.42,
    appearsWorthwhile: true,
    explanation: "The redemption asks for less cash than the fare.",
    ...overrides,
  };
}

function record(id: string, overrides: Partial<ComparisonResult> = {}, savedAt = "2026-10-27T08:00:00.000Z"): SavedComparison {
  return { id, savedAt, result: result(overrides) };
}

const emptySaved: SavedCloudView = { status: "ready", records: [], message: "" };
const emptyWallet: WalletCloudView = { status: "ready", entries: [], message: "" };

test("metrics ignore a repeated saved comparison and keep a null percentage out of the average", () => {
  const first = record("same", { estimatedSavingsEuros: 144, estimatedSavingsPercent: null });
  const duplicate = record("same", { estimatedSavingsEuros: 999, estimatedSavingsPercent: 10 });
  const other = record("other", { origin: "LHR", destination: "JFK", estimatedSavingsEuros: 20, estimatedSavingsPercent: 10, cashFareEuros: 0 });
  const metrics = explorerMetrics([first, duplicate, other]);

  assert.equal(uniqueComparisons([first, duplicate]).length, 1);
  assert.equal(metrics.count, 2);
  assert.equal(metrics.totalEstimatedSavingsEuros, 164);
  assert.equal(metrics.best?.id, "same");
  assert.equal(metrics.averageSavingsPercent, 10);
  assert.equal(metrics.definedPercentCount, 1);
});

test("an empty saved list has no total, no best trip, and no average percentage", () => {
  const metrics = explorerMetrics([]);
  assert.equal(metrics.count, 0);
  assert.equal(metrics.totalEstimatedSavingsEuros, 0);
  assert.equal(metrics.best, null);
  assert.equal(metrics.averageSavingsPercent, null);
  assert.equal(metrics.definedPercentCount, 0);
});

test("filters match a route and sorting follows estimated savings", () => {
  const low = record("low", { origin: "MAD", destination: "BCN", estimatedSavingsEuros: 10 });
  const high = record("high", { origin: "mad", destination: "LIS", estimatedSavingsEuros: 80 });
  const other = record("other", { origin: "CDG", destination: "BCN", estimatedSavingsEuros: 40 });
  const filters = { origin: "mad", destination: "", sort: "savings-asc" as const };

  assert.deepEqual(
    filterComparisons([high, other, low], filters).map((item) => item.id),
    ["low", "high"],
  );
  assert.deepEqual(
    filterComparisons([high, other, low], { origin: "", destination: "bcn", sort: "savings-desc" }).map((item) => item.id),
    ["other", "low"],
  );
});

test("a trip summary and CSV keep a null percentage unavailable and escape spreadsheet text", () => {
  const saved = record("one", {
    estimatedSavingsPercent: null,
    explanation: '=1+1, "save"\nnext',
  });
  const summary = tripSummaryText(saved);
  const csv = comparisonsToCsv([saved, saved]);

  assert.match(summary, /Estimated savings percentage: unavailable/);
  assert.doesNotMatch(summary, /0%/);
  assert.equal(csv.split("\r\n").length, 2);
  assert.match(csv, /"unavailable"/);
  assert.doesNotMatch(csv, /,0,/);
  assert.match(csv, /"'=1\+1, ""save""\nnext"/);
  assert.equal(barWidthPercent(42, 186), (42 / 186) * 100);
  assert.equal(barWidthPercent(-1, 186), 0);
});

test("points readiness uses one named program and does not guess from the wallet", () => {
  const saved = record("trip");
  const balances: WalletEntry[] = [
    { programId: "iberia", balance: 10000 },
    { programId: "ba", balance: 10000 },
  ];

  const unnamed = pointsReadiness(saved, [{ programId: "iberia", balance: 10000 }]);
  assert.equal(unnamed.status, "undetermined");
  if (unnamed.status === "undetermined") assert.match(unnamed.message, /does not name a loyalty program/);
  assert.equal(pointsReadiness(saved, balances).status, "undetermined");

  const shortfall = pointsReadiness(saved, balances, "iberia");
  assert.equal(shortfall.status, "matched");
  if (shortfall.status === "matched") {
    assert.equal(shortfall.position, "shortfall");
    assert.equal(shortfall.difference, -2500);
    assert.equal(shortfall.balance, 10000);
  }

  const surplus = pointsReadiness(saved, [{ programId: "ba", balance: 20000 }], "ba");
  assert.equal(surplus.status, "matched");
  if (surplus.status === "matched") assert.equal(surplus.position, "surplus");

  const exact = pointsReadiness(saved, [{ programId: "aa", balance: 12500 }], "aa");
  assert.equal(exact.status, "matched");
  if (exact.status === "matched") assert.equal(exact.position, "exact");

  const missingBalance = pointsReadiness(saved, [], "iberia");
  assert.equal(missingBalance.status, "undetermined");
  if (missingBalance.status === "undetermined") assert.match(missingBalance.message, /no balance/);
  const duplicateBalance = pointsReadiness(saved, [balances[0]!, { programId: "iberia", balance: 5 }], "iberia");
  assert.equal(duplicateBalance.status, "undetermined");
  if (duplicateBalance.status === "undetermined") assert.match(duplicateBalance.message, /More than one balance/);
  assert.equal(pointsReadiness(saved, balances, "not-a-program").status, "undetermined");
});

test("a result balance comparison covers a sufficient balance, a shortfall, and the states with no readable balance", () => {
  const ready = { status: "ready" as const, entries: [{ programId: "iberia", balance: 20000 }], message: "" };
  const covered = resultBalanceComparison("iberia", 12500, ready);
  assert.equal(covered.status, "ready");
  if (covered.status === "ready") {
    assert.equal(covered.programName, "Iberia Plus");
    assert.equal(covered.balance, 20000);
    assert.equal(covered.pointsRequired, 12500);
    assert.equal(covered.shortfall, null);
    assert.match(covered.note, /does not mean those points can be transferred or redeemed/);
  }

  const short = resultBalanceComparison("iberia", 12500, {
    status: "ready",
    entries: [{ programId: "iberia", balance: 10000 }],
    message: "",
  });
  assert.equal(short.status, "ready");
  if (short.status === "ready") assert.equal(short.shortfall, 2500);
  const exact = resultBalanceComparison("iberia", 12500, {
    status: "ready",
    entries: [{ programId: "iberia", balance: 12500 }],
    message: "",
  });
  assert.equal(exact.status, "ready");
  if (exact.status === "ready") assert.equal(exact.shortfall, null);

  const unnamed = resultBalanceComparison("", 12500, ready);
  assert.equal(unnamed.status, "undetermined");
  if (unnamed.status === "undetermined") assert.match(unnamed.message, /does not name a loyalty program/);

  const signedOut = resultBalanceComparison("iberia", 12500, {
    status: "signed-out",
    entries: [],
    message: "Sign in to use the records saved with your account.",
  });
  assert.equal(signedOut.status, "signed-out");
  if (signedOut.status === "signed-out") assert.match(signedOut.message, /Sign in/);

  const missing = resultBalanceComparison("ba", 12500, ready);
  assert.equal(missing.status, "undetermined");
  if (missing.status === "undetermined") {
    assert.match(missing.message, /no balance/);
    assert.doesNotMatch(missing.message, /0/);
  }

  const failed = resultBalanceComparison("iberia", 12500, {
    status: "unavailable",
    entries: [],
    message: "The balances could not be loaded.",
  });
  assert.equal(failed.status, "unavailable");
  if (failed.status === "unavailable") assert.equal(failed.message, "The balances could not be loaded.");
});

test("a print summary escapes HTML in the stored explanation", () => {
  const saved = record("html", { explanation: `<script>alert("x")</script>` });
  const html = summaryHtmlDocument([saved]);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
});

test("explorer state covers loading, an empty account, a missing session, and a database error", async () => {
  assert.equal(explorerAccountState({ status: "loading", records: [], message: "" }, emptyWallet).status, "loading");
  assert.equal(explorerAccountState(emptySaved, { status: "loading", entries: [], message: "" }).status, "loading");
  const signedOut = explorerAccountState(
    { status: "signed-out", records: [], message: "Sign in to use the records saved with your account." },
    emptyWallet,
  );
  assert.equal(signedOut.status, "signed-out");
  if (signedOut.status === "signed-out") assert.match(signedOut.message, /Sign in/);
  const failed = explorerAccountState(emptySaved, { status: "unavailable", entries: [], message: "The balances could not be loaded." });
  assert.equal(failed.status, "unavailable");
  const ready = explorerAccountState(emptySaved, emptyWallet);
  assert.equal(ready.status, "ready");
  if (ready.status === "ready") assert.equal(ready.records.length, 0);

  const gate = gatedClient(false);
  await assert.rejects(() => loadExplorerRecords(gate.client), (error: unknown) => error instanceof CloudRecordsError && error.code === "session");
  assert.equal(gate.queries(), 0);

  const open = gatedClient(true);
  const loaded = await loadExplorerRecords(open.client);
  assert.deepEqual(loaded, { records: [], balances: [] });
  assert.equal(open.queries() > 0, true);
});

function gatedClient(signedIn: boolean): { client: CloudClient; queries: () => number } {
  let queries = 0;
  const query = {
    select() {
      return query;
    },
    insert() {
      return query;
    },
    upsert() {
      return query;
    },
    delete() {
      return query;
    },
    eq() {
      return query;
    },
    in() {
      return query;
    },
    order() {
      return query;
    },
    limit() {
      return query;
    },
    then(resolve: (value: { data: unknown[]; error: null }) => void) {
      queries += 1;
      resolve({ data: [], error: null });
    },
  } as unknown as CloudQuery;
  return {
    queries: () => queries,
    client: {
      auth: {
        async getSession() {
          return {
            data: { session: signedIn ? { user: { id: "user-1" } } : null },
            error: null,
          };
        },
      },
      from() {
        return query;
      },
    },
  };
}
