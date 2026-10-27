import { parseComparisonResponse, type ComparisonResult } from "./comparison-api";
import { loyaltyProgramById, sampleBalances } from "./loyalty";
import { MAX_POINTS } from "./money";
import type { ValidatedTrip } from "./trip";

export type KeyValueStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type WalletEntry = {
  programId: string;
  balance: number;
};

export type SavedComparison = {
  id: string;
  savedAt: string;
  result: ComparisonResult;
};

const WALLET_KEY = "aum.wallet.v1";
const SAVED_KEY = "aum.saved-comparisons.v1";
const MAX_SAVED = 30;
const listeners = new Set<() => void>();
let walletSnapshot = "";
let savedSnapshot = "";

export function subscribeRecords(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function walletServerSnapshot(): string {
  return JSON.stringify({ ready: false, available: true, entries: [] as WalletEntry[] });
}

export function walletClientSnapshot(): string {
  const storage = browserStorage();
  const next = JSON.stringify({ ready: true, available: storage !== null, entries: readWallet(storage) });
  if (next === walletSnapshot) return walletSnapshot;
  walletSnapshot = next;
  return walletSnapshot;
}

export function savedServerSnapshot(): string {
  return JSON.stringify({ ready: false, available: true, records: [] as SavedComparison[] });
}

export function savedClientSnapshot(): string {
  const storage = browserStorage();
  const next = JSON.stringify({
    ready: true,
    available: storage !== null,
    records: readSavedComparisons(storage),
  });
  if (next === savedSnapshot) return savedSnapshot;
  savedSnapshot = next;
  return savedSnapshot;
}

function emitRecords() {
  walletSnapshot = "";
  savedSnapshot = "";
  for (const listener of listeners) listener();
}

export function browserStorage(): KeyValueStorage | null {
  if (typeof window === "undefined") return null;
  try {
    const probe = "__aum_storage_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readWallet(storage: KeyValueStorage | null): WalletEntry[] {
  if (!storage) return [];
  try {
    return parseWallet(storage.getItem(WALLET_KEY));
  } catch {
    return [];
  }
}

export function writeWallet(storage: KeyValueStorage | null, entries: WalletEntry[]): boolean {
  if (!storage) return false;
  try {
    storage.setItem(WALLET_KEY, JSON.stringify(parseWallet(JSON.stringify(entries))));
    emitRecords();
    return true;
  } catch {
    return false;
  }
}

export function upsertWalletBalance(
  entries: WalletEntry[],
  programId: string,
  balance: number,
): WalletEntry[] | null {
  if (!loyaltyProgramById(programId)) return null;
  if (!Number.isInteger(balance) || balance < 0 || balance > MAX_POINTS) return null;
  const next = entries.filter((entry) => entry.programId !== programId);
  next.push({ programId, balance });
  return next.sort((a, b) => a.programId.localeCompare(b.programId));
}

export function deleteWalletBalance(entries: WalletEntry[], programId: string): WalletEntry[] {
  return entries.filter((entry) => entry.programId !== programId);
}

/** Adds sample rows that are not already stored. Existing balances stay as entered. */
export function addMissingSampleBalances(entries: WalletEntry[]): WalletEntry[] {
  const present = new Set(entries.map((entry) => entry.programId));
  const additions = sampleBalances().filter((sample) => !present.has(sample.programId));
  return [...entries, ...additions].sort((a, b) => a.programId.localeCompare(b.programId));
}

export function readSavedComparisons(storage: KeyValueStorage | null): SavedComparison[] {
  if (!storage) return [];
  try {
    return parseSavedComparisons(storage.getItem(SAVED_KEY));
  } catch {
    return [];
  }
}

export function saveComparison(
  storage: KeyValueStorage | null,
  record: SavedComparison,
): SavedComparison[] | null {
  const savedAt = normalizeTimestamp(record.savedAt);
  const result = parseComparisonResponse(record.result);
  if (!storage || !savedAt || !result || record.id.trim() === "") return null;
  const next = [
    { id: record.id.trim(), savedAt, result },
    ...readSavedComparisons(storage).filter((item) => item.id !== record.id),
  ].slice(0, MAX_SAVED);
  try {
    storage.setItem(SAVED_KEY, JSON.stringify(next));
    emitRecords();
    return next;
  } catch {
    return null;
  }
}

export function findSavedComparison(storage: KeyValueStorage | null, id: string): SavedComparison | null {
  return readSavedComparisons(storage).find((item) => item.id === id) ?? null;
}

export function deleteSavedComparison(storage: KeyValueStorage | null, id: string): SavedComparison[] | null {
  if (!storage) return null;
  const next = readSavedComparisons(storage).filter((item) => item.id !== id);
  try {
    storage.setItem(SAVED_KEY, JSON.stringify(next));
    emitRecords();
    return next;
  } catch {
    return null;
  }
}

export function displayTripForSavedResult(result: ComparisonResult): ValidatedTrip {
  return {
    mode: "quick",
    origin: result.origin,
    destination: result.destination,
    tripType: "oneway",
    departDate: "1970-01-01",
    returnDate: null,
    travellerCount: 1,
    adults: 1,
    children: 0,
    flexibleDates: false,
    dateWindow: "",
    nearbyAirports: false,
    cabin: "any",
    notes: "",
    cashPriceCents: Math.round(result.cashFareEuros * 100),
    pointsRequired: result.pointsRequired,
    taxesAndFeesCents: Math.round(result.redemptionTaxesFeesEuros * 100),
  };
}

export function formatSavedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "an unknown time";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function newRecordId(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === "function") return cryptoApi.randomUUID();
  return `saved-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function parseWallet(raw: string | null): WalletEntry[] {
  if (!raw) return [];
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) return [];
  const byId = new Map<string, WalletEntry>();
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<WalletEntry>;
    if (typeof row.programId !== "string" || !loyaltyProgramById(row.programId)) continue;
    if (typeof row.balance !== "number" || !Number.isInteger(row.balance) || row.balance < 0 || row.balance > MAX_POINTS) {
      continue;
    }
    byId.set(row.programId, { programId: row.programId, balance: row.balance });
  }
  return [...byId.values()].sort((a, b) => a.programId.localeCompare(b.programId));
}

function parseSavedComparisons(raw: string | null): SavedComparison[] {
  if (!raw) return [];
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) return [];
  const records: SavedComparison[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<SavedComparison>;
    if (typeof row.id !== "string" || row.id.trim() === "") continue;
    if (typeof row.savedAt !== "string" || !normalizeTimestamp(row.savedAt)) continue;
    const result = parseComparisonResponse(row.result);
    if (!result) continue;
    records.push({ id: row.id.trim(), savedAt: row.savedAt, result });
  }
  return records.slice(0, MAX_SAVED);
}

function normalizeTimestamp(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}
