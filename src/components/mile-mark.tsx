export function MileMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" aria-hidden="true" className={className}>
      <circle cx="18" cy="18" r="15.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 18h23" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 14.5v7M18 12.5v11M25 14.5v7" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function RouteSketch({ className = "" }: { className?: string }) {
  return (
    <figure className={`max-w-xl rounded-lg border border-line bg-sheet p-4 shadow-subtle ${className}`}>
      <svg viewBox="0 0 280 72" aria-hidden="true" className="block w-full text-ink">
        <path
          d="M16 28 H264"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="route-draw"
        />
        <circle cx="16" cy="28" r="4" fill="currentColor" />
        <circle cx="140" cy="28" r="5" className="text-marker" fill="currentColor" />
        <circle cx="264" cy="28" r="4" fill="currentColor" />
        <g fill="currentColor" fontFamily="var(--font-schibsted), sans-serif" fontSize="13">
          <text x="16" y="56">
            Depart
          </text>
          <text x="140" y="56" textAnchor="middle">
            1 mile
          </text>
          <text x="264" y="56" textAnchor="end">
            Arrive
          </text>
        </g>
      </svg>
      <figcaption className="text-sm leading-6 text-muted">
        A mile along the route. This drawing is not a flight, a fare, or an award seat.
      </figcaption>
    </figure>
  );
}

export function HopMark({ stops }: { stops: 2 | 3 }) {
  const points = stops === 2 ? [8, 56] : [8, 32, 56];
  return (
    <svg viewBox="0 0 64 16" aria-hidden="true" className="mt-5 h-4 w-16">
      <path d="M8 8h48" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {points.map((x) => (
        <circle key={x} cx={x} cy="8" r={x === 32 ? 2.5 : 3.5} fill="currentColor" />
      ))}
    </svg>
  );
}
