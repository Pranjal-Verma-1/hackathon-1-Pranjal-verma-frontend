import assert from "node:assert/strict";
import test from "node:test";
import type { ComparisonResult } from "./comparison-api";
import { TRANSFER_REFERENCE_NOTE, referenceTransferLabel, sampleBalances } from "./loyalty";
import {
  addMissingSampleBalances,
  deleteSavedComparison,
  deleteWalletBalance,
  findSavedComparison,
  readSavedComparisons,
  readWallet,
  saveComparison,
  upsertWalletBalance,
  writeWallet,
  type KeyValueStorage,
} from "./local-records";

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

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    setItem(key, value) {
      data[key] = value;
    },
    removeItem(key) {
      delete data[key];
    },
  };
}

test("wallet balances can be added, edited, and deleted", () => {
  const storage = memoryStorage();
  assert.deepEqual(readWallet(storage), []);

  const added = upsertWalletBalance([], "iberia", 1000);
  assert.ok(added);
  assert.equal(writeWallet(storage, added), true);
  assert.deepEqual(readWallet(storage), [{ programId: "iberia", balance: 1000 }]);

  const edited = upsertWalletBalance(readWallet(storage), "iberia", 2500);
  assert.ok(edited);
  writeWallet(storage, edited);
  assert.deepEqual(readWallet(storage), [{ programId: "iberia", balance: 2500 }]);

  writeWallet(storage, deleteWalletBalance(readWallet(storage), "iberia"));
  assert.deepEqual(readWallet(storage), []);
});

test("wallet storage ignores invalid data and does not load the sample by itself", () => {
  const storage = memoryStorage({
    "aum.wallet.v1": JSON.stringify([
      { programId: "iberia", balance: 10 },
      { programId: "nope", balance: 10 },
      { programId: "ba", balance: -1 },
      { programId: "aa", balance: 1.5 },
    ]),
  });
  assert.deepEqual(readWallet(storage), [{ programId: "iberia", balance: 10 }]);
  assert.equal(readWallet(null).length, 0);
  assert.equal(writeWallet(null, []), false);
  assert.equal(JSON.stringify(readWallet(storage)).includes("45000"), false);

  const withSample = addMissingSampleBalances(readWallet(storage));
  assert.equal(withSample.find((entry) => entry.programId === "iberia")?.balance, 10);
  assert.equal(withSample.find((entry) => entry.programId === "flyingblue")?.balance, 22000);
  assert.equal(withSample.length, readWallet(storage).length + sampleBalances().length - 1);
});

test("a saved comparison keeps the API response and can be reopened or deleted", () => {
  const storage = memoryStorage();
  const savedAt = "2026-10-27T08:30:00.000Z";
  const stored = saveComparison(storage, { id: "cmp-1", savedAt, result });
  assert.ok(stored);
  const reopened = findSavedComparison(storage, "cmp-1");
  assert.ok(reopened);
  assert.equal(reopened.savedAt, savedAt);
  assert.deepEqual(reopened.result, result);
  assert.equal(reopened.result.estimatedSavingsEuros, 144);
  assert.equal(reopened.result.estimatedSavingsPercent, 77.42);

  const remaining = deleteSavedComparison(storage, "cmp-1");
  assert.deepEqual(remaining, []);
  assert.equal(findSavedComparison(storage, "cmp-1"), null);
});

test("corrupt saved comparisons are skipped and a missing store does not throw", () => {
  const storage = memoryStorage({
    "aum.saved-comparisons.v1": JSON.stringify([
      { id: "bad", savedAt: "not-a-date", result },
      { id: "good", savedAt: "2026-10-27T08:30:00.000Z", result },
      { id: "", savedAt: "2026-10-27T08:30:00.000Z", result },
    ]),
  });
  assert.deepEqual(readSavedComparisons(storage).map((item) => item.id), ["good"]);
  assert.deepEqual(readSavedComparisons(null), []);
  assert.equal(saveComparison(null, { id: "cmp-2", savedAt: "2026-10-27T08:30:00.000Z", result }), null);
  assert.equal(deleteSavedComparison(null, "good"), null);
});

test("an unavailable store stays empty and transfer ratios stay reference labels", () => {
  const blocked: KeyValueStorage = {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("blocked");
    },
    removeItem() {
      throw new Error("blocked");
    },
  };
  assert.deepEqual(readWallet(blocked), []);
  assert.equal(writeWallet(blocked, [{ programId: "iberia", balance: 1 }]), false);
  assert.deepEqual(readSavedComparisons(blocked), []);
  assert.equal(saveComparison(blocked, { id: "x", savedAt: "2026-10-27T08:30:00.000Z", result }), null);
  assert.equal(upsertWalletBalance([], "missing", 10), null);
  assert.equal(referenceTransferLabel("amex", "iberia"), "Reference 1:1");
  assert.equal(referenceTransferLabel("amex", "qatar"), null);
  assert.match(TRANSFER_REFERENCE_NOTE, /does not mean an award seat exists/);
  assert.equal(sampleBalances().some((sample) => sample.balance === 45000), true);
});
