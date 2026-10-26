import type { RefObject } from "react";
import { BOOKING_CHECKS, CARRIERS, bookingHref, carrierName } from "@/lib/booking";
import { primaryButtonClass, secondaryButtonClass } from "./field";

export function GuidanceStep({
  carrierId,
  checks,
  headingRef,
  onCarrier,
  onToggle,
  onEdit,
  onStartOver,
}: {
  carrierId: string;
  checks: boolean[];
  headingRef: RefObject<HTMLHeadingElement | null>;
  onCarrier: (id: string) => void;
  onToggle: (index: number) => void;
  onEdit: () => void;
  onStartOver: () => void;
}) {
  const href = bookingHref(carrierId);
  const name = carrierName(carrierId);
  const done = checks.filter(Boolean).length;

  return (
    <div>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="max-w-[18ch] text-3xl font-semibold tracking-tight text-balance outline-none sm:text-4xl"
      >
        What to do before you book
      </h1>
      <p className="mt-4 max-w-prose text-base leading-7 text-muted">
        A Una Milla does not search availability, hold a seat, or buy a ticket. Check the quote
        yourself, then book on the airline or issuer site.
      </p>

      <fieldset className="mt-10">
        <legend className="text-lg font-semibold">Checklist</legend>
        <p className="mt-2 text-sm text-muted">
          {done} of {BOOKING_CHECKS.length} checked. These stay on this device until you plan
          another trip.
        </p>
        <ul className="mt-4 border-t border-line">
          {BOOKING_CHECKS.map((item, index) => (
            <li key={item} className="border-b border-line">
              <label className="flex min-h-12 items-start gap-3 py-3">
                <input
                  type="checkbox"
                  className="mt-1 size-5"
                  checked={checks[index] ?? false}
                  onChange={() => onToggle(index)}
                />
                <span className="text-base leading-6">{item}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Open a site you already use</h2>
        <p className="mt-2 max-w-prose text-sm leading-6 text-muted">
          Optional. A link opens only the public homepage of a site listed here. Your trip is not
          filled in, and nothing is booked.
        </p>
        <label htmlFor="carrier" className="mt-4 block text-sm font-semibold">
          Site
        </label>
        <select
          id="carrier"
          className="mt-2 min-h-12 w-full border border-line bg-sheet px-3 text-base text-ink"
          value={CARRIERS.some((carrier) => carrier.id === carrierId) ? carrierId : ""}
          onChange={(event) => onCarrier(event.target.value)}
        >
          <option value="">No site selected</option>
          {CARRIERS.map((carrier) => (
            <option key={carrier.id} value={carrier.id}>
              {carrier.name}
            </option>
          ))}
        </select>
        {href && name ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${primaryButtonClass} mt-4 no-underline`}
          >
            Open the {name} homepage
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        ) : (
          <p className="mt-4 max-w-prose text-sm leading-6 text-muted">
            No booking link, because no site is selected. The checklist still stands.
          </p>
        )}
      </section>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <button type="button" className={primaryButtonClass} onClick={onStartOver}>
          Plan another trip
        </button>
        <button type="button" className={secondaryButtonClass} onClick={onEdit}>
          Edit the trip
        </button>
      </div>
    </div>
  );
}
