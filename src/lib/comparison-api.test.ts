import assert from "node:assert/strict";
import test from "node:test";
import {
  comparisonBadge,
  comparisonDifferenceNote,
  comparisonFigureLabel,
  comparisonHeading,
  formatApiEuros,
  formatApiPercent,
  parseComparisonResponse,
  postComparison,
  shouldStartComparison,
  toComparisonRequest,
  type ComparisonRequest,
} from "./comparison-api";
import { exampleDraft } from "./trip";
import { validateTrip } from "./validation";

const sampleRequest: ComparisonRequest = {
  origin: "MAD",
  destination: "BCN",
  cashFareEuros: 186,
  pointsRequired: 12500,
  redemptionTaxesFeesEuros: 42,
};

const worthwhile = {
  ...sampleRequest,
  estimatedSavingsEuros: 144,
  estimatedSavingsPercent: 77.42,
  appearsWorthwhile: true,
  explanation: "Redeeming points appears worthwhile. This is not a live price or a booking confirmation.",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("maps a validated trip onto the comparison API field names", () => {
  const parsed = validateTrip(exampleDraft("quick"));
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.deepEqual(toComparisonRequest(parsed.trip), sampleRequest);
});

test("posts one comparison and reads the returned estimate", async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const result = await postComparison(sampleRequest, {
    baseUrl: "http://localhost:3001",
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return jsonResponse(worthwhile);
    },
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.url, "http://localhost:3001/api/comparisons");
  assert.equal(calls[0]?.init?.method, "POST");
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), sampleRequest);
  assert.equal(result.estimatedSavingsEuros, 144);
  assert.equal(result.estimatedSavingsPercent, 77.42);
  assert.equal(result.appearsWorthwhile, true);
  assert.match(result.explanation, /not a live price/i);
});

test("treats a null or omitted percentage as unavailable", () => {
  const omitted = { ...worthwhile };
  delete (omitted as { estimatedSavingsPercent?: number }).estimatedSavingsPercent;
  const zeroFare = parseComparisonResponse({
    ...worthwhile,
    cashFareEuros: 0,
    estimatedSavingsEuros: 0,
    estimatedSavingsPercent: null,
    appearsWorthwhile: false,
  });
  const missing = parseComparisonResponse(omitted);

  assert.equal(zeroFare?.estimatedSavingsPercent, null);
  assert.equal(formatApiPercent(zeroFare?.estimatedSavingsPercent ?? null), null);
  assert.equal(missing?.estimatedSavingsPercent, null);
  assert.equal(comparisonFigureLabel(zeroFare!), "Euro difference");
  assert.equal(comparisonBadge(zeroFare!), "Not worthwhile");
});

test("keeps a negative saving visible and not worthwhile", () => {
  const result = parseComparisonResponse({
    ...worthwhile,
    cashFareEuros: 100,
    redemptionTaxesFeesEuros: 150,
    estimatedSavingsEuros: -50,
    estimatedSavingsPercent: -50,
    appearsWorthwhile: false,
    explanation: "The redemption does not appear worthwhile. The estimated result is -€50.00.",
  });
  assert.ok(result);
  if (!result) return;
  assert.equal(formatApiEuros(result.estimatedSavingsEuros), "−€50.00");
  assert.equal(formatApiPercent(result.estimatedSavingsPercent), "−50%");
  assert.equal(comparisonHeading(result), "Points ask for more cash.");
  assert.equal(comparisonBadge(result), "Not worthwhile");
  assert.equal(comparisonDifferenceNote(result), "More cash than the fare");
  assert.doesNotMatch(comparisonFigureLabel(result), /saved/i);
});

test("rejects a response that cannot be shown", async () => {
  await assert.rejects(
    () =>
      postComparison(sampleRequest, {
        baseUrl: "http://localhost:3001",
        fetchImpl: async () => jsonResponse({ estimatedSavingsEuros: 10 }, 200),
      }),
    /could not be read/,
  );
  await assert.rejects(
    () =>
      postComparison(sampleRequest, {
        baseUrl: "http://localhost:3001",
        fetchImpl: async () => jsonResponse({ message: "no" }, 503),
      }),
    /could not make this estimate/,
  );
});

test("does not start a second comparison while one is loading", () => {
  assert.equal(shouldStartComparison(false), true);
  assert.equal(shouldStartComparison(true), false);
});
