import { publicAuthMessage } from "./auth";
import { parseComparisonResponse, type ComparisonResult } from "./comparison-api";
import { addMissingSampleBalances, type SavedComparison, type WalletEntry } from "./local-records";
import { loyaltyProgramById } from "./loyalty";
import { MAX_POINTS, formatPoints } from "./money";

const MAX_SAVED = 30;

export class CloudRecordsError extends Error {
  readonly code: "session" | "validation" | "database";

  constructor(message: string, code: "session" | "validation" | "database") {
    super(message);
    this.name = "CloudRecordsError";
    this.code = code;
  }
}

export type CloudError = { message: string } | null;

export type CloudResult<T> = {
  data: T;
  error: CloudError;
};

export interface CloudQuery extends PromiseLike<CloudResult<unknown>> {
  select(columns: string): CloudQuery;
  insert(row: Record<string, unknown>): CloudQuery;
  upsert(row: Record<string, unknown>, options?: { onConflict?: string }): CloudQuery;
  delete(): CloudQuery;
  eq(column: string, value: string): CloudQuery;
  in(column: string, values: string[]): CloudQuery;
  order(column: string, options: { ascending: boolean }): CloudQuery;
  limit(count: number): CloudQuery;
}

export interface CloudClient {
  auth: {
    getSession(): Promise<{ data: { session: { user: { id: string } } | null }; error: CloudError }>;
  };
  from(table: string): CloudQuery;
}

const SIGN_IN = "Sign in to use the records saved with your account.";

async function requireUserId(client: CloudClient): Promise<string> {
  const { data, error } = await client.auth.getSession();
  const userId = data.session?.user?.id ?? "";
  if (error || userId.trim() === "") throw new CloudRecordsError(SIGN_IN, "session");
  return userId;
}

function fail(error: CloudError, fallback: string): never {
  throw new CloudRecordsError(publicAuthMessage(error?.message, fallback), "database");
}

function rows(result: CloudResult<unknown>): Record<string, unknown>[] {
  if (!Array.isArray(result.data)) return [];
  return result.data.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object");
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function balanceFromRow(row: Record<string, unknown>): WalletEntry | null {
  const balance = asNumber(row.balance);
  if (typeof row.program_id !== "string" || balance === null || !Number.isInteger(balance)) return null;
  if (!loyaltyProgramById(row.program_id) || balance < 0 || balance > MAX_POINTS) return null;
  return { programId: row.program_id, balance };
}

const SAVED_COLUMNS =
  "id,saved_at,origin,destination,cash_fare_euros,points_required,redemption_taxes_fees_euros,estimated_savings_euros,estimated_savings_percent,appears_worthwhile,explanation";

function savedFromRow(row: Record<string, unknown>): SavedComparison | null {
  if (typeof row.id !== "string" || row.id.trim() === "" || typeof row.saved_at !== "string") return null;
  const percent = row.estimated_savings_percent;
  const result = parseComparisonResponse({
    origin: row.origin,
    destination: row.destination,
    cashFareEuros: asNumber(row.cash_fare_euros),
    pointsRequired: asNumber(row.points_required),
    redemptionTaxesFeesEuros: asNumber(row.redemption_taxes_fees_euros),
    estimatedSavingsEuros: asNumber(row.estimated_savings_euros),
    estimatedSavingsPercent: percent == null ? null : asNumber(percent),
    appearsWorthwhile: row.appears_worthwhile,
    explanation: row.explanation,
  });
  if (!result || Number.isNaN(new Date(row.saved_at).getTime())) return null;
  return { id: row.id.trim(), savedAt: row.saved_at, result };
}

function assertBalance(programId: string, balance: number) {
  if (!loyaltyProgramById(programId) || !Number.isInteger(balance) || balance < 0 || balance > MAX_POINTS) {
    throw new CloudRecordsError(`Enter a whole balance from 0 to ${formatPoints(MAX_POINTS)}.`, "validation");
  }
}

export async function listAccountBalances(client: CloudClient): Promise<WalletEntry[]> {
  const userId = await requireUserId(client);
  const result = await client
    .from("loyalty_balances")
    .select("program_id,balance")
    .eq("user_id", userId)
    .order("program_id", { ascending: true });
  if (result.error) fail(result.error, "The balances could not be loaded.");
  return rows(result)
    .map(balanceFromRow)
    .filter((entry): entry is WalletEntry => entry !== null)
    .sort((a, b) => a.programId.localeCompare(b.programId));
}

export async function insertAccountBalance(
  client: CloudClient,
  programId: string,
  balance: number,
  now: () => string = () => new Date().toISOString(),
): Promise<WalletEntry> {
  assertBalance(programId, balance);
  const userId = await requireUserId(client);
  const result = await client.from("loyalty_balances").insert({
    user_id: userId,
    program_id: programId,
    balance,
    updated_at: now(),
  });
  if (result.error) fail(result.error, "The balance could not be saved.");
  return { programId, balance };
}

export async function saveAccountBalance(
  client: CloudClient,
  programId: string,
  balance: number,
  now: () => string = () => new Date().toISOString(),
): Promise<WalletEntry> {
  assertBalance(programId, balance);
  const userId = await requireUserId(client);
  const result = await client.from("loyalty_balances").upsert(
    {
      user_id: userId,
      program_id: programId,
      balance,
      updated_at: now(),
    },
    { onConflict: "user_id,program_id" },
  );
  if (result.error) fail(result.error, "The balance could not be saved.");
  return { programId, balance };
}

export async function removeAccountBalance(client: CloudClient, programId: string): Promise<void> {
  if (!loyaltyProgramById(programId)) throw new CloudRecordsError("That program is not in the wallet.", "validation");
  const userId = await requireUserId(client);
  const result = await client.from("loyalty_balances").delete().eq("user_id", userId).eq("program_id", programId);
  if (result.error) fail(result.error, "The balance could not be removed.");
}

export async function addAccountSampleBalances(client: CloudClient, now?: () => string): Promise<WalletEntry[]> {
  const current = await listAccountBalances(client);
  const additions = addMissingSampleBalances(current).filter(
    (entry) => !current.some((stored) => stored.programId === entry.programId),
  );
  for (const entry of additions) {
    await saveAccountBalance(client, entry.programId, entry.balance, now);
  }
  return listAccountBalances(client);
}

export async function listAccountComparisons(client: CloudClient): Promise<SavedComparison[]> {
  const userId = await requireUserId(client);
  const result = await client
    .from("saved_comparisons")
    .select(SAVED_COLUMNS)
    .eq("user_id", userId)
    .order("saved_at", { ascending: false })
    .limit(MAX_SAVED);
  if (result.error) fail(result.error, "The saved comparisons could not be loaded.");
  return rows(result)
    .map(savedFromRow)
    .filter((record): record is SavedComparison => record !== null)
    .slice(0, MAX_SAVED);
}

export async function findAccountComparison(client: CloudClient, id: string): Promise<SavedComparison | null> {
  if (id.trim() === "") return null;
  const userId = await requireUserId(client);
  const result = await client
    .from("saved_comparisons")
    .select(SAVED_COLUMNS)
    .eq("user_id", userId)
    .eq("id", id)
    .limit(1);
  if (result.error) fail(result.error, "The saved comparison could not be opened.");
  return rows(result).map(savedFromRow).find((record) => record !== null) ?? null;
}

export async function insertAccountComparison(client: CloudClient, record: SavedComparison): Promise<SavedComparison> {
  const parsed = parseComparisonResponse(record.result);
  const savedAt = record.savedAt;
  if (!parsed || record.id.trim() === "" || Number.isNaN(new Date(savedAt).getTime())) {
    throw new CloudRecordsError("This comparison could not be stored.", "validation");
  }
  const userId = await requireUserId(client);
  const stored: SavedComparison = { id: record.id.trim(), savedAt, result: parsed };
  const inserted = await client.from("saved_comparisons").insert(savedRow(userId, stored));
  if (inserted.error) fail(inserted.error, "The comparison could not be saved.");
  return stored;
}

export async function listAllAccountComparisons(client: CloudClient): Promise<SavedComparison[]> {
  const userId = await requireUserId(client);
  const result = await client
    .from("saved_comparisons")
    .select(SAVED_COLUMNS)
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });
  if (result.error) fail(result.error, "The saved comparisons could not be loaded.");
  return rows(result)
    .map(savedFromRow)
    .filter((record): record is SavedComparison => record !== null);
}

