import { cloneElement, type ReactElement } from "react";

type ControlProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | undefined;
};

export const controlClass =
  "min-h-12 w-full border border-line bg-sheet px-3 text-base text-ink outline-none";

export const primaryButtonClass =
  "inline-flex min-h-12 items-center justify-center bg-marker px-5 text-base font-semibold text-ink transition-colors hover:bg-[#e0b033] disabled:cursor-not-allowed disabled:bg-sheet disabled:text-muted";

export const secondaryButtonClass =
  "inline-flex min-h-12 items-center justify-center border border-depth bg-sheet px-5 text-base font-semibold text-ink transition-colors hover:bg-paper";

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
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
      </label>
      {hint ? (
        <p id={hintId} className="mt-1 text-sm leading-5 text-muted">
          {hint}
        </p>
      ) : null}
      <div className="mt-2">{control}</div>
      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-sm font-medium text-cost">
          {error}
        </p>
      ) : null}
    </div>
  );
}
