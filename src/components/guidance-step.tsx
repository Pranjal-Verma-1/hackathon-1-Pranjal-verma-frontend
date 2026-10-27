import type { RefObject } from "react";
import { BOOKING_CHECKS, CARRIERS, bookingHref, carrierName } from "@/lib/booking";
import { controlClass, headingClass, primaryButtonClass, secondaryButtonClass, sectionTitleClass } from "./field";

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
  const allDone = done === BOOKING_CHECKS.length;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header section */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted mb-2">
          <span className="size-2 rounded-full bg-emerald-600" />
          <span>Stage 4 • Final Booking Guidance</span>
        </div>
        <h1 ref={headingRef} tabIndex={-1} className={headingClass}>
          What to do before you book
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
          A Una Milla does not search availability, hold a seat, or buy a ticket. Check the quote
          yourself, then book on the airline or issuer site.
        </p>
      </div>

      {/* 1. Interactive Pre-Booking Checklist */}
      <section className="mt-8 rounded-xl border border-line bg-sheet p-5 sm:p-6 shadow-subtle hover:border-line-strong transition-all" aria-labelledby="checklist-title">
        <div className="flex items-center justify-between border-b border-line pb-3.5">
          <h2 id="checklist-title" className={sectionTitleClass}>Pre-Booking Checklist</h2>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              allDone
                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                : "bg-subtle text-muted border border-line"
            }`}
          >
            {done} of {BOOKING_CHECKS.length} checked
          </span>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-muted">
          These items remain checked on this device until you start another trip. Work through them
          before converting points or ticketing.
        </p>

        <ul className="mt-4 space-y-2.5">
          {BOOKING_CHECKS.map((item, index) => {
            const isChecked = checks[index] ?? false;
            return (
              <li
                key={item}
                className={`rounded-lg border transition-all ${
                  isChecked
                    ? "border-line-strong bg-subtle/40"
                    : "border-line bg-sheet hover:border-line-strong hover:bg-subtle/20"
                }`}
              >
                <label className="flex min-h-12 cursor-pointer items-start gap-3.5 p-3.5">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 rounded accent-ink shrink-0 cursor-pointer"
                    checked={isChecked}
                    onChange={() => onToggle(index)}
                  />
                  <span className={`text-sm leading-relaxed transition-colors ${isChecked ? "text-ink font-medium" : "text-muted"}`}>
                    {item}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 2. Airline / Partner Homepage Link */}
      <section className="mt-5 rounded-xl border border-line bg-sheet p-5 sm:p-6 shadow-subtle hover:border-line-strong transition-all">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h2 className={sectionTitleClass}>Open a site you already use</h2>
          <span className="text-xs text-muted">Direct homepage shortcut</span>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-muted">
          Optional. A link opens only the public homepage of a site listed here. Your trip details
          are not transferred, and no booking or payment occurs.
        </p>

        <div className="mt-5 max-w-md">
          <label htmlFor="carrier" className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
            Select booking portal or airline
          </label>
          <select
            id="carrier"
            className={controlClass}
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
        </div>

        {href && name ? (
          <div className="mt-4">
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`${primaryButtonClass} no-underline min-h-[46px] px-6`}
            >
              Open the {name} homepage
              <span className="sr-only"> (opens in a new tab)</span>
              <span aria-hidden="true" className="ml-1 text-xs">↗</span>
            </a>
            <p className="mt-2 text-xs text-tertiary">
              Opens in a new browser tab. Remember to confirm seat availability before transferring points.
            </p>
          </div>
        ) : (
          <p className="mt-3 text-xs text-tertiary">
            No external booking link active. Select an airline from the dropdown if you need a quick shortcut.
          </p>
        )}
      </section>

      {/* Navigation action buttons */}
      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
        <button type="button" className={`${primaryButtonClass} min-h-[50px] px-7 shadow-card`} onClick={onStartOver}>
          Plan another trip
        </button>
        <button type="button" className={secondaryButtonClass} onClick={onEdit}>
          Edit this trip
        </button>
      </div>
    </div>
  );
}
