import { RouteSketch } from "./mile-mark";

export function HeroVisual() {
  return (
    <div className="mx-auto w-full max-w-lg lg:max-w-none">
      <RouteSketch />
      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-muted">Cash fare</dt>
          <dd className="mt-1 font-semibold tabular-nums text-ink">€186.00</dd>
        </div>
        <div>
          <dt className="text-muted">Points</dt>
          <dd className="mt-1 font-semibold tabular-nums text-ink">12,500</dd>
        </div>
        <div>
          <dt className="text-muted">Taxes and fees</dt>
          <dd className="mt-1 font-semibold tabular-nums text-ink">€42.00</dd>
        </div>
      </dl>
      <p className="mt-4 text-sm leading-6 text-muted">
        Madrid to Barcelona sample, estimated difference €144.00. Points are treated as already earned and are not given a price. Not a live fare, an award seat, or a booking.
      </p>
    </div>
  );
}
