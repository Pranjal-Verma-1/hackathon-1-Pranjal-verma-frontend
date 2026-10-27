"use client";

import { useEffect } from "react";
import { primaryButtonClass } from "@/components/field";

export default function AppError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="display text-4xl font-semibold">This screen could not be shown</h1>
      <p className="mt-4 max-w-prose text-base leading-7 text-muted">
        Something unexpected happened. Nothing was booked, because this app does not send trips to
        an airline. Try the screen again.
      </p>
      <button type="button" className={`${primaryButtonClass} mt-8`} onClick={() => retry()}>
        Try again
      </button>
    </main>
  );
}
