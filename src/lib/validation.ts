import { MAX_EURO_CENTS, MAX_POINTS, parseEuroToCents, parsePoints } from "./money";
import {
  CABIN_LABEL,
  EXAMPLE_FIGURES,
  exampleDraft,
  type Cabin,
  type TripDraft,
  type TripType,
  type ValidatedTrip,
} from "./trip";

export type FieldName =
  | "mode"
  | "origin"
  | "destination"
  | "tripType"
  | "departDate"
  | "returnDate"
  | "travellers"
  | "adults"
  | "children"
  | "dateWindow"
  | "cashPrice"
  | "points"
  | "taxes"
  | "notes"
  | "cabin";

export type FieldErrors = Partial<Record<FieldName, string>>;

export const FIELD_ORDER: FieldName[] = [
  "mode",
  "origin",
  "destination",
  "tripType",
  "departDate",
  "returnDate",
  "travellers",
  "adults",
  "children",
  "dateWindow",
  "cabin",
  "notes",
  "cashPrice",
  "points",
  "taxes",
];

export type ValidationResult =
  | { ok: true; trip: ValidatedTrip }
  | { ok: false; errors: FieldErrors };

const PLACE = /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'-]{1,39}$/;

function cleanPlace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function isRealIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

function readPartyCount(raw: string, min: number, max: number): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  if (!Number.isInteger(value) || value < min || value > max) return null;
  return value;
}

