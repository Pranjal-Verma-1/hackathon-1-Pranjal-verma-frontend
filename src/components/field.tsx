import type { ReactElement, ReactNode } from "react";
import { stampControl } from "@/lib/control-props";

export const controlClass =
  "min-h-12 w-full max-w-full rounded-sm border border-line bg-sheet px-3 text-base leading-normal text-ink outline-none transition-colors placeholder:text-tertiary hover:border-ink focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-3";

export const primaryButtonClass =
  "inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-sm bg-marker px-6 text-base font-semibold text-ink shadow-[inset_0_-1px_0_rgba(16,32,51,0.18)] transition-colors duration-150 hover:bg-marker-press active:bg-marker-active disabled:cursor-not-allowed disabled:hover:bg-marker sm:w-auto";

export const secondaryButtonClass =
  "inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-sm border border-ink bg-transparent px-6 text-base font-semibold text-ink transition-colors duration-150 hover:bg-sheet active:bg-paper disabled:cursor-not-allowed disabled:border-line disabled:text-muted sm:w-auto";

export const headingClass =
  "display text-[2.35rem] font-semibold leading-[1.08] tracking-[-0.03em] text-balance text-ink outline-none sm:text-5xl";

export const sectionTitleClass = "display text-2xl font-semibold leading-snug tracking-[-0.03em] text-ink";

export const panelClass = "rounded-lg border border-line bg-sheet";

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
  children: ReactElement<{ children?: ReactNode }>;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const control = stampControl(children, {
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
