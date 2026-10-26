export const BOOKING_CHECKS = [
  "The cash fare still matches the amount you entered.",
  "The award quote still shows the same points, taxes and fees, dates, and cabin.",
  "You have read the baggage, change, and refund rules on that quote.",
  "If points must be transferred, you can see the seat before you move them.",
  "You will pay on the airline or issuer site. A Una Milla does not issue tickets.",
] as const;

export type Carrier = {
  id: string;
  name: string;
  href: string;
};

/** Public homepages only. These URLs do not carry a search, a fare, or a booking. */
export const CARRIERS: readonly Carrier[] = [
  { id: "iberia", name: "Iberia", href: "https://www.iberia.com/" },
  { id: "aireuropa", name: "Air Europa", href: "https://www.aireuropa.com/" },
  { id: "vueling", name: "Vueling", href: "https://www.vueling.com/" },
  { id: "ryanair", name: "Ryanair", href: "https://www.ryanair.com/" },
  { id: "british-airways", name: "British Airways", href: "https://www.britishairways.com/" },
  { id: "air-france", name: "Air France", href: "https://www.airfrance.com/" },
  { id: "lufthansa", name: "Lufthansa", href: "https://www.lufthansa.com/" },
  { id: "klm", name: "KLM", href: "https://www.klm.com/" },
  { id: "google-flights", name: "Google Flights", href: "https://www.google.com/travel/flights" },
];

export function bookingHref(id: string): string | null {
  const carrier = CARRIERS.find((item) => item.id === id);
  if (!carrier) return null;
  try {
    const url = new URL(carrier.href);
    if (url.protocol !== "https:") return null;
  } catch {
    return null;
  }
  return carrier.href;
}

export function carrierName(id: string): string | null {
  return CARRIERS.find((item) => item.id === id)?.name ?? null;
}
