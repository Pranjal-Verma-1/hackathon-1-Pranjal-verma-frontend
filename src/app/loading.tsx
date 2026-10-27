export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6" role="status" aria-live="polite">
      <p className="display text-3xl font-semibold">Opening A Una Milla</p>
      <p className="mt-3 max-w-prose text-sm leading-6 text-muted">
        The page is loading. No fares are being searched.
      </p>
      <div className="mt-6 h-1 max-w-sm overflow-hidden rounded-full bg-line" aria-hidden="true">
        <div className="estimate-bar h-1 w-full bg-depth" />
      </div>
    </div>
  );
}
