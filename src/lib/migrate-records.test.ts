import assert from "node:assert/strict";
import test from "node:test";
import type { ComparisonResult } from "./comparison-api";
import {
  legacyMigrationPlan,
  migrateLegacyRecords,
  migrationSummary,
  type MigrationWriter,
} from "./migrate-records";
import type { KeyValueStorage, SavedComparison, WalletEntry } from "./local-records";

const result: ComparisonResult = {
  origin: "MAD",
  destination: "BCN",
  cashFareEuros: 186,
  pointsRequired: 12500,
  redemptionTaxesFeesEuros: 42,
  estimatedSavingsEuros: 144,
  estimatedSavingsPercent: 77.42,
  appearsWorthwhile: true,
  explanation: "Stored explanation from the comparison service.",
};

const nullPercent: ComparisonResult = {
  ...result,
  estimatedSavingsEuros: 0,
  estimatedSavingsPercent: null,
  appearsWorthwhile: false,
  explanation: "No percentage was returned.",
};

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage & { writes: number; data: Record<string, string> } {
  const data = { ...initial };
  let writes = 0;
  return {
    data,
    get writes() {
      return writes;
    },
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    setItem(key, value) {
      writes += 1;
      data[key] = value;
    },
    removeItem(key) {
      writes += 1;
      delete data[key];
    },
  };
}

function writer(initial: { balances?: WalletEntry[]; comparisons?: SavedComparison[] } = {}, failBalance: string | null = null) {
  const balances = [...(initial.balances ?? [])];
  const comparisons = [...(initial.comparisons ?? [])];
  const insertedBalances: WalletEntry[] = [];
  const insertedComparisons: SavedComparison[] = [];
  let fail = failBalance;
  const store: MigrationWriter & {
    balances: WalletEntry[];
    comparisons: SavedComparison[];
    insertedBalances: WalletEntry[];
    insertedComparisons: SavedComparison[];
    setFail(programId: string | null): void;
  } = {
    balances,
    comparisons,
    insertedBalances,
    insertedComparisons,
    setFail(programId) {
      fail = programId;
    },
    async load() {
      return {
        balances: balances.map((entry) => ({ ...entry })),
        comparisons: comparisons.map((record) => ({ ...record, result: { ...record.result } })),
      };
    },
    async insertBalance(entry) {
      if (entry.programId === fail) throw new Error("database unavailable");
      balances.push({ ...entry });
      insertedBalances.push(entry);
    },
    async insertComparison(record) {
      comparisons.push({ ...record, result: { ...record.result } });
      insertedComparisons.push(record);
    },
  };
  return store;
}

test("malformed legacy data is ignored and empty storage stays empty", () => {
  const storage = memoryStorage({
    "aum.wallet.v1": JSON.stringify([
      { programId: "iberia", balance: 10 },
      { programId: "nope", balance: 10 },
      { programId: "ba", balance: -1 },
      { programId: "aa", balance: 1.5 },
    ]),
    "aum.saved-comparisons.v1": JSON.stringify([
      { id: "bad", savedAt: "not-a-date", result },
      { id: "good", savedAt: "2026-10-27T08:30:00.000Z", result: nullPercent },
      { id: "", savedAt: "2026-10-27T08:30:00.000Z", result },
    ]),
  });
  const plan = legacyMigrationPlan(storage);
  assert.deepEqual(plan.balances, [{ programId: "iberia", balance: 10 }]);
  assert.equal(plan.comparisons.length, 1);
  assert.equal(plan.comparisons[0].result.estimatedSavingsPercent, null);
  assert.deepEqual(legacyMigrationPlan(memoryStorage()), { balances: [], comparisons: [] });
  assert.equal(storage.writes, 0);
});

