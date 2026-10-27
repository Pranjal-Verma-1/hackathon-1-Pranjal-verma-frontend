export type TripMode = "quick" | "full";
export type TripType = "round" | "oneway";
export type Cabin = "any" | "economy" | "premium" | "business";

export const CABIN_LABEL: Record<Cabin, string> = {
  any: "No preference",
  economy: "Economy",
  premium: "Premium economy",
  business: "Business",
};

export const EXAMPLE_FIGURES = {
  origin: "MAD",
  destination: "BCN",
  departDate: "2026-11-12",
  returnDate: "2026-11-16",
  cashPrice: "186",
  points: "12500",
  taxes: "42",
} as const;

export type TripDraft = {
  mode: TripMode | null;
  origin: string;
  destination: string;
  tripType: TripType;
  departDate: string;
  returnDate: string;
  travellers: string;
  adults: string;
  children: string;
  flexibleDates: boolean;
  dateWindow: string;
  nearbyAirports: boolean;
  cabin: Cabin;
  notes: string;
  cashPrice: string;
  points: string;
  taxes: string;
};

export type ValidatedTrip = {
  mode: TripMode;
  origin: string;
  destination: string;
  tripType: TripType;
  departDate: string;
  returnDate: string | null;
  travellerCount: number;
  adults: number;
  children: number;
  flexibleDates: boolean;
  dateWindow: string;
  nearbyAirports: boolean;
  cabin: Cabin;
  notes: string;
  cashPriceCents: number;
  pointsRequired: number;
  taxesAndFeesCents: number;
};

export function emptyDraft(): TripDraft {
  return {
    mode: null,
    origin: "",
    destination: "",
    tripType: "round",
    departDate: "",
    returnDate: "",
    travellers: "1",
    adults: "1",
    children: "0",
    flexibleDates: false,
    dateWindow: "",
    nearbyAirports: false,
    cabin: "any",
    notes: "",
    cashPrice: "",
    points: "",
    taxes: "",
  };
}

function wholeCount(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  return Number(trimmed);
}

/** Keep route, dates, and prices. Carry the party across Quick Flight and Full Trip Plan. */
export function draftForMode(draft: TripDraft, mode: TripMode): TripDraft {
  if (draft.mode === mode) return draft;
  if (mode === "quick") {
    const adults = wholeCount(draft.adults);
    const children = wholeCount(draft.children);
    if (adults === null || children === null) return { ...draft, mode };
    return { ...draft, mode, travellers: String(adults + children) };
  }

  const travellers = wholeCount(draft.travellers);
  const adults = wholeCount(draft.adults);
  const children = wholeCount(draft.children);
  const breakdownMatches =
    travellers !== null && adults !== null && children !== null && adults + children === travellers;
  if (breakdownMatches || travellers === null) return { ...draft, mode };
  return { ...draft, mode, adults: String(travellers), children: "0" };
}

export function exampleDraft(mode: TripMode): TripDraft {
  return {
    ...emptyDraft(),
    mode,
    origin: EXAMPLE_FIGURES.origin,
    destination: EXAMPLE_FIGURES.destination,
    tripType: "round",
    departDate: EXAMPLE_FIGURES.departDate,
    returnDate: EXAMPLE_FIGURES.returnDate,
    travellers: "1",
    adults: mode === "full" ? "2" : "1",
    children: mode === "full" ? "1" : "0",
    flexibleDates: mode === "full",
    dateWindow: mode === "full" ? "Plus or minus 2 days" : "",
    nearbyAirports: mode === "full",
    cabin: mode === "full" ? "economy" : "any",
    notes: mode === "full" ? "Example note: prefer a morning departure." : "",
    cashPrice: EXAMPLE_FIGURES.cashPrice,
    points: EXAMPLE_FIGURES.points,
    taxes: EXAMPLE_FIGURES.taxes,
  };
}

export function formatIsoDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function partyLabel(trip: ValidatedTrip): string {
  if (trip.mode === "quick") {
    return trip.travellerCount === 1 ? "1 traveller" : `${trip.travellerCount} travellers`;
  }
  const adults = trip.adults === 1 ? "1 adult" : `${trip.adults} adults`;
  if (trip.children === 0) return adults;
  const children = trip.children === 1 ? "1 child" : `${trip.children} children`;
  return `${adults}, ${children}`;
}

export function routeSummary(trip: ValidatedTrip): string {
  const when = trip.returnDate
    ? `${formatIsoDate(trip.departDate)} to ${formatIsoDate(trip.returnDate)}`
    : `${formatIsoDate(trip.departDate)}, one way`;
  const mode = trip.mode === "quick" ? "Quick Flight" : "Full Trip Plan";
  return `${trip.origin} to ${trip.destination}. ${when}. ${partyLabel(trip)}. ${mode}.`;
}

export function preferenceLines(trip: ValidatedTrip): string[] {
  if (trip.mode !== "full") return [];
  return [
    trip.flexibleDates
      ? trip.dateWindow
        ? `Flexible dates: ${trip.dateWindow}`
        : "Flexible dates, with no window written down"
      : "Fixed dates",
    trip.nearbyAirports ? "Reminder to check nearby airports" : "Nearby airports not requested",
    `Cabin: ${CABIN_LABEL[trip.cabin]}`,
    ...(trip.notes ? [`Note: ${trip.notes}`] : []),
  ];
}
