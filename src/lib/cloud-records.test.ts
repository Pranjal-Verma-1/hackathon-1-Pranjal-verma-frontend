import assert from "node:assert/strict";
import test from "node:test";
import type { ComparisonResult } from "./comparison-api";
import {
  CloudRecordsError,
  addAccountSampleBalances,
  findAccountComparison,
  listAccountBalances,
  listAccountComparisons,
  removeAccountBalance,
  removeAccountComparison,
  saveAccountBalance,
  saveAccountComparison,
  type CloudClient,
  type CloudQuery,
  type CloudResult,
} from "./cloud-records";

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

const nullPercent: ComparisonResult = { ...result, estimatedSavingsPercent: null, estimatedSavingsEuros: 0, appearsWorthwhile: false };

type Row = Record<string, unknown>;

function memoryClient() {
  const balances: Row[] = [];
  const saved: Row[] = [];
  const ops: string[] = [];
  let userId: string | null = "user-1";
  let failure: string | null = null;
  let lastConflict = "";

  function execute(table: string, action: string, payload: Row | null, filters: { column: string; value: unknown }[], limit: number) {
    ops.push(`${action}:${table}`);
    if (failure === action) return { data: null, error: { message: "database unavailable" } };
    const matches = (row: Row) => filters.every((filter) => {
      if (Array.isArray(filter.value)) return filter.value.includes(row[filter.column]);
      return row[filter.column] === filter.value;
    });
    if (action === "upsert" && payload && table === "loyalty_balances") {
      const index = balances.findIndex((row) => row.user_id === payload.user_id && row.program_id === payload.program_id);
      if (index >= 0) balances[index] = payload;
      else balances.push(payload);
      return { data: null, error: null };
    }
    if (action === "insert" && payload && table === "saved_comparisons") {
      saved.unshift(payload);
      return { data: null, error: null };
    }
    if (action === "delete" && table === "loyalty_balances") {
      for (let index = balances.length - 1; index >= 0; index -= 1) {
        if (matches(balances[index])) balances.splice(index, 1);
      }
      return { data: null, error: null };
    }
    if (action === "delete" && table === "saved_comparisons") {
      for (let index = saved.length - 1; index >= 0; index -= 1) {
        if (matches(saved[index])) saved.splice(index, 1);
      }
      return { data: null, error: null };
    }
    const source = table === "loyalty_balances" ? balances : saved;
    const selected = source.filter(matches).sort((left, right) => {
      const leftKey = String(left.saved_at ?? left.program_id ?? "");
      const rightKey = String(right.saved_at ?? right.program_id ?? "");
      return table === "loyalty_balances" ? leftKey.localeCompare(rightKey) : rightKey.localeCompare(leftKey);
    });
    return { data: selected.slice(0, limit), error: null };
  }

  function query(table: string): CloudQuery {
    const state = {
      action: "select",
      payload: null as Row | null,
      filters: [] as { column: string; value: unknown }[],
      limit: 100,
    };
    const builder = {
      select() {
        return builder;
      },
      insert(row: Row) {
        state.action = "insert";
        state.payload = row;
        return builder;
      },
      upsert(row: Row, options?: { onConflict?: string }) {
        state.action = "upsert";
        state.payload = row;
        lastConflict = options?.onConflict ?? "";
        return builder;
      },
      delete() {
        state.action = "delete";
        return builder;
      },
      eq(column: string, value: string) {
        state.filters.push({ column, value });
        return builder;
      },
      in(column: string, values: string[]) {
        state.filters.push({ column, value: values });
        return builder;
      },
      order() {
        return builder;
      },
      limit(count: number) {
        state.limit = count;
        return builder;
      },
      then<TResult1 = CloudResult<unknown>, TResult2 = never>(
        onfulfilled?: ((value: CloudResult<unknown>) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
      ) {
        return Promise.resolve(execute(table, state.action, state.payload, state.filters, state.limit)).then(onfulfilled, onrejected);
      },
    };
    return builder;
  }

  const client: CloudClient = {
    auth: {
      async getSession() {
        return { data: { session: userId ? { user: { id: userId } } : null }, error: null };
      },
    },
    from(table: string) {
      return query(table);
    },
  };

  return {
    client,
    balances,
    saved,
    ops,
    setUser(next: string | null) {
      userId = next;
    },
    fail(action: string | null) {
      failure = action;
    },
    conflict() {
      return lastConflict;
    },
  };
}

test("wallet balances can be added, edited, and deleted for the signed-in account", async () => {
  const store = memoryClient();
  assert.deepEqual(await listAccountBalances(store.client), []);
  await saveAccountBalance(store.client, "iberia", 1000, () => "2026-10-27T09:00:00.000Z");
  await saveAccountBalance(store.client, "iberia", 2500, () => "2026-10-27T09:05:00.000Z");
  assert.deepEqual(await listAccountBalances(store.client), [{ programId: "iberia", balance: 2500 }]);
  assert.equal(store.balances[0].user_id, "user-1");
  assert.equal(store.balances[0].updated_at, "2026-10-27T09:05:00.000Z");
  assert.equal(store.conflict(), "user_id,program_id");
  await removeAccountBalance(store.client, "iberia");
  assert.deepEqual(await listAccountBalances(store.client), []);
});

test("a missing session and an invalid balance do not query the database", async () => {
  const store = memoryClient();
  store.setUser(null);
  await assert.rejects(listAccountBalances(store.client), (error: unknown) => {
    assert.ok(error instanceof CloudRecordsError);
    assert.equal(error.code, "session");
    return true;
  });
  store.setUser("user-1");
  await assert.rejects(saveAccountBalance(store.client, "iberia", 1.5), CloudRecordsError);
  await assert.rejects(saveAccountBalance(store.client, "missing", 10), CloudRecordsError);
  assert.deepEqual(store.ops, []);
});

test("a database failure does not report a saved balance", async () => {
  const store = memoryClient();
  store.fail("upsert");
  await assert.rejects(saveAccountBalance(store.client, "iberia", 10), (error: unknown) => {
    assert.ok(error instanceof CloudRecordsError);
    assert.equal(error.code, "database");
    assert.equal(error.message.includes("sb_"), false);
    return true;
  });
  assert.equal(store.balances.length, 0);
});

test("sample balances fill gaps and keep an existing balance", async () => {
  const store = memoryClient();
  await saveAccountBalance(store.client, "iberia", 10, () => "2026-10-27T09:00:00.000Z");
  const next = await addAccountSampleBalances(store.client, () => "2026-10-27T09:10:00.000Z");
  assert.equal(next.find((entry) => entry.programId === "iberia")?.balance, 10);
  assert.equal(next.find((entry) => entry.programId === "flyingblue")?.balance, 22000);
});

test("a saved comparison keeps the response, a null percentage, and the original timestamp", async () => {
  const store = memoryClient();
  const savedAt = "2026-10-27T08:30:00.000Z";
  const saved = await saveAccountComparison(store.client, { id: "cmp-1", savedAt, result: nullPercent });
  assert.equal(saved.savedAt, savedAt);
  assert.equal(saved.result.estimatedSavingsPercent, null);
  assert.equal(store.saved[0].estimated_savings_percent, null);
  assert.equal(store.saved[0].user_id, "user-1");
  assert.equal(store.saved[0].explanation, nullPercent.explanation);

  store.saved[0].cash_fare_euros = "186";
  store.saved[0].estimated_savings_percent = null;
  const reopened = await findAccountComparison(store.client, "cmp-1");
  assert.ok(reopened);
  assert.equal(reopened.savedAt, savedAt);
  assert.equal(reopened.result.cashFareEuros, 186);
  assert.equal(reopened.result.estimatedSavingsEuros, 0);
  assert.equal(reopened.result.estimatedSavingsPercent, null);
  assert.equal(reopened.result.explanation, nullPercent.explanation);

  await removeAccountComparison(store.client, "cmp-1");
  assert.equal(await findAccountComparison(store.client, "cmp-1"), null);
});

test("saved comparisons stay newest first and cap at 30", async () => {
  const store = memoryClient();
  for (let index = 0; index < 30; index += 1) {
    const savedAt = `2026-10-01T00:${String(index).padStart(2, "0")}:00.000Z`;
    await saveAccountComparison(store.client, { id: `old-${index}`, savedAt, result });
  }
  await saveAccountComparison(store.client, { id: "newest", savedAt: "2026-10-27T08:30:00.000Z", result });
  const listed = await listAccountComparisons(store.client);
  assert.equal(listed.length, 30);
  assert.equal(listed[0].id, "newest");
  assert.equal(listed[0].result.estimatedSavingsPercent, 77.42);
  assert.equal(listed.some((record) => record.id === "old-0"), false);
});

test("another account's rows are not listed or removed", async () => {
  const store = memoryClient();
  store.balances.push({ user_id: "user-2", program_id: "ba", balance: 80 });
  store.saved.push({
    user_id: "user-2",
    id: "theirs",
    saved_at: "2026-10-27T08:30:00.000Z",
    origin: "MAD",
    destination: "BCN",
    cash_fare_euros: 186,
    points_required: 12500,
    redemption_taxes_fees_euros: 42,
    estimated_savings_euros: 144,
    estimated_savings_percent: 77.42,
    appears_worthwhile: true,
    explanation: "Stored explanation from the comparison service.",
  });
  assert.deepEqual(await listAccountBalances(store.client), []);
  assert.equal(await findAccountComparison(store.client, "theirs"), null);
  await removeAccountBalance(store.client, "ba");
  await removeAccountComparison(store.client, "theirs");
  assert.equal(store.balances.length, 1);
  assert.equal(store.saved.length, 1);
});
