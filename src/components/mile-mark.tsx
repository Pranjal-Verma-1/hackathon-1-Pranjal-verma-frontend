export function MileMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <path
        d="M5 24C11 24 12.5 8 27 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="5" cy="24" r="1.7" fill="currentColor" />
      <circle cx="27" cy="8" r="2.6" fill="currentColor" />
    </svg>
  );
}

export function CheckIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <path
        d="M3.5 8.25 6.4 11.2 12.5 4.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArrowIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <path
        d="M3 8h10M9.5 4.5 13 8l-3.5 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ExternalIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <path
        d="M6 4H4.5A1.5 1.5 0 0 0 3 5.5v6A1.5 1.5 0 0 0 4.5 13h6a1.5 1.5 0 0 0 1.5-1.5V10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M8.5 3.5H12.5V7.5M12.2 3.8 7 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RouteSketch({ className = "" }: { className?: string }) {
  return (
    <figure className={`rounded-lg bg-ink p-5 text-foam shadow-float ${className}`}>
      <svg viewBox="0 0 320 108" aria-hidden="true" className="block w-full">
        <path
          d="M28 78C90 78 120 22 292 28"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="route-draw text-marker"
        />
        <circle cx="28" cy="78" r="4.5" className="text-foam" fill="currentColor" />
        <circle cx="292" cy="28" r="6" className="text-marker" fill="currentColor" />
        <g fill="currentColor" className="text-foam" fontFamily="var(--font-schibsted), sans-serif" fontSize="13">
          <text x="28" y="100">
            MAD
          </text>
          <text x="292" y="54" textAnchor="end">
            BCN
          </text>
        </g>
      </svg>
      <figcaption className="mt-2 text-sm leading-6 text-foam-muted">
        A mile along the route. This drawing is not a flight, a fare, or an award seat.
      </figcaption>
    </figure>
  );
}

export function HopMark({ stops }: { stops: 2 | 3 }) {
  const points = stops === 2 ? [8, 56] : [8, 32, 56];
  return (
    <svg viewBox="0 0 64 16" aria-hidden="true" className="h-4 w-16 text-current">
      <path d="M8 8h48" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {points.map((x) => (
        <circle key={x} cx={x} cy="8" r={x === 32 ? 2.5 : 3.5} fill="currentColor" />
      ))}
    </svg>
  );
}