export function validateTrip(draft: TripDraft): ValidationResult {
  const errors: FieldErrors = {};

  if (draft.mode !== "quick" && draft.mode !== "full") {
    errors.mode = "Choose Quick Flight or Full Trip Plan.";
  }

  const origin = cleanPlace(draft.origin);
  const destination = cleanPlace(draft.destination);
  if (!origin) errors.origin = "Enter an origin city or airport code.";
  else if (!PLACE.test(origin)) {
    errors.origin = "Use 2 to 40 letters. Spaces, hyphens, and apostrophes are fine.";
  }
  if (!destination) errors.destination = "Enter a destination city or airport code.";
  else if (!PLACE.test(destination)) {
    errors.destination = "Use 2 to 40 letters. Spaces, hyphens, and apostrophes are fine.";
  }
  if (origin && destination && origin.toLowerCase() === destination.toLowerCase()) {
    errors.destination = "Origin and destination need to be different.";
  }

  const tripType: TripType | null =
    draft.tripType === "round" || draft.tripType === "oneway" ? draft.tripType : null;
  if (!tripType) errors.tripType = "Choose round trip or one way.";

  if (!draft.departDate) errors.departDate = "Choose a departure date.";
  else if (!isRealIsoDate(draft.departDate)) {
    errors.departDate = "That departure date is not a real calendar day.";
  }

  let returnDate: string | null = null;
  if (tripType === "round") {
    if (!draft.returnDate) errors.returnDate = "Choose a return date, or switch to one way.";
    else if (!isRealIsoDate(draft.returnDate)) {
      errors.returnDate = "That return date is not a real calendar day.";
    } else if (draft.departDate && draft.returnDate < draft.departDate) {
      errors.returnDate = "The return date has to be on or after the departure.";
    } else {
      returnDate = draft.returnDate;
    }
  }

  let travellerCount = 0;
  let adults = 0;
  let children = 0;
  if (draft.mode === "full") {
    const adultCount = readPartyCount(draft.adults, 1, 9);
    const childCount = readPartyCount(draft.children, 0, 8);
    if (adultCount === null) errors.adults = "Enter a whole number of adults from 1 to 9.";
    if (childCount === null) errors.children = "Enter a whole number of children from 0 to 8.";
    if (adultCount !== null && childCount !== null) {
      if (adultCount + childCount > 9) {
        errors.children = "Keep the whole party to 9 travellers.";
      } else {
        adults = adultCount;
        children = childCount;
        travellerCount = adultCount + childCount;
      }
    }
  } else if (draft.mode === "quick") {
    const count = readPartyCount(draft.travellers, 1, 9);
    if (count === null) errors.travellers = "Enter a whole number of travellers from 1 to 9.";
    else {
      travellerCount = count;
      adults = count;
    }
  }

  const dateWindow = draft.dateWindow.trim().replace(/\s+/g, " ");
  if (draft.mode === "full" && draft.flexibleDates && dateWindow.length > 40) {
    errors.dateWindow = "Keep the date window to 40 characters.";
  }

  const notes = draft.notes.trim();
  if (draft.mode === "full" && notes.length > 280) {
    errors.notes = "Keep the note to 280 characters.";
  }

  const cabin: Cabin | null = draft.cabin in CABIN_LABEL ? draft.cabin : null;
  if (!cabin) errors.cabin = "Choose a cabin from the list.";

  const cashPriceCents = parseEuroToCents(draft.cashPrice);
  if (cashPriceCents === null) {
    errors.cashPrice = draft.cashPrice.trim()
      ? "Use a euro amount with up to 2 decimals, from 0 to 100000."
      : "Enter the cash fare in euros.";
  } else if (cashPriceCents > MAX_EURO_CENTS) {
    errors.cashPrice = "Use a euro amount with up to 2 decimals, from 0 to 100000.";
  }

  const pointsRequired = parsePoints(draft.points);
  if (pointsRequired === null) {
    errors.points = draft.points.trim()
      ? "Use a whole number of points from 0 to 10000000."
      : "Enter the points the redemption requires. Use 0 if the quote has none.";
  } else if (pointsRequired > MAX_POINTS) {
    errors.points = "Use a whole number of points from 0 to 10000000.";
  }

  const taxesAndFeesCents = parseEuroToCents(draft.taxes);
  if (taxesAndFeesCents === null) {
    errors.taxes = draft.taxes.trim()
      ? "Use a euro amount with up to 2 decimals, from 0 to 100000."
      : "Enter the taxes and fees still due, or 0 if the quote has none.";
  } else if (taxesAndFeesCents > MAX_EURO_CENTS) {
    errors.taxes = "Use a euro amount with up to 2 decimals, from 0 to 100000.";
  }

  if (
    errors.mode ||
    errors.origin ||
    errors.destination ||
    errors.tripType ||
    errors.departDate ||
    errors.returnDate ||
    errors.travellers ||
    errors.adults ||
    errors.children ||
    errors.dateWindow ||
    errors.notes ||
    errors.cabin ||
    cashPriceCents === null ||
    cashPriceCents > MAX_EURO_CENTS ||
    pointsRequired === null ||
    pointsRequired > MAX_POINTS ||
    taxesAndFeesCents === null ||
    taxesAndFeesCents > MAX_EURO_CENTS ||
    !tripType ||
    !cabin ||
    !draft.mode
  ) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    trip: {
      mode: draft.mode,
      origin,
      destination,
      tripType,
      departDate: draft.departDate,
      returnDate,
      travellerCount,
      adults,
      children,
      flexibleDates: draft.mode === "full" ? draft.flexibleDates : false,
      dateWindow: draft.mode === "full" && draft.flexibleDates ? dateWindow : "",
      nearbyAirports: draft.mode === "full" ? draft.nearbyAirports : false,
      cabin: draft.mode === "full" ? cabin : "any",
      notes: draft.mode === "full" ? notes : "",
      cashPriceCents,
      pointsRequired,
      taxesAndFeesCents,
    },
  };
}

export function usesExampleFigures(trip: ValidatedTrip): boolean {
  const sample = validateTrip(exampleDraft(trip.mode));
  if (!sample.ok) return false;
  return (
    trip.cashPriceCents === sample.trip.cashPriceCents &&
    trip.pointsRequired === sample.trip.pointsRequired &&
    trip.taxesAndFeesCents === sample.trip.taxesAndFeesCents &&
    sample.trip.cashPriceCents === Number(EXAMPLE_FIGURES.cashPrice) * 100
  );
}
