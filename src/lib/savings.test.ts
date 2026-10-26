import assert from "node:assert/strict";
import { test } from "node:test";
import { formatEurFromCents, formatPercent, formatValuePerPoint, parseEuroToCents, parsePoints } from "./money";
import {
  compareRedemption,
  comparisonHeadline,
  comparisonNotes,
  type SavingsInput,
} from "./savings";

test("parses euro amounts with a dot or a comma", () => {
  assert.equal(parseEuroToCents("186"), 18600);
  assert.equal(parseEuroToCents("186.5"), 18650);
  assert.equal(parseEuroToCents("186,50"), 18650);
  assert.equal(parseEuroToCents("0"), 0);
  assert.equal(parseEuroToCents(" 42 "), 4200);
});

test("rejects missing, signed, and over-precise money", () => {
  assert.equal(parseEuroToCents(""), null);
  assert.equal(parseEuroToCents("-5"), null);
  assert.equal(parseEuroToCents("abc"), null);
  assert.equal(parseEuroToCents("1.234"), null);
  assert.equal(parseEuroToCents("1000000"), null);
});

test("parses whole point totals and rejects decimals", () => {
  assert.equal(parsePoints("12500"), 12500);
  assert.equal(parsePoints("12 500"), 12500);
  assert.equal(parsePoints("0"), 0);
  assert.equal(parsePoints(""), null);
  assert.equal(parsePoints("12.500"), null);
  assert.equal(parsePoints("-1"), null);
});

test("estimates a positive saving from the example figures", () => {
  const result = compareRedemption({
    cashPriceCents: 18600,
    taxesAndFeesCents: 4200,
    pointsRequired: 12500,
  });
  assert.equal(result.status, "ok");
  if (result.status !== "ok") return;
  assert.equal(result.netSavingsCents, 14400);
  assert.equal(result.outcome, "saves");
  assert.ok(Math.abs((result.savingsPercent ?? 0) - (14400 / 18600) * 100) < 1e-9);
  assert.ok(Math.abs((result.valuePerPointEur ?? 0) - 144 / 12500) < 1e-12);
  assert.match(comparisonHeadline(result), /€144\.00 less in cash/);
  assert.equal(comparisonNotes(result).length, 0);
});

test("shows a negative saving when taxes and fees exceed the cash fare", () => {
  const result = compareRedemption({
    cashPriceCents: 10000,
    taxesAndFeesCents: 12000,
    pointsRequired: 10000,
  });
  assert.equal(result.status, "ok");
  if (result.status !== "ok") return;
  assert.equal(result.netSavingsCents, -2000);
  assert.equal(result.outcome, "costs-more");
  assert.equal(result.savingsPercent, -20);
  assert.equal(result.valuePerPointEur, -0.002);
  assert.match(comparisonHeadline(result), /€20\.00 more in cash/);
  assert.doesNotMatch(comparisonHeadline(result), /not shown|unavailable|hidden/i);
});

test("treats equal cash due as an even result", () => {
  const result = compareRedemption({
    cashPriceCents: 5000,
    taxesAndFeesCents: 5000,
    pointsRequired: 8000,
  });
  assert.equal(result.status, "ok");
  if (result.status !== "ok") return;
  assert.equal(result.outcome, "even");
  assert.equal(result.netSavingsCents, 0);
  assert.equal(result.savingsPercent, 0);
  assert.equal(result.valuePerPointEur, 0);
  assert.match(comparisonHeadline(result), /€0\.00/);
});

test("omits the percentage when the cash fare is zero", () => {
  const result = compareRedemption({
    cashPriceCents: 0,
    taxesAndFeesCents: 500,
    pointsRequired: 0,
  });
  assert.equal(result.status, "ok");
  if (result.status !== "ok") return;
  assert.equal(result.netSavingsCents, -500);
  assert.equal(result.savingsPercent, null);
  assert.equal(result.valuePerPointEur, null);
  assert.equal(result.outcome, "costs-more");
  assert.deepEqual(comparisonNotes(result), [
    "A savings percentage is not shown because the cash fare is zero.",
    "A value per point is not shown because the redemption uses 0 points.",
  ]);
});

test("keeps a euro saving when points are zero and the cash fare is not", () => {
  const result = compareRedemption({
    cashPriceCents: 9000,
    taxesAndFeesCents: 1500,
    pointsRequired: 0,
  });
  assert.equal(result.status, "ok");
  if (result.status !== "ok") return;
  assert.equal(result.netSavingsCents, 7500);
  assert.equal(result.valuePerPointEur, null);
  assert.equal(result.savingsPercent, (7500 / 9000) * 100);
});

test("rejects invalid numbers without throwing", () => {
  const cases: SavingsInput[] = [
    { cashPriceCents: Number.NaN, taxesAndFeesCents: 0, pointsRequired: 0 },
    { cashPriceCents: 1.5, taxesAndFeesCents: 0, pointsRequired: 10 },
    { cashPriceCents: -1, taxesAndFeesCents: 0, pointsRequired: 10 },
    { cashPriceCents: 100, taxesAndFeesCents: Number.POSITIVE_INFINITY, pointsRequired: 10 },
    { cashPriceCents: 100, taxesAndFeesCents: 0, pointsRequired: -5 },
    {} as SavingsInput,
  ];
  for (const input of cases) {
    assert.doesNotThrow(() => compareRedemption(input));
    const result = compareRedemption(input);
    assert.equal(result.status, "invalid");
  }
});

test("formats signed euros, percentages, and small per-point values", () => {
  assert.equal(formatEurFromCents(14400), "€144.00");
  assert.equal(formatEurFromCents(-2000), "−€20.00");
  assert.equal(formatEurFromCents(0), "€0.00");
  assert.equal(formatPercent((14400 / 18600) * 100), "77.4%");
  assert.equal(formatPercent(-20), "−20%");
  assert.equal(formatValuePerPoint(144 / 12500), "€0.0115");
  assert.equal(formatValuePerPoint(-0.002), "−€0.0020");
  assert.equal(formatValuePerPoint(1.2), "€1.20");
});
