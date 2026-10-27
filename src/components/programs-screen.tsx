import { bookingHref } from "@/lib/booking";
import {
  TRANSFER_REFERENCE_NOTE,
  airlineLoyaltyPrograms,
  bankLoyaltyPrograms,
  checklistAirlines,
  loyaltyHomepage,
  referenceTransferLabel,
} from "@/lib/loyalty";
import { headingClass, sectionTitleClass } from "./field";

export function ProgramsScreen() {
  const airlines = airlineLoyaltyPrograms();
  const banks = bankLoyaltyPrograms();
  const checklist = checklistAirlines();

  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">Reference</p>
      <h1 className={`${headingClass} mt-3`}>Programs and transfers</h1>
      <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted">{TRANSFER_REFERENCE_NOTE}</p>

      <div className="mt-8 overflow-x-auto rounded-xl border border-line bg-sheet shadow-subtle">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <caption className="border-b border-line px-4 py-3 text-left text-xs text-muted">
            A dash means this reference list does not include that pair. It is not a check of your card or of award space.
          </caption>
          <thead>
            <tr className="border-b border-line bg-subtle/80">
              <th scope="col" className="px-4 py-3 font-semibold text-ink">
                Airline program
              </th>
              {banks.map((bank) => (
                <th key={bank.id} scope="col" className="px-4 py-3 font-semibold text-ink">
                  {bank.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {airlines.map((airline) => (
              <tr key={airline.id} className="border-b border-line last:border-0">
                <th scope="row" className="px-4 py-3 font-medium text-ink">
                  <span className="block">{airline.name}</span>
                  <span className="block text-xs font-normal text-muted">{airline.unit}</span>
                </th>
                {banks.map((bank) => {
                  const label = referenceTransferLabel(bank.id, airline.id);
                  return (
                    <td key={bank.id} className="px-4 py-3 text-ink">
                      {label ?? "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-10">
        <h2 className={sectionTitleClass}>Program sites</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          These links open a public homepage. They do not carry your trip, and they do not check a balance or a seat.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {airlines.map((airline) => {
            const href = loyaltyHomepage(airline.id);
            return (
              <li key={airline.id} className="rounded-xl border border-line bg-sheet p-4 shadow-subtle">
                <p className="font-semibold text-ink">{airline.name}</p>
                <p className="mt-1 text-sm text-muted">
                  {airline.carrier} · {airline.unit}
                </p>
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-ink underline decoration-line-strong underline-offset-4"
                  >
                    Open {airline.carrier} homepage
                  </a>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className={sectionTitleClass}>Checklist airlines</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          The booking checklist already links to these homepages. Holding a balance here is separate from the points you type into a comparison.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {checklist.map((carrier) => {
            const href = bookingHref(carrier.id);
            return (
              <li key={carrier.id}>
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center text-sm font-medium text-ink underline decoration-line-strong underline-offset-4"
                  >
                    {carrier.name}
                  </a>
                ) : (
                  <span className="text-sm text-ink">{carrier.name}</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