test("a successful migration copies records and preserves a null percentage", async () => {
  const savedAt = "2026-10-27T08:30:00.000Z";
  const plan = {
    balances: [{ programId: "iberia", balance: 1000 }],
    comparisons: [{ id: "cmp-1", savedAt, result: nullPercent }],
  };
  const account = writer();
  const report = await migrateLegacyRecords(account, plan);
  assert.equal(report.copiedBalances, 1);
  assert.equal(report.copiedComparisons, 1);
  assert.deepEqual(account.insertedComparisons[0], plan.comparisons[0]);
  assert.equal(account.insertedComparisons[0].result.estimatedSavingsPercent, null);
  assert.equal(account.insertedComparisons[0].savedAt, savedAt);
  assert.match(migrationSummary(report), /browser copy is still preserved/);
});

test("conflicting account records are skipped and an identical retry does not write again", async () => {
  const savedAt = "2026-10-27T08:30:00.000Z";
  const plan = {
    balances: [{ programId: "iberia", balance: 1000 }],
    comparisons: [{ id: "cmp-1", savedAt, result }],
  };
  const account = writer({
    balances: [{ programId: "iberia", balance: 2500 }],
    comparisons: [{ id: "cmp-1", savedAt, result: nullPercent }],
  });
  const report = await migrateLegacyRecords(account, plan);
  assert.equal(report.copiedBalances, 0);
  assert.equal(report.copiedComparisons, 0);
  assert.equal(report.conflicts.length, 2);
  assert.equal(account.insertedBalances.length, 0);
  assert.equal(account.insertedComparisons.length, 0);
  assert.equal(account.balances[0].balance, 2500);

  const same = writer({
    balances: [{ programId: "iberia", balance: 1000 }],
    comparisons: [{ id: "cmp-1", savedAt, result }],
  });
  const again = await migrateLegacyRecords(same, plan);
  assert.equal(again.alreadyBalances, 1);
  assert.equal(again.alreadyComparisons, 1);
  assert.equal(same.insertedBalances.length, 0);
  assert.equal(same.insertedComparisons.length, 0);
});

test("a partial failure can be retried without repeating completed copies", async () => {
  const plan = {
    balances: [
      { programId: "iberia", balance: 10 },
      { programId: "ba", balance: 20 },
    ],
    comparisons: [] as SavedComparison[],
  };
  const account = writer({}, "ba");
  const first = await migrateLegacyRecords(account, plan);
  assert.equal(first.copiedBalances, 1);
  assert.equal(first.failures.length, 1);
  assert.equal(account.balances.length, 1);

  account.setFail(null);
  const second = await migrateLegacyRecords(account, plan);
  assert.equal(second.alreadyBalances, 1);
  assert.equal(second.copiedBalances, 1);
  assert.deepEqual(
    account.balances.map((entry) => entry.programId).sort(),
    ["ba", "iberia"],
  );
  assert.match(migrationSummary(first), /was not copied/);
  assert.match(migrationSummary(first), /browser copy is still preserved/);
});

test("migration does not replace a full account of saved comparisons", async () => {
  const existing = Array.from({ length: 30 }, (_, index) => ({
    id: `kept-${index}`,
    savedAt: `2026-10-27T08:${String(index).padStart(2, "0")}:00.000Z`,
    result,
  }));
  const account = writer({ comparisons: existing });
  const report = await migrateLegacyRecords(account, {
    balances: [],
    comparisons: [{ id: "extra", savedAt: "2026-10-27T09:00:00.000Z", result: nullPercent }],
  });
  assert.equal(report.copiedComparisons, 0);
  assert.equal(report.skipped.length, 1);
  assert.equal(account.comparisons.length, 30);
  assert.equal(account.insertedComparisons.length, 0);
});

test("a failed account load does not insert records", async () => {
  let inserts = 0;
  const failing: MigrationWriter = {
    async load() {
      throw new Error("Sign in to use the records saved with your account.");
    },
    async insertBalance() {
      inserts += 1;
    },
    async insertComparison() {
      inserts += 1;
    },
  };
  await assert.rejects(
    migrateLegacyRecords(failing, { balances: [{ programId: "iberia", balance: 1 }], comparisons: [] }),
  );
  assert.equal(inserts, 0);
});
