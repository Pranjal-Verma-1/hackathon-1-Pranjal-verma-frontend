import { formatApiEuros, formatApiPercent, type ComparisonResult } from "./comparison-api";
import { listAccountBalances, listAccountComparisons, type CloudClient } from "./cloud-records";
import type { SavedCloudView, WalletCloudView } from "./cloud-browser";
import { loyaltyProgramById } from "./loyalty";
import type { SavedComparison, WalletEntry } from "./local-records";
import { formatPoints } from "./money";

export type SavingsSort = "savings-desc" | "savings-asc";

export type ExplorerFilters = {
  origin: string;
  destination: string;
  sort: SavingsSort;
};

export type ExplorerMetrics = {
  count: number;
  totalEstimatedSavingsEuros: number;
  best: SavedComparison | null;
  averageSavingsPercent: number | null;
  definedPercentCount: number;
};

export type FareBar = {
  id: string;
  route: string;
  cashFareEuros: number;
  redemptionTaxesFeesEuros: number;
};

export type PointsReadiness =
  | { status: "undetermined"; message: string }
  | {
      status: "matched";
      programId: string;
      programName: string;
      unit: string;
      balance: number;
      pointsRequired: number;
      difference: number;
      position: "shortfall" | "surplus" | "exact";
    };

export type ExplorerAccountState =
  | { status: "loading" }
  | { status: "signed-out"; message: string }
  | { status: "unavailable"; message: string }
  | { status: "ready"; records: SavedComparison[]; balances: WalletEntry[] };

const UNDETERMINED =
  "This saved comparison does not name a loyalty program, so the wallet balance cannot be determined.";

export function uniqueComparisons(records: SavedComparison[]): SavedComparison[] {
  const seen = new Set<string>();
  const unique: SavedComparison[] = [];
  for (const record of records) {
    const id = record.id.trim();
    if (id === "" || seen.has(id)) continue;
    seen.add(id);
    unique.push(record);
  }
  return unique;
}

export function explorerMetrics(records: SavedComparison[]): ExplorerMetrics {
  const unique = uniqueComparisons(records);
  let best: SavedComparison | null = null;
  let total = 0;
  const percents: number[] = [];
  for (const record of unique) {
    total += record.result.estimatedSavingsEuros;
    const percent = record.result.estimatedSavingsPercent;
    if (percent !== null && Number.isFinite(percent)) percents.push(percent);
    if (!best || record.result.estimatedSavingsEuros > best.result.estimatedSavingsEuros) best = record;
  }
  const average = percents.length === 0 ? null : percents.reduce((sum, value) => sum + value, 0) / percents.length;
  return {
    count: unique.length,
    totalEstimatedSavingsEuros: total,
    best,
    averageSavingsPercent: average,
    definedPercentCount: percents.length,
  };
}

export function filterComparisons(records: SavedComparison[], filters: ExplorerFilters): SavedComparison[] {
  const origin = filters.origin.trim().toLocaleLowerCase();
  const destination = filters.destination.trim().toLocaleLowerCase();
  const filtered = uniqueComparisons(records).filter((record) => {
    const originOk = origin === "" || record.result.origin.toLocaleLowerCase().includes(origin);
    const destinationOk = destination === "" || record.result.destination.toLocaleLowerCase().includes(destination);
    return originOk && destinationOk;
  });
  return filtered.sort((left, right) => {
    const delta = left.result.estimatedSavingsEuros - right.result.estimatedSavingsEuros;
    if (delta !== 0) return filters.sort === "savings-asc" ? delta : -delta;
    return left.id.localeCompare(right.id);
  });
}

export function fareChartRows(records: SavedComparison[]): FareBar[] {
  return uniqueComparisons(records).map((record) => ({
    id: record.id,
    route: `${record.result.origin} to ${record.result.destination}`,
    cashFareEuros: record.result.cashFareEuros,
    redemptionTaxesFeesEuros: record.result.redemptionTaxesFeesEuros,
  }));
}

export function chartScale(rows: FareBar[]): number {
  return rows.reduce((max, row) => Math.max(max, row.cashFareEuros, row.redemptionTaxesFeesEuros), 0);
}

export function barWidthPercent(value: number, max: number): number {
  if (!Number.isFinite(value) || value <= 0 || !Number.isFinite(max) || max <= 0) return 0;
  return Math.min(100, (value / max) * 100);
}

export function pointsReadiness(record: SavedComparison, balances: WalletEntry[], programId?: string | null): PointsReadiness {
  return balanceAgainstProgram(programId, record.result.pointsRequired, balances);
}

const BALANCE_COMPARISON_NOTE =
  "This compares a wallet balance with the points entered for this comparison. It does not mean those points can be transferred or redeemed for this trip.";

export type ResultBalanceComparison =
  | { status: "undetermined"; message: string }
  | { status: "signed-out"; message: string }
  | { status: "loading" }
  | { status: "unavailable"; message: string }
  | {
      status: "ready";
      programName: string;
      balance: number;
      unit: string;
      pointsRequired: number;
      shortfall: number | null;
      note: string;
    };

