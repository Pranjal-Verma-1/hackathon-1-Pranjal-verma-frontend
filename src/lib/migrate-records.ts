import { publicAuthMessage } from "./auth";
import {
  insertAccountBalance,
  insertAccountComparison,
  listAccountBalances,
  listAllAccountComparisons,
  type CloudClient,
} from "./cloud-records";
import { loyaltyProgramById } from "./loyalty";
import {
  browserStorage,
  readSavedComparisons,
  readWallet,
  subscribeRecords,
  type KeyValueStorage,
  type SavedComparison,
  type WalletEntry,
} from "./local-records";

const ACCOUNT_COMPARISON_LIMIT = 30;

export type LegacyMigrationPlan = {
  balances: WalletEntry[];
  comparisons: SavedComparison[];
};

export type MigrationReport = {
  copiedBalances: number;
  copiedComparisons: number;
  alreadyBalances: number;
  alreadyComparisons: number;
  conflicts: string[];
  failures: string[];
  skipped: string[];
};

export type MigrationWriter = {
  load(): Promise<LegacyMigrationPlan>;
  insertBalance(entry: WalletEntry): Promise<void>;
  insertComparison(record: SavedComparison): Promise<void>;
};

export function legacyMigrationPlan(storage: KeyValueStorage | null): LegacyMigrationPlan {
  return {
    balances: readWallet(storage),
    comparisons: readSavedComparisons(storage),
  };
}

export function accountMigrationWriter(client: CloudClient): MigrationWriter {
  return {
    async load() {
      const [balances, comparisons] = await Promise.all([
        listAccountBalances(client),
        listAllAccountComparisons(client),
      ]);
      return { balances, comparisons };
    },
    async insertBalance(entry) {
      await insertAccountBalance(client, entry.programId, entry.balance);
    },
    async insertComparison(record) {
      await insertAccountComparison(client, record);
    },
  };
}

export async function migrateLegacyRecords(writer: MigrationWriter, plan: LegacyMigrationPlan): Promise<MigrationReport> {
  const account = await writer.load();
  const report: MigrationReport = {
    copiedBalances: 0,
    copiedComparisons: 0,
    alreadyBalances: 0,
    alreadyComparisons: 0,
    conflicts: [],
    failures: [],
    skipped: [],
  };
  const balances = account.balances.map((entry) => ({ ...entry }));
  const comparisons = account.comparisons.map((record) => ({ ...record, result: { ...record.result } }));

  for (const entry of plan.balances) {
    const existing = balances.find((item) => item.programId === entry.programId);
    const label = loyaltyProgramById(entry.programId)?.name ?? entry.programId;
    if (existing && existing.balance === entry.balance) {
      report.alreadyBalances += 1;
      continue;
    }
    if (existing) {
      report.conflicts.push(`${label} already has a different balance on this account, so it was left unchanged.`);
      continue;
    }
    try {
      await writer.insertBalance(entry);
      balances.push(entry);
      report.copiedBalances += 1;
    } catch (error) {
      report.failures.push(failureLine(label, error));
    }
  }

  for (const record of plan.comparisons) {
    const label = `${record.result.origin} to ${record.result.destination}`;
    const existing = comparisons.find((item) => item.id === record.id);
    if (existing && sameComparison(existing, record)) {
      report.alreadyComparisons += 1;
      continue;
    }
    if (existing) {
      report.conflicts.push(`${label} is already saved on this account with different details, so it was left unchanged.`);
      continue;
    }
    if (comparisons.length >= ACCOUNT_COMPARISON_LIMIT) {
      report.skipped.push(`${label} was not copied because this account already has ${ACCOUNT_COMPARISON_LIMIT} saved comparisons.`);
      continue;
    }
    try {
      await writer.insertComparison(record);
      comparisons.push(record);
      report.copiedComparisons += 1;
    } catch (error) {
      report.failures.push(failureLine(label, error));
    }
  }

  return report;
}

export function migrationSummary(report: MigrationReport): string {
  const parts: string[] = [];
  const copied = report.copiedBalances + report.copiedComparisons;
  const already = report.alreadyBalances + report.alreadyComparisons;
  if (copied > 0) {
    parts.push(`Copied ${countPhrase(report.copiedBalances, "balance", "balances")} and ${countPhrase(report.copiedComparisons, "saved comparison", "saved comparisons")}.`);
  }
  if (already > 0) {
    parts.push(`Left ${countPhrase(report.alreadyBalances, "balance", "balances")} and ${countPhrase(report.alreadyComparisons, "saved comparison", "saved comparisons")} that were already on this account.`);
  }
  parts.push(...report.conflicts, ...report.skipped, ...report.failures);
  if (copied === 0 && already === 0 && report.conflicts.length === 0 && report.skipped.length === 0 && report.failures.length === 0) {
    parts.unshift("Nothing new was copied.");
  }
  parts.push("The browser copy is still preserved.");
  return parts.join(" ");
}

export function legacyMigrationServerSnapshot(): string {
  return JSON.stringify({ ready: false, balances: 0, comparisons: 0 });
}

let legacySnapshot = "";

export function legacyMigrationClientSnapshot(): string {
  const plan = legacyMigrationPlan(browserStorage());
  const next = JSON.stringify({ ready: true, balances: plan.balances.length, comparisons: plan.comparisons.length });
  if (next === legacySnapshot) return legacySnapshot;
  legacySnapshot = next;
  return legacySnapshot;
}

export function subscribeLegacyMigration(listener: () => void): () => void {
  return subscribeRecords(listener);
}

function sameComparison(left: SavedComparison, right: SavedComparison): boolean {
  return (
    left.id === right.id &&
    left.savedAt === right.savedAt &&
    left.result.origin === right.result.origin &&
    left.result.destination === right.result.destination &&
    left.result.cashFareEuros === right.result.cashFareEuros &&
    left.result.pointsRequired === right.result.pointsRequired &&
    left.result.redemptionTaxesFeesEuros === right.result.redemptionTaxesFeesEuros &&
    left.result.estimatedSavingsEuros === right.result.estimatedSavingsEuros &&
    left.result.estimatedSavingsPercent === right.result.estimatedSavingsPercent &&
    left.result.appearsWorthwhile === right.result.appearsWorthwhile &&
    left.result.explanation === right.result.explanation
  );
}

function failureLine(label: string, error: unknown): string {
  const raw = error instanceof Error ? error.message : "";
  return `${label} was not copied. ${publicAuthMessage(raw, "It could not be copied.")}`;
}

function countPhrase(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
