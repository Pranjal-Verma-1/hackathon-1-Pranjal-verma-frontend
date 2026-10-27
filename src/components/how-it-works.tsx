import { HOW_IT_WORKS_ID, PRINCIPLES_ID } from "@/lib/navigation";
import { headingClass } from "./field";

export function HowItWorks() {
  return (
    <section id={HOW_IT_WORKS_ID} className="mt-16 border-t border-line pt-12">
      <div className="max-w-2xl">
        <h2 id={PRINCIPLES_ID} className={headingClass}>
          How A Una Milla evaluates the trade
        </h2>
        <p className="mt-4 text-base leading-7 text-muted">
          You enter a cash fare and a points redemption you already have. The comparison service returns the euro difference after taxes and fees. Points are treated as already earned and are not given a euro price.
        </p>
      </div>

      <ol className="mt-8 max-w-2xl divide-y divide-line border-y border-line">
        <li className="py-5">
          <h3 className="font-serif text-xl font-semibold tracking-[-0.03em] text-ink">Bring the quotes you have</h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            Enter the cash fare and the award points quote you already received from an airline or booking site.
          </p>
        </li>
        <li className="py-5">
          <h3 className="font-serif text-xl font-semibold tracking-[-0.03em] text-ink">Read the euro difference</h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            The comparison service returns the euro difference after taxes and fees. It does not give the points a euro price.
          </p>
        </li>
        <li className="py-5">
          <h3 className="font-serif text-xl font-semibold tracking-[-0.03em] text-ink">Check before you book</h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            Use the checklist to verify seat availability, transfer rules, and refund rules yourself. A Una Milla does not confirm them.
          </p>
        </li>
      </ol>
    </section>
  );
}
