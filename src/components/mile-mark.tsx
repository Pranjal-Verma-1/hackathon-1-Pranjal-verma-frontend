export function MileMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <path d="M16 3v26" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M9 9h14M11 16h10M9 23h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}
