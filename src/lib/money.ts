const euro = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
});

export const MAX_EURO_CENTS = 10_000_000;
export const MAX_POINTS = 10_000_000;

/** Parse a euro amount typed with a dot or comma. Returns whole cents, or null when the text is not money. */
export function parseEuroToCents(raw: string): number | null {
  const trimmed = raw.trim().replace(/\s/g, "");
  if (!trimmed) return null;
  const normalized = trimmed.replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, frac = ""] = normalized.split(".");
  if (whole.length > 6) return null;
  const cents = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents)) return null;
  return cents;
}

/** Parse a whole point total. Spaces are ignored. Dots and commas are rejected so a thousands separator is not read as a decimal. */
export function parsePoints(raw: string): number | null {
  const trimmed = raw.trim().replace(/[\s_]/g, "");
  if (!/^\d+$/.test(trimmed) || trimmed.length > 8) return null;
  const value = Number(trimmed);
  if (!Number.isSafeInteger(value)) return null;
  return value;
}

export function formatEurFromCents(cents: number): string {
  const formatted = euro.format(Math.abs(cents) / 100);
  return cents < 0 ? `−${formatted}` : formatted;
}

export function formatPoints(value: number): string {
  return new Intl.NumberFormat("en-GB").format(value);
}

export function formatPercent(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const absolute = Math.abs(rounded);
  const body = Number.isInteger(absolute) ? absolute.toFixed(0) : absolute.toFixed(1);
  return rounded < 0 ? `−${body}%` : `${body}%`;
}

export function formatValuePerPoint(eur: number): string {
  const absolute = Math.abs(eur);
  const digits = absolute >= 1 ? 2 : 4;
  const body = absolute.toFixed(digits);
  return eur < 0 ? `−€${body}` : `€${body}`;
}
