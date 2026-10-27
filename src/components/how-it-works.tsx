import { HOW_IT_WORKS_ID, PRINCIPLES_ID } from "@/lib/navigation";

export function HowItWorks() {
  return (
    <section id={HOW_IT_WORKS_ID} className="mt-16 border-t border-line pt-12">
      <div className="max-w-2xl">
        <span className="text-xs font-bold uppercase tracking-wider text-muted">Methodology</span>
        <h2 id={PRINCIPLES_ID} className="display text-2xl sm:text-3xl font-bold tracking-tight text-ink mt-1">
          How A Una Milla evaluates your trade
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Frequent flyer programs make redemptions deliberately confusing. We reduce every award
          ticket to clean financial arithmetic so you never burn points on a bad flight.
        </p>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-sheet p-5 shadow-subtle">
          <span className="flex size-8 items-center justify-center rounded-lg bg-subtle text-xs font-bold text-ink">
            01
          </span>
          <h3 className="mt-3 text-base font-bold text-ink">Bring Your Quotes</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            Enter the cash ticket price and the award points quote you already received from your
            airline or booking platform.
          </p>
        </div>

        <div className="rounded-xl border border-line bg-sheet p-5 shadow-subtle">
          <span className="flex size-8 items-center justify-center rounded-lg bg-subtle text-xs font-bold text-ink">
            02
          </span>
          <h3 className="mt-3 text-base font-bold text-ink">Uncover Real Math</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            We deduct taxes and fees from the cash price to calculate the euros saved and the
            euros each point is worth.
          </p>
        </div>

        <div className="rounded-xl border border-line bg-sheet p-5 shadow-subtle">
          <span className="flex size-8 items-center justify-center rounded-lg bg-subtle text-xs font-bold text-ink">
            03
          </span>
          <h3 className="mt-3 text-base font-bold text-ink">Book With Clarity</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            Review a pre-booking checklist to confirm seat availability, transfer times, and refund
            rules before ticketing.
          </p>
        </div>
      </div>
    </section>
  );
}
