import type { FormEvent, RefObject } from "react";
import type { Cabin, TripDraft, TripType } from "@/lib/trip";
import { CABIN_LABEL } from "@/lib/trip";
import type { FieldErrors } from "@/lib/validation";
import {
  Field,
  controlClass,
  headingClass,
  primaryButtonClass,
  secondaryButtonClass,
  sectionTitleClass,
} from "./field";
import { ArrowIcon } from "./mile-mark";

const inputClass = `${controlClass} h-12 tabular-nums`;

export function TripForm({
  draft,
  errors,
  exampleNotice,
  headingRef,
  submitting = false,
  onChange,
  onExample,
  onSubmit,
}: {
  draft: TripDraft;
  errors: FieldErrors;
  exampleNotice: boolean;
  headingRef: RefObject<HTMLHeadingElement | null>;
  submitting?: boolean;
  onChange: (patch: Partial<TripDraft>) => void;
  onExample: () => void;
  onSubmit: () => void;
}) {
  const pricesEmpty = !draft.cashPrice.trim() && !draft.points.trim() && !draft.taxes.trim();
  const title = draft.mode === "full" ? "Enter the full trip" : "Enter the Quick Flight";

  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={submit} noValidate className="mx-auto max-w-3xl">
      {/* Header section */}
      <div>
        <h1 ref={headingRef} tabIndex={-1} className={headingClass}>
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
          Use amounts from a quote you have already seen. The example below is editable, and it is
          not a live fare.
        </p>
      </div>

      {errors.mode ? (
        <div role="alert" className="mt-4 rounded-lg border border-cost-border bg-cost-bg p-3.5 text-sm font-semibold text-cost">
          {errors.mode}
        </div>
      ) : null}

      {/* 1. Route Section */}
      <section className="mt-8 rounded-xl border border-line bg-sheet p-5 sm:p-6 shadow-subtle hover:border-line-strong transition-all">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h2 className={sectionTitleClass}>Route</h2>
        </div>

        <div className="mt-5 grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_4rem_minmax(0,1fr)]">
          <Field id="origin" label="Origin" hint="City or airport code (e.g. MAD)" error={errors.origin}>
            <input
              className={inputClass}
              autoComplete="off"
              spellCheck={false}
              placeholder="e.g. Madrid"
              value={draft.origin}
              onChange={(event) => onChange({ origin: event.target.value })}
            />
          </Field>

          <div className="flex h-12 items-center justify-center" aria-hidden="true">
            <span className="h-6 w-px bg-line-strong sm:h-px sm:w-3" />
            <span className="mx-1.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-line bg-subtle text-ink">
              <ArrowIcon />
            </span>
            <span className="hidden h-px w-3 bg-line-strong sm:block" />
          </div>

          <Field
            id="destination"
            label="Destination"
            hint="City or airport code (e.g. BCN)"
            error={errors.destination}
          >
            <input
              className={inputClass}
              autoComplete="off"
              spellCheck={false}
              placeholder="e.g. Barcelona"
              value={draft.destination}
              onChange={(event) => onChange({ destination: event.target.value })}
            />
          </Field>
        </div>
      </section>

      {/* 2. Dates & Trip Type Section */}
      <section className="mt-5 rounded-xl border border-line bg-sheet p-5 sm:p-6 shadow-subtle hover:border-line-strong transition-all">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h2 className={sectionTitleClass}>Dates and direction</h2>
        </div>

        <fieldset className="mt-5">
          <legend className="text-sm font-semibold text-ink">Itinerary type</legend>
          <div className="mt-2.5 flex flex-wrap gap-3">
            {(
              [
                ["round", "Round trip"],
                ["oneway", "One way"],
              ] as const
            ).map(([value, label]) => {
              const checked = draft.tripType === value;
              return (
                <label
                  key={value}
                  className={`inline-flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border px-4 text-sm font-semibold transition-all ${
                    checked
                      ? "border-ink bg-ink text-foam"
                      : "border-line bg-subtle/50 text-ink hover:border-line-strong hover:bg-subtle"
                  }`}
                >
                  <input
                    type="radio"
                    name="tripType"
                    value={value}
                    checked={checked}
                    onChange={() => onChange({ tripType: value satisfies TripType })}
                    className="sr-only"
                  />
                  <span className={`size-3 rounded-full border ${checked ? "border-foam bg-foam" : "border-muted"}`} />
                  {label}
                </label>
              );
            })}
          </div>
          {errors.tripType ? (
            <p role="alert" className="mt-2 text-xs font-semibold text-cost">
              {errors.tripType}
            </p>
          ) : null}
        </fieldset>

        <div className="mt-5 grid gap-x-4 gap-y-5 sm:grid-cols-2">
          <Field id="departDate" label="Departure date" error={errors.departDate}>
            <input
              type="date"
              className={inputClass}
              value={draft.departDate}
              onChange={(event) => onChange({ departDate: event.target.value })}
            />
          </Field>

          {draft.tripType === "round" ? (
            <Field id="returnDate" label="Return date" error={errors.returnDate}>
              <input
                type="date"
                className={inputClass}
                value={draft.returnDate}
                onChange={(event) => onChange({ returnDate: event.target.value })}
              />
            </Field>
          ) : null}
        </div>
      </section>

      {/* 3. Travellers Section */}
      <section className="mt-5 rounded-xl border border-line bg-sheet p-5 sm:p-6 shadow-subtle hover:border-line-strong transition-all">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h2 className={sectionTitleClass}>Party Size</h2>
          <span className="text-xs text-muted">Who is travelling</span>
        </div>

        <div className="mt-5 grid gap-x-4 gap-y-5 sm:grid-cols-2">
          {draft.mode === "full" ? (
            <>
              <Field id="adults" label="Adults (12+ yrs)" hint="Primary passengers" error={errors.adults}>
                <input
                  inputMode="numeric"
                  className={inputClass}
                  placeholder="1"
                  value={draft.adults}
                  onChange={(event) => onChange({ adults: event.target.value })}
                />
              </Field>
              <Field id="children" label="Children (2-11 yrs)" hint="Optional" error={errors.children}>
                <input
                  inputMode="numeric"
                  className={inputClass}
                  placeholder="0"
                  value={draft.children}
                  onChange={(event) => onChange({ children: event.target.value })}
                />
              </Field>
            </>
          ) : (
            <Field id="travellers" label="Travellers" hint="Total tickets (from 1 to 9)" error={errors.travellers}>
              <input
                inputMode="numeric"
                className={inputClass}
                placeholder="1"
                value={draft.travellers}
                onChange={(event) => onChange({ travellers: event.target.value })}
              />
            </Field>
          )}
        </div>
      </section>

      {/* 4. Full Trip Plan Preferences */}
      {draft.mode === "full" ? (
        <section className="mt-5 rounded-xl border border-line bg-sheet p-5 sm:p-6 shadow-subtle hover:border-line-strong transition-all">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h2 className={sectionTitleClass}>Trip Preferences</h2>
            <span className="text-xs text-muted">Recorded with itinerary</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            These stay with the trip for your records. They do not alter the arithmetic calculation.
          </p>

          <div className="mt-4 divide-y divide-line">
            <label className="flex min-h-12 cursor-pointer items-start gap-3 py-3">
              <input
                type="checkbox"
                className="mt-1 size-4 rounded accent-ink"
                checked={draft.flexibleDates}
                onChange={(event) => onChange({ flexibleDates: event.target.checked })}
              />
              <span>
                <span className="block text-sm font-semibold text-ink">Flexible dates</span>
                <span className="block text-xs text-muted">Add a ±3 day window if your schedule is flexible.</span>
              </span>
            </label>

            {draft.flexibleDates ? (
              <div className="py-4">
                <Field
                  id="dateWindow"
                  label="Date window details"
                  hint="Optional (max 40 chars)"
                  error={errors.dateWindow}
                >
                  <input
                    className={controlClass}
                    maxLength={40}
                    placeholder="e.g. ±2 days in mid-October"
                    value={draft.dateWindow}
                    onChange={(event) => onChange({ dateWindow: event.target.value })}
                  />
                </Field>
              </div>
            ) : null}

            <label className="flex min-h-12 cursor-pointer items-start gap-3 py-3">
              <input
                type="checkbox"
                className="mt-1 size-4 rounded accent-ink"
                checked={draft.nearbyAirports}
                onChange={(event) => onChange({ nearbyAirports: event.target.checked })}
              />
              <span>
                <span className="block text-sm font-semibold text-ink">Consider nearby airports</span>
                <span className="block text-xs text-muted">
                  Remember to check alternative regional departure/arrival hubs.
                </span>
              </span>
            </label>

            <div className="grid gap-5 py-4 sm:grid-cols-2">
              <Field id="cabin" label="Cabin class" error={errors.cabin}>
                <select
                  className={controlClass}
                  value={draft.cabin}
                  onChange={(event) => onChange({ cabin: event.target.value as Cabin })}
                >
                  {(Object.entries(CABIN_LABEL) as [Cabin, string][]).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                id="notes"
                label="Trip note"
                hint={`${draft.notes.trim().length}/280 chars`}
                error={errors.notes}
              >
                <textarea
                  className={`${controlClass} min-h-24 py-2.5 text-sm`}
                  maxLength={280}
                  placeholder="Airline quote reference or luggage notes..."
                  value={draft.notes}
                  onChange={(event) => onChange({ notes: event.target.value })}
                />
              </Field>
            </div>
          </div>
        </section>
      ) : null}

      {/* 5. The Two Prices Section */}
      <section className="mt-5 rounded-xl border border-line bg-sheet p-5 sm:p-6 shadow-subtle hover:border-line-strong transition-all">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h2 className={sectionTitleClass}>The Two Prices</h2>
          <span className="text-xs text-muted">Total for all travellers</span>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-muted">
          Compare the cash fare with the points redemption. Both figures are the totals you enter for this party.
        </p>

        {/* Editable Example Quick Action */}
        <div className="mt-4 rounded-lg border border-line bg-subtle/50 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink">Madrid to Barcelona sample</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                €186 cash, 12,500 points, and €42 taxes. Editable, and not a live fare.
              </p>
            </div>
            <button
              type="button"
              className={`${secondaryButtonClass} shrink-0`}
              onClick={onExample}
            >
              Load editable example
            </button>
          </div>

          {exampleNotice ? (
            <div role="status" className="mt-3 rounded border border-marker/40 bg-marker/10 p-2 text-xs font-medium text-ink">
              Sample figures loaded into the form. Customize them with your real quote.
            </div>
          ) : null}

          {pricesEmpty ? (
            <p className="mt-2 text-xs text-tertiary">
              No amounts entered yet. Type your figures below or click to load sample numbers.
            </p>
          ) : null}
        </div>

        <div className="mt-6 grid gap-x-4 gap-y-5 sm:grid-cols-3">
          <Field
            id="cashPrice"
            label="Cash fare (EUR)"
            hint="All-in cash ticket"
            error={errors.cashPrice}
          >
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">
                €
              </span>
              <input
                inputMode="decimal"
                className={`${inputClass} pl-8`}
                autoComplete="off"
                placeholder="186.00"
                value={draft.cashPrice}
                onChange={(event) => onChange({ cashPrice: event.target.value })}
              />
            </div>
          </Field>

          <Field
            id="points"
            label="Points required"
            hint="Total miles / points"
            error={errors.points}
          >
            <div className="relative">
              <input
                inputMode="numeric"
                className={`${inputClass} pr-12`}
                autoComplete="off"
                placeholder="12500"
                value={draft.points}
                onChange={(event) => onChange({ points: event.target.value })}
              />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted uppercase">
                pts
              </span>
            </div>
          </Field>

          <Field
            id="taxes"
            label="Taxes & fees (EUR)"
            hint="Cash due on award"
            error={errors.taxes}
          >
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">
                €
              </span>
              <input
                inputMode="decimal"
                className={`${inputClass} pl-8`}
                autoComplete="off"
                placeholder="42.00"
                value={draft.taxes}
                onChange={(event) => onChange({ taxes: event.target.value })}
              />
            </div>
          </Field>
        </div>
      </section>

      {/* Submit Button */}
      <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
        <button
          type="submit"
          className={primaryButtonClass}
          disabled={submitting}
          aria-busy={submitting}
        >
          {submitting ? "Comparing these figures" : "Compare these figures"}
          {submitting ? null : <ArrowIcon />}
        </button>
        <span className="text-xs text-muted">
          Sent to the comparison service. Not a live fare or a booking.
        </span>
      </div>
    </form>
  );
}
