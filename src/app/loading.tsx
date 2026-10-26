export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10" role="status" aria-live="polite">
      <p className="text-lg font-semibold">Opening A Una Milla</p>
      <p className="mt-2 max-w-prose text-sm leading-6 text-muted">
        The page is loading. No fares are being searched.
      </p>
      <div className="mt-6 h-1 bg-line" aria-hidden="true">
        <div className="estimate-bar h-1 w-full bg-depth" />
      </div>
    </div>
  );
}
