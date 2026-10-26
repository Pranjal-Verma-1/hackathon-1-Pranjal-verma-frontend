import type { FormEvent, RefObject } from "react";
import type { Cabin, TripDraft, TripType } from "@/lib/trip";
import { CABIN_LABEL } from "@/lib/trip";
import type { FieldErrors } from "@/lib/validation";
import { Field, controlClass, primaryButtonClass, secondaryButtonClass } from "./field";

const inputClass = `${controlClass} tabular-nums`;

export function TripForm({
  draft,
  errors,
  exampleNotice,
  headingRef,
  onChange,
  onExample,
  onSubmit,
}: {
  draft: TripDraft;
  errors: FieldErrors;
  exampleNotice: boolean;
  headingRef: RefObject<HTMLHeadingElement | null>;
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
    <form onSubmit={submit} noValidate>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-3xl font-semibold tracking-tight text-balance outline-none sm:text-4xl"
      >
        {title}
      </h1>
      <p className="mt-4 max-w-prose text-base leading-7 text-muted">
        Use amounts from a quote you have already seen. The example below is editable, and it is
        not a live fare.
      </p>
      {errors.mode ? (
        <p role="alert" className="mt-4 text-sm font-medium text-cost">
          {errors.mode}
        </p>
      ) : null}

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Route</h2>
        <div className="mt-4 grid gap-x-4 gap-y-6 sm:grid-cols-2">
          <Field id="origin" label="Origin" hint="City or airport code." error={errors.origin}>
            <input
              className={inputClass}
              autoComplete="off"
              spellCheck={false}
              value={draft.origin}
              onChange={(event) => onChange({ origin: event.target.value })}
            />
          </Field>
          <Field
            id="destination"
            label="Destination"
            hint="City or airport code."
            error={errors.destination}
          >
            <input
              className={inputClass}
              autoComplete="off"
              spellCheck={false}
              value={draft.destination}
              onChange={(event) => onChange({ destination: event.target.value })}
            />
          </Field>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Dates</h2>
        <fieldset className="mt-4">
          <legend className="text-sm font-semibold">Trip</legend>
          <div className="mt-2 flex flex-wrap gap-x-6">
            {(
              [
                ["round", "Round trip"],
                ["oneway", "One way"],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="inline-flex min-h-12 items-center gap-2 text-base">
                <input
                  type="radio"
                  name="tripType"
                  value={value}
                  checked={draft.tripType === value}
                  onChange={() => onChange({ tripType: value satisfies TripType })}
                  className="size-5"
                />
                {label}
              </label>
            ))}
          </div>
          {errors.tripType ? (
            <p role="alert" className="mt-2 text-sm font-medium text-cost">
              {errors.tripType}
            </p>
          ) : null}
        </fieldset>
        <div className="mt-4 grid gap-x-4 gap-y-6 sm:grid-cols-2">
          <Field id="departDate" label="Departure" error={errors.departDate}>
            <input
              type="date"
              className={inputClass}
              value={draft.departDate}
              onChange={(event) => onChange({ departDate: event.target.value })}
            />
          </Field>
          {draft.tripType === "round" ? (
            <Field id="returnDate" label="Return" error={errors.returnDate}>
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

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Who is travelling</h2>
        <div className="mt-4 grid gap-x-4 gap-y-6 sm:grid-cols-2">
          {draft.mode === "full" ? (
            <>
              <Field id="adults" label="Adults" error={errors.adults}>
                <input
                  inputMode="numeric"
                  className={inputClass}
                  value={draft.adults}
                  onChange={(event) => onChange({ adults: event.target.value })}
                />
              </Field>
              <Field id="children" label="Children" error={errors.children}>
                <input
                  inputMode="numeric"
                  className={inputClass}
                  value={draft.children}
                  onChange={(event) => onChange({ children: event.target.value })}
                />
              </Field>
            </>
          ) : (
            <Field id="travellers" label="Travellers" hint="From 1 to 9." error={errors.travellers}>
              <input
                inputMode="numeric"
                className={inputClass}
                value={draft.travellers}
                onChange={(event) => onChange({ travellers: event.target.value })}
              />
            </Field>
          )}
        </div>
      </section>

      {draft.mode === "full" ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Preferences</h2>
          <p className="mt-2 max-w-prose text-sm leading-6 text-muted">
            These stay with the trip so you can check them later. They do not change the estimate.
          </p>
          <div className="mt-4 grid gap-4">
            <label className="flex min-h-12 items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 size-5"
                checked={draft.flexibleDates}
                onChange={(event) => onChange({ flexibleDates: event.target.checked })}
              />
              <span>
                <span className="block font-semibold">Dates can move</span>
                <span className="block text-sm leading-6 text-muted">
                  Add a window if you have one.
                </span>
              </span>
            </label>
            {draft.flexibleDates ? (
              <Field
                id="dateWindow"
                label="Date window"
                hint="Optional. 40 characters at most."
                error={errors.dateWindow}
              >
                <input
                  className={controlClass}
                  maxLength={40}
                  value={draft.dateWindow}
                  onChange={(event) => onChange({ dateWindow: event.target.value })}
                />
              </Field>
            ) : null}
            <label className="flex min-h-12 items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 size-5"
                checked={draft.nearbyAirports}
                onChange={(event) => onChange({ nearbyAirports: event.target.checked })}
              />
              <span>
                <span className="block font-semibold">Nearby airports</span>
                <span className="block text-sm leading-6 text-muted">
                  Remember to check airports near the cities you named.
                </span>
              </span>
            </label>
            <Field id="cabin" label="Cabin" error={errors.cabin}>
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
              label="Note"
              hint={`${draft.notes.trim().length}/280 characters. Optional.`}
              error={errors.notes}
            >
              <textarea
                className={`${controlClass} min-h-28 py-3`}
                maxLength={280}
                value={draft.notes}
                onChange={(event) => onChange({ notes: event.target.value })}
              />
            </Field>
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="text-lg font-semibold">The two prices</h2>
        <p className="mt-2 max-w-prose text-sm leading-6 text-muted">
          Cash fare against the points redemption. Both are totals for this trip, in euros where
          money is due.
        </p>
        {pricesEmpty ? (
          <p className="mt-3 max-w-prose text-sm leading-6 text-muted">
            No amounts yet. Type a quote you found, or load the example and edit it.
          </p>
        ) : null}
        <div className="mt-4">
          <button type="button" className={secondaryButtonClass} onClick={onExample}>
            Load an editable example
          </button>
          <p className="mt-2 max-w-prose text-sm leading-6 text-muted">
            Sample figures for Madrid to Barcelona: €186 cash, 12,500 points, €42 taxes and fees.
            Not a live fare and not an available award seat.
          </p>
          {exampleNotice ? (
            <p role="status" className="mt-3 max-w-prose text-sm font-medium leading-6 text-ink">
              Example figures are in the form. Change them before you rely on the estimate.
            </p>
          ) : null}
        </div>
        <div className="mt-6 grid gap-x-4 gap-y-6 sm:grid-cols-2">
          <Field
            id="cashPrice"
            label="Cash fare (EUR)"
            hint="The all-in cash ticket."
            error={errors.cashPrice}
          >
            <input
              inputMode="decimal"
              className={inputClass}
              autoComplete="off"
              value={draft.cashPrice}
              onChange={(event) => onChange({ cashPrice: event.target.value })}
            />
          </Field>
          <Field
            id="points"
            label="Points required"
            hint="Use 0 if the quote asks for none."
            error={errors.points}
          >
            <input
              inputMode="numeric"
              className={inputClass}
              autoComplete="off"
              value={draft.points}
              onChange={(event) => onChange({ points: event.target.value })}
            />
          </Field>
          <Field
            id="taxes"
            label="Taxes and fees (EUR)"
            hint="Cash still due on the redemption. Use 0 if the quote has none."
            error={errors.taxes}
          >
            <input
              inputMode="decimal"
              className={inputClass}
              autoComplete="off"
              value={draft.taxes}
              onChange={(event) => onChange({ taxes: event.target.value })}
            />
          </Field>
        </div>
      </section>

      <div className="mt-10">
        <button type="submit" className={primaryButtonClass}>
          Compare these figures
        </button>
      </div>
    </form>
  );
}
