import { formatEurFromCents, formatPoints } from "./money";
import type { ValidatedTrip } from "./trip";

export type ComparisonRequest = {
  origin: string;
  destination: string;
  cashFareEuros: number;
  pointsRequired: number;
  redemptionTaxesFeesEuros: number;
};

export type ComparisonResult = {
  origin: string;
  destination: string;
  cashFareEuros: number;
  pointsRequired: number;
  redemptionTaxesFeesEuros: number;
  estimatedSavingsEuros: number;
  estimatedSavingsPercent: number | null;
  appearsWorthwhile: boolean;
  explanation: string;
};

export class ComparisonRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ComparisonRequestError";
  }
}

export const API_RESULT_NOTES = [
  "The euros, percentage, and worthwhile result come from the comparison service for the amounts you entered.",
  "A percentage is shown only when the service returns one. A zero cash fare does not produce a percentage.",
  "A negative result means the redemption asks for more cash than the fare. It is not money saved.",
  "This comparison does not give points a euro price.",
  "The result is not a live fare, an award seat, or a booking confirmation.",
] as const;

export function apiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").trim().replace(/\/$/, "");
}

export function shouldStartComparison(inFlight: boolean): boolean {
  return !inFlight;
}

export function toComparisonRequest(trip: ValidatedTrip): ComparisonRequest {
  return {
    origin: trip.origin,
    destination: trip.destination,
    cashFareEuros: trip.cashPriceCents / 100,
    pointsRequired: trip.pointsRequired,
    redemptionTaxesFeesEuros: trip.taxesAndFeesCents / 100,
  };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function parseComparisonResponse(value: unknown): ComparisonResult | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const percent = row.estimatedSavingsPercent;
  const percentOk = percent === undefined || percent === null || isFiniteNumber(percent);
  if (
    !percentOk ||
    typeof row.origin !== "string" ||
    typeof row.destination !== "string" ||
    !isFiniteNumber(row.cashFareEuros) ||
    !isFiniteNumber(row.pointsRequired) ||
    !Number.isInteger(row.pointsRequired) ||
    row.pointsRequired < 0 ||
    !isFiniteNumber(row.redemptionTaxesFeesEuros) ||
    !isFiniteNumber(row.estimatedSavingsEuros) ||
    typeof row.appearsWorthwhile !== "boolean" ||
    typeof row.explanation !== "string" ||
    row.explanation.trim() === ""
  ) {
    return null;
  }

  return {
    origin: row.origin,
    destination: row.destination,
    cashFareEuros: row.cashFareEuros,
    pointsRequired: row.pointsRequired,
    redemptionTaxesFeesEuros: row.redemptionTaxesFeesEuros,
    estimatedSavingsEuros: row.estimatedSavingsEuros,
    estimatedSavingsPercent: percent == null ? null : percent,
    appearsWorthwhile: row.appearsWorthwhile,
    explanation: row.explanation.trim(),
  };
}

export function formatApiEuros(euros: number): string {
  return formatEurFromCents(Math.round(euros * 100));
}

export function formatApiPercent(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.round(value * 100) / 100;
  const absolute = Math.abs(rounded);
  const body = Number.isInteger(absolute) ? String(absolute) : absolute.toFixed(2);
  return rounded < 0 ? `−${body}%` : `${body}%`;
}

export function comparisonFigureLabel(result: ComparisonResult): string {
  if (result.estimatedSavingsEuros < 0) return "Extra cash due";
  if (result.estimatedSavingsEuros > 0) return "Estimated savings";
  return "Euro difference";
}

export function comparisonHeading(result: ComparisonResult): string {
  if (!result.appearsWorthwhile && result.estimatedSavingsEuros <= 0) {
    return result.estimatedSavingsEuros < 0 ? "Points ask for more cash." : "The euros due match.";
  }
  if (!result.appearsWorthwhile) return "This does not appear worthwhile.";
  if (result.estimatedSavingsEuros > 0) return "Points cost less cash.";
  if (result.estimatedSavingsEuros < 0) return "Points ask for more cash.";
  return "The euros due match.";
}

export function comparisonBadge(result: ComparisonResult): string {
  return result.appearsWorthwhile ? "Worthwhile" : "Not worthwhile";
}

export function comparisonDifferenceNote(result: ComparisonResult): string {
  if (result.estimatedSavingsEuros < 0) return "More cash than the fare";
  if (result.estimatedSavingsEuros > 0) return "Less cash than the fare";
  return "Same euros due";
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

export function comparisonErrorMessage(error: unknown): string {
  if (error instanceof ComparisonRequestError) return error.message;
  return "The comparison service could not be reached. Nothing was booked. Try again.";
}

type ComparisonFetch = (url: string, init?: RequestInit) => Promise<Response>;

export async function postComparison(
  request: ComparisonRequest,
  options: { signal?: AbortSignal; fetchImpl?: ComparisonFetch; baseUrl?: string } = {},
): Promise<ComparisonResult> {
  const baseUrl = (options.baseUrl ?? apiBaseUrl()).replace(/\/$/, "");
  if (!baseUrl) {
    throw new ComparisonRequestError("The comparison service address is not configured.");
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  let response: Response;
  try {
    response = await fetchImpl(`${baseUrl}/api/comparisons`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(request),
      signal: options.signal,
    });
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw new ComparisonRequestError(
      "The comparison service could not be reached. Nothing was booked. Try again.",
    );
  }

  if (!response.ok) {
    throw new ComparisonRequestError(
      "The comparison service could not make this estimate. Nothing was booked. Try again.",
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ComparisonRequestError("The comparison service returned a response that could not be read.");
  }

  const parsed = parseComparisonResponse(payload);
  if (!parsed) {
    throw new ComparisonRequestError("The comparison service returned a response that could not be read.");
  }
  return parsed;
}

export function formatApiPoints(value: number): string {
  return formatPoints(value);
}
