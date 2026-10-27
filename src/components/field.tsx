import { cloneElement, type ReactElement } from "react";

type ControlProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | undefined;
};

export const controlClass =
  "min-h-12 w-full max-w-full rounded-md border border-line-strong bg-sheet px-3.5 text-base leading-normal text-ink outline-none transition-all placeholder:text-tertiary hover:border-ink focus:border-ink focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2";

export const primaryButtonClass =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-ink px-6 text-sm font-semibold text-white shadow-subtle transition-all hover:-translate-y-0.5 hover:shadow-card hover:bg-[#000000] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none sm:w-auto cursor-pointer";

export const secondaryButtonClass =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-line-strong bg-sheet px-6 text-sm font-semibold text-ink shadow-subtle transition-all hover:-translate-y-0.5 hover:bg-subtle hover:border-ink active:translate-y-0 disabled:cursor-not-allowed disabled:text-muted disabled:hover:translate-y-0 sm:w-auto cursor-pointer";

export const headingClass =
  "display text-3xl font-bold leading-[1.12] tracking-tight text-balance text-ink outline-none sm:text-4xl lg:text-5xl";

export const sectionTitleClass = "text-base font-bold tracking-tight text-ink";

export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactElement<ControlProps>;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const control = cloneElement(children, {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="block text-sm font-semibold text-ink">
          {label}
        </label>
        {hint ? (
          <span id={hintId} className="text-xs text-muted">
            {hint}
          </span>
        ) : null}
      </div>
      <div className="mt-1.5">{control}</div>
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-semibold leading-5 text-cost">
          {error}
        </p>
      ) : null}
    </div>
  );
}
