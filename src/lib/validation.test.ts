import assert from "node:assert/strict";
import { test } from "node:test";
import { draftForMode, emptyDraft, exampleDraft, routeSummary } from "./trip";
import { usesExampleFigures, validateTrip } from "./validation";

test("accepts the quick-flight example and prices it in cents", () => {
  const result = validateTrip(exampleDraft("quick"));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.trip.cashPriceCents, 18600);
  assert.equal(result.trip.pointsRequired, 12500);
  assert.equal(result.trip.taxesAndFeesCents, 4200);
  assert.equal(result.trip.travellerCount, 1);
  assert.equal(result.trip.returnDate, "2026-11-16");
  assert.match(routeSummary(result.trip), /MAD to BCN/);
  assert.equal(usesExampleFigures(result.trip), true);
});

test("accepts the full trip example with a split party", () => {
  const result = validateTrip(exampleDraft("full"));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.trip.travellerCount, 3);
  assert.equal(result.trip.adults, 2);
  assert.equal(result.trip.children, 1);
  assert.equal(result.trip.flexibleDates, true);
  assert.equal(result.trip.nearbyAirports, true);
  assert.match(routeSummary(result.trip), /2 adults, 1 child/);
});

test("reports missing prices and an identical origin and destination", () => {
  const draft = exampleDraft("quick");
  draft.destination = "mad";
  draft.cashPrice = "";
  draft.points = "";
  draft.taxes = "";
  const result = validateTrip(draft);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.errors.destination ?? "", /different/);
  assert.match(result.errors.cashPrice ?? "", /cash fare/);
  assert.match(result.errors.points ?? "", /points/);
  assert.match(result.errors.taxes ?? "", /taxes and fees/);
});

test("rejects a return before departure, then allows one way", () => {
  const draft = exampleDraft("quick");
  draft.returnDate = "2026-11-01";
  const round = validateTrip(draft);
  assert.equal(round.ok, false);
  if (round.ok) return;
  assert.match(round.errors.returnDate ?? "", /on or after/);

  draft.tripType = "oneway";
  draft.returnDate = "not-a-date";
  const oneWay = validateTrip(draft);
  assert.equal(oneWay.ok, true);
  if (!oneWay.ok) return;
  assert.equal(oneWay.trip.returnDate, null);
});

test("rejects zero, oversized, and non-numeric parties", () => {
  const quick = exampleDraft("quick");
  quick.travellers = "0";
  const zero = validateTrip(quick);
  assert.equal(zero.ok, false);
  if (!zero.ok) assert.match(zero.errors.travellers ?? "", /1 to 9/);

  quick.travellers = "10";
  const tooMany = validateTrip(quick);
  assert.equal(tooMany.ok, false);

  const full = exampleDraft("full");
  full.adults = "6";
  full.children = "4";
  const party = validateTrip(full);
  assert.equal(party.ok, false);
  if (!party.ok) assert.match(party.errors.children ?? "", /9 travellers/);
});

test("accepts zero cash and zero taxes, and a comma decimal", () => {
  const draft = exampleDraft("quick");
  draft.cashPrice = "0";
  draft.taxes = "0,5";
  draft.points = "0";
  const result = validateTrip(draft);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.trip.cashPriceCents, 0);
  assert.equal(result.trip.taxesAndFeesCents, 50);
  assert.equal(result.trip.pointsRequired, 0);
  assert.equal(usesExampleFigures(result.trip), false);
});

test("rejects negative money, point decimals, and an impossible date", () => {
  const draft = exampleDraft("quick");
  draft.cashPrice = "-1";
  draft.points = "12.500";
  draft.departDate = "2026-02-31";
  const result = validateTrip(draft);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.ok(result.errors.cashPrice);
  assert.ok(result.errors.points);
  assert.ok(result.errors.departDate);
});

test("requires a mode and caps notes", () => {
  const draft = exampleDraft("quick");
  draft.mode = null;
  draft.notes = "x".repeat(281);
  const result = validateTrip(draft);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.ok(result.errors.mode);
  assert.equal(result.errors.notes, undefined);

  const full = exampleDraft("full");
  full.notes = "x".repeat(281);
  const longNote = validateTrip(full);
  assert.equal(longNote.ok, false);
  if (!longNote.ok) assert.match(longNote.errors.notes ?? "", /280/);
});

test("maps quick travellers onto adults when full mode has no matching party", () => {
  const draft = emptyDraft();
  draft.mode = "quick";
  draft.origin = "MAD";
  draft.cashPrice = "186";
  draft.travellers = "4";
  const full = draftForMode(draft, "full");
  assert.equal(full.mode, "full");
  assert.equal(full.adults, "4");
  assert.equal(full.children, "0");
  assert.equal(full.origin, "MAD");
  assert.equal(full.cashPrice, "186");
});

test("maps adults plus children back to quick travellers", () => {
  const draft = exampleDraft("full");
  draft.notes = "Morning only";
  const quick = draftForMode(draft, "quick");
  assert.equal(quick.mode, "quick");
  assert.equal(quick.travellers, "3");
  assert.equal(quick.adults, "2");
  assert.equal(quick.children, "1");
  assert.equal(quick.notes, "Morning only");
  assert.equal(quick.cashPrice, "186");
});

test("keeps a full party breakdown that still adds up to the traveller count", () => {
  const draft = exampleDraft("full");
  const quick = draftForMode(draft, "quick");
  const full = draftForMode(quick, "full");
  assert.equal(full.travellers, "3");
  assert.equal(full.adults, "2");
  assert.equal(full.children, "1");
  assert.equal(full.flexibleDates, true);
});

test("replaces a stale party breakdown when the quick count has changed", () => {
  const draft = exampleDraft("full");
  const quick = draftForMode(draft, "quick");
  quick.travellers = "5";
  const full = draftForMode(quick, "full");
  assert.equal(full.adults, "5");
  assert.equal(full.children, "0");
  assert.equal(full.destination, "BCN");
});

test("leaves party fields unchanged when the entered count cannot be mapped", () => {
  const draft = emptyDraft();
  draft.mode = "quick";
  draft.travellers = "4.5";
  draft.adults = "2";
  draft.children = "1";
  const full = draftForMode(draft, "full");
  assert.equal(full.adults, "2");
  assert.equal(full.children, "1");

  full.adults = "nope";
  const quick = draftForMode(full, "quick");
  assert.equal(quick.travellers, "4.5");
});
