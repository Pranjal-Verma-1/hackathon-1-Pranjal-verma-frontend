import { formatEurFromCents, formatPercent, formatValuePerPoint } from "./money";

/**
 * Illustrative comparison of a cash fare with a points redemption.
 *
 * Estimated savings = cash fare − taxes and fees still due.
 * Value per point = estimated savings ÷ points required.
 * Points are treated as already earned.
 */
export const SAVINGS_ASSUMPTIONS = [
  "Estimated savings equal the cash fare minus the taxes and fees still due on the redemption.",
  "Points are treated as already earned. The estimate does not subtract a cost of acquiring them.",
  "Value per point equals the estimated savings divided by the points required.",
  "A negative saving means the redemption asks for more cash than the fare you entered.",
  "A percentage is omitted when the cash fare is zero, because that would divide by zero.",
  "A value per point is omitted when the redemption uses zero points.",
  "Amounts cover the whole trip, in euros. Displayed money is rounded to the nearest cent, and a value per point under €1 is shown to four decimals.",
  "Flexible dates, nearby airports, cabin, and notes are recorded for your checklist. They do not change the arithmetic.",
  "The amounts are the ones you entered. They are not a live fare, an award seat, or a booking.",
] as const;

export type SavingsInput = {
  cashPriceCents: number;
  pointsRequired: number;
  taxesAndFeesCents: number;
};

export type SavingsIssueCode =
  | "cash-invalid"
  | "cash-negative"
  | "points-invalid"
  | "points-negative"
  | "taxes-invalid"
  | "taxes-negative";

export type SavingsOutcome = "saves" | "costs-more" | "even";

export type SavingsComparison = {
  status: "ok";
  cashPriceCents: number;
  pointsRequired: number;
  taxesAndFeesCents: number;
  netSavingsCents: number;
  savingsPercent: number | null;
  valuePerPointEur: number | null;
  outcome: SavingsOutcome;
};

export type SavingsFailure = {
  status: "invalid";
  issues: SavingsIssueCode[];
};

const ISSUE_TEXT: Record<SavingsIssueCode, string> = {
  "cash-invalid": "The cash fare has to be a whole number of cents.",
  "cash-negative": "The cash fare cannot be negative.",
  "points-invalid": "Points have to be a whole number.",
  "points-negative": "Points cannot be negative.",
  "taxes-invalid": "Taxes and fees have to be a whole number of cents.",
  "taxes-negative": "Taxes and fees cannot be negative.",
};

export function savingsIssueMessage(code: SavingsIssueCode): string {
  return ISSUE_TEXT[code];
}

function readCents(
  value: unknown,
  invalid: SavingsIssueCode,
  negative: SavingsIssueCode,
): SavingsIssueCode | null {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) return invalid;
  if (value < 0) return negative;
  return null;
}

export function compareRedemption(input: SavingsInput): SavingsComparison | SavingsFailure {
  const issues = [
    readCents(input?.cashPriceCents, "cash-invalid", "cash-negative"),
    readCents(input?.pointsRequired, "points-invalid", "points-negative"),
    readCents(input?.taxesAndFeesCents, "taxes-invalid", "taxes-negative"),
  ].filter((issue): issue is SavingsIssueCode => issue !== null);

  if (issues.length > 0) return { status: "invalid", issues };

  const netSavingsCents = input.cashPriceCents - input.taxesAndFeesCents;
  const savingsPercent =
    input.cashPriceCents === 0 ? null : (netSavingsCents / input.cashPriceCents) * 100;
  const valuePerPointEur =
    input.pointsRequired === 0 ? null : netSavingsCents / 100 / input.pointsRequired;
  const outcome: SavingsOutcome =
    netSavingsCents > 0 ? "saves" : netSavingsCents < 0 ? "costs-more" : "even";

  return {
    status: "ok",
    cashPriceCents: input.cashPriceCents,
    pointsRequired: input.pointsRequired,
    taxesAndFeesCents: input.taxesAndFeesCents,
    netSavingsCents,
    savingsPercent,
    valuePerPointEur,
    outcome,
  };
}

export function comparisonHeadline(result: SavingsComparison): string {
  const amount = formatEurFromCents(Math.abs(result.netSavingsCents));
  if (result.outcome === "saves") {
    return `The redemption costs ${amount} less in cash than the fare you entered.`;
  }
  if (result.outcome === "costs-more") {
    return `The redemption costs ${amount} more in cash than the fare you entered.`;
  }
  return `The euros due match, so the estimated saving is ${formatEurFromCents(0)}.`;
}

export function comparisonNotes(result: SavingsComparison): string[] {
  const notes: string[] = [];
  if (result.savingsPercent === null) {
    notes.push("A savings percentage is not shown because the cash fare is zero.");
  }
  if (result.valuePerPointEur === null) {
    notes.push("A value per point is not shown because the redemption uses 0 points.");
  }
  return notes;
}

export function formatSavingsPercent(value: number | null): string {
  return value === null ? "Not available" : formatPercent(value);
}

export function formatPerPoint(value: number | null): string {
  return value === null ? "Not available" : formatValuePerPoint(value);
}