export async function saveAccountComparison(client: CloudClient, record: SavedComparison): Promise<SavedComparison> {
  const stored = await insertAccountComparison(client, record);
  const userId = await requireUserId(client);
  await trimSavedComparisons(client, userId);
  return stored;
}

export async function removeAccountComparison(client: CloudClient, id: string): Promise<void> {
  if (id.trim() === "") throw new CloudRecordsError("That comparison could not be removed.", "validation");
  const userId = await requireUserId(client);
  const result = await client.from("saved_comparisons").delete().eq("user_id", userId).eq("id", id);
  if (result.error) fail(result.error, "The comparison could not be removed.");
}

function savedRow(userId: string, record: SavedComparison): Record<string, unknown> {
  const result: ComparisonResult = record.result;
  return {
    user_id: userId,
    id: record.id,
    saved_at: record.savedAt,
    origin: result.origin,
    destination: result.destination,
    cash_fare_euros: result.cashFareEuros,
    points_required: result.pointsRequired,
    redemption_taxes_fees_euros: result.redemptionTaxesFeesEuros,
    estimated_savings_euros: result.estimatedSavingsEuros,
    estimated_savings_percent: result.estimatedSavingsPercent,
    appears_worthwhile: result.appearsWorthwhile,
    explanation: result.explanation,
  };
}

async function trimSavedComparisons(client: CloudClient, userId: string) {
  const listed = await client
    .from("saved_comparisons")
    .select("id,saved_at")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });
  if (listed.error) fail(listed.error, "The comparison could not be saved.");
  const extra = rows(listed)
    .map((row) => (typeof row.id === "string" ? row.id : ""))
    .filter((id) => id !== "")
    .slice(MAX_SAVED);
  if (extra.length === 0) return;
  const removed = await client.from("saved_comparisons").delete().eq("user_id", userId).in("id", extra);
  if (removed.error) fail(removed.error, "The comparison could not be saved.");
}
