export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
      {/* Soft ambient background glow */}
      <div
        className="pointer-events-none absolute -inset-1.5 rounded-3xl bg-gradient-to-tr from-marker/15 via-accent/10 to-transparent blur-xl opacity-70"
        aria-hidden="true"
      />

      <div className="relative rounded-2xl border border-line-strong bg-sheet p-5 sm:p-7 shadow-float">
        {/* Visual Header Strip */}
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2">
            <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Flight Corridor Model
            </span>
          </div>
          <span className="rounded-full border border-line bg-subtle px-2.5 py-0.5 text-[11px] font-semibold text-muted">
            MAD ➔ BCN
          </span>
        </div>

        {/* Flight Route Map Graphic */}
        <div className="mt-5 rounded-xl border border-line bg-paper p-4 sm:p-5">
          <div className="flex items-center justify-between">
            {/* Origin Node */}
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-widest text-muted">Origin</span>
              <span className="text-xl font-bold tracking-tight text-ink">MAD</span>
              <span className="text-xs text-muted">Madrid Barajas</span>
            </div>

            {/* Route Stats in Center */}
            <div className="flex flex-col items-center px-2">
              <span className="rounded-full bg-subtle border border-line px-2 py-0.5 text-[10px] font-semibold text-tertiary">
                505 km • Non-stop
              </span>
            </div>

            {/* Destination Node */}
            <div className="flex flex-col text-right">
              <span className="text-xs font-bold uppercase tracking-widest text-muted">Destination</span>
              <span className="text-xl font-bold tracking-tight text-ink">BCN</span>
              <span className="text-xs text-muted">Barcelona El Prat</span>
            </div>
          </div>

          {/* SVG Flight Path Arc */}
          <div className="relative my-3">
            <svg viewBox="0 0 320 60" fill="none" className="w-full overflow-visible" aria-hidden="true">
              {/* Ground baseline */}
              <line x1="10" y1="50" x2="310" y2="50" stroke="#EBEBE6" strokeWidth="1.5" strokeDasharray="3 3" />
              {/* Flight Arc */}
              <path
                d="M 20 48 Q 160 6 300 48"
                stroke="#121212"
                strokeWidth="2"
                strokeLinecap="round"
                className="route-draw"
              />
              {/* Origin Circle */}
              <circle cx="20" cy="48" r="4.5" fill="#121212" />
              <circle cx="20" cy="48" r="2" fill="#FFFFFF" />
              {/* Peak Plane / Midpoint Marker */}
              <g transform="translate(160, 27)">
                <circle cx="0" cy="0" r="11" fill="#FFFFFF" stroke="#EBEBE6" strokeWidth="1.5" />
                <path
                  d="M -5 1 L 5 -3 L 2 1 L 5 4 Z"
                  fill="#E0AE3A"
                  transform="rotate(-5)"
                />
              </g>
              {/* Destination Circle */}
              <circle cx="300" cy="48" r="4.5" fill="#121212" />
              <circle cx="300" cy="48" r="2" fill="#FFFFFF" />
            </svg>
          </div>

          <div className="flex items-center justify-between text-[11px] text-tertiary border-t border-line/80 pt-2.5">
            <span>Illustrative sample pair</span>
            <span>Est. flight: 1h 15m</span>
          </div>
        </div>

        {/* Compact Quotes Comparison Strip */}
        <div className="mt-4 grid grid-cols-2 gap-3 text-left">
          <div className="rounded-xl border border-line bg-sheet p-3.5 shadow-subtle">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-muted">
              Cash Ticket
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold tracking-tight text-ink">€186.00</span>
            </div>
            <span className="mt-1 block text-[11px] text-tertiary">All-in published fare</span>
          </div>

          <div className="rounded-xl border border-line bg-sheet p-3.5 shadow-subtle">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-muted">
              Award Quote
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold tracking-tight text-ink">12,500</span>
              <span className="text-xs font-semibold text-muted">pts</span>
            </div>
            <span className="mt-1 block text-[11px] text-tertiary">+ €42.00 taxes & fees</span>
          </div>
        </div>

        {/* Highlighted Estimated Savings Hero Panel */}
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/90 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
              <svg viewBox="0 0 16 16" className="size-3.5 fill-emerald-700" aria-hidden="true">
                <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
              </svg>
              Favorable Trade
            </span>
            <span className="font-mono text-xs font-bold text-emerald-800">
              +77.4% Net Saved
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-xs font-medium text-emerald-800/80">Net cash kept in pocket:</span>
              <div className="text-2xl font-bold tracking-tight text-emerald-900">
                +€144.00
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-emerald-800/80">Value per point:</span>
              <div className="text-base font-bold text-emerald-900">
                1.15 ¢/pt
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer footer inside visual */}
        <p className="mt-3 text-center text-[11px] leading-tight text-tertiary">
          Sample data for preview. Your actual savings calculate from the figures you enter.
        </p>
      </div>
    </div>
  );
}