export function resultBalanceComparison(
  programId: string,
  pointsRequired: number,
  wallet: WalletCloudView,
): ResultBalanceComparison {
  if (programId.trim() === "") return { status: "undetermined", message: UNDETERMINED };
  if (wallet.status === "signed-out") {
    return { status: "signed-out", message: "Sign in to compare a wallet balance with these points." };
  }
  if (wallet.status === "loading") return { status: "loading" };
  if (wallet.status === "unavailable") return { status: "unavailable", message: wallet.message };
  const readiness = balanceAgainstProgram(programId, pointsRequired, wallet.entries);
  if (readiness.status === "undetermined") return readiness;
  return {
    status: "ready",
    programName: readiness.programName,
    balance: readiness.balance,
    unit: readiness.unit,
    pointsRequired: readiness.pointsRequired,
    shortfall: readiness.position === "shortfall" ? Math.abs(readiness.difference) : null,
    note: BALANCE_COMPARISON_NOTE,
  };
}

function balanceAgainstProgram(programId: string | null | undefined, pointsRequired: number, balances: WalletEntry[]): PointsReadiness {
  const id = programId?.trim() ?? "";
  if (id === "") return { status: "undetermined", message: UNDETERMINED };
  const program = loyaltyProgramById(id);
  if (!program) return { status: "undetermined", message: UNDETERMINED };
  const matches = balances.filter((entry) => entry.programId === id);
  if (matches.length !== 1) {
    const reason =
      matches.length === 0
        ? `${program.name} is named for this comparison, and this account has no balance for it, so the shortfall cannot be determined.`
        : `More than one balance is stored for ${program.name}, so the shortfall cannot be determined.`;
    return { status: "undetermined", message: reason };
  }
  const balance = matches[0]?.balance ?? 0;
  const difference = balance - pointsRequired;
  const position = difference < 0 ? "shortfall" : difference > 0 ? "surplus" : "exact";
  return {
    status: "matched",
    programId: id,
    programName: program.name,
    unit: program.unit,
    balance,
    pointsRequired,
    difference,
    position,
  };
}

export function pointsReadinessText(readiness: PointsReadiness): string {
  if (readiness.status === "undetermined") return readiness.message;
  const available = `${formatPoints(readiness.balance)} ${readiness.unit}`;
  if (readiness.position === "exact") {
    return `${readiness.programName}: ${available} available, the same as the points required.`;
  }
  const gap = `${formatPoints(Math.abs(readiness.difference))} ${readiness.unit}`;
  if (readiness.position === "shortfall") {
    return `${readiness.programName}: ${available} available, ${gap} short of the points required.`;
  }
  return `${readiness.programName}: ${available} available, ${gap} above the points required.`;
}

export function tripSummaryText(record: SavedComparison): string {
  const result = record.result;
  const percent = formatApiPercent(result.estimatedSavingsPercent);
  return [
    `${result.origin} to ${result.destination}`,
    `Cash fare: ${formatApiEuros(result.cashFareEuros)}`,
    `Points required: ${formatPoints(result.pointsRequired)}`,
    `Redemption taxes and fees: ${formatApiEuros(result.redemptionTaxesFeesEuros)}`,
    `Estimated savings: ${formatApiEuros(result.estimatedSavingsEuros)}`,
    `Estimated savings percentage: ${percent ?? "unavailable"}`,
    `Explanation: ${result.explanation}`,
    "Estimate from figures entered for this comparison. Not a live fare, an award seat, or a booking.",
  ].join("\n");
}

export function comparisonsToCsv(records: SavedComparison[]): string {
  const header = [
    "origin",
    "destination",
    "cash_fare_euros",
    "points_required",
    "redemption_taxes_fees_euros",
    "estimated_savings_euros",
    "estimated_savings_percent",
    "explanation",
    "saved_at",
  ];
  const lines = uniqueComparisons(records).map((record) => {
    const result: ComparisonResult = record.result;
    const percent = result.estimatedSavingsPercent === null ? "unavailable" : String(result.estimatedSavingsPercent);
    return [
      result.origin,
      result.destination,
      String(result.cashFareEuros),
      String(result.pointsRequired),
      String(result.redemptionTaxesFeesEuros),
      String(result.estimatedSavingsEuros),
      percent,
      result.explanation,
      record.savedAt,
    ].map(csvCell).join(",");
  });
  return [header.join(","), ...lines].join("\r\n");
}

export function summaryHtmlDocument(records: SavedComparison[]): string {
  const articles = uniqueComparisons(records)
    .map((record) => `<article><pre>${escapeHtml(tripSummaryText(record))}</pre></article>`)
    .join("");
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>A Una Milla trip summary</title></head><body>${articles}</body></html>`;
}

export function explorerAccountState(saved: SavedCloudView, wallet: WalletCloudView): ExplorerAccountState {
  if (saved.status === "signed-out" || wallet.status === "signed-out") {
    const message = saved.status === "signed-out" ? saved.message : wallet.message;
    return { status: "signed-out", message };
  }
  if (saved.status === "unavailable" || wallet.status === "unavailable") {
    const message = saved.status === "unavailable" ? saved.message : wallet.message;
    return { status: "unavailable", message };
  }
  if (saved.status === "loading" || wallet.status === "loading") return { status: "loading" };
  return { status: "ready", records: saved.records, balances: wallet.entries };
}

export async function loadExplorerRecords(client: CloudClient): Promise<{ records: SavedComparison[]; balances: WalletEntry[] }> {
  const [records, balances] = await Promise.all([listAccountComparisons(client), listAccountBalances(client)]);
  return { records, balances };
}

function csvCell(value: string): string {
  let text = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (/^[=+\-@\t]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
