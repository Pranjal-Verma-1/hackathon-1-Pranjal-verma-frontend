export const STEPS = [
  { id: "mode", label: "Choose" },
  { id: "trip", label: "Trip" },
  { id: "compare", label: "Compare" },
  { id: "guide", label: "Guidance" },
] as const;

export type StepId = (typeof STEPS)[number]["id"];

export function StepRail({
  current,
  canVisit,
  onVisit,
}: {
  current: StepId;
  canVisit: (step: StepId) => boolean;
  onVisit: (step: StepId) => void;
}) {
  return (
    <nav aria-label="Trip steps">
      <ol className="grid grid-cols-4">
        {STEPS.map((step) => {
          const active = step.id === current;
          const enabled = canVisit(step.id);
          return (
            <li key={step.id}>
              <button
                type="button"
                aria-current={active ? "step" : undefined}
                disabled={!enabled}
                onClick={() => onVisit(step.id)}
                className={`flex min-h-12 w-full flex-col items-center justify-end gap-2 text-sm disabled:cursor-not-allowed disabled:opacity-100 ${
                  active ? "font-semibold text-ink" : "text-muted"
                }`}
              >
                {step.label}
                <span
                  className={`h-0.5 w-full ${active ? "bg-marker" : "bg-line"}`}
                  aria-hidden="true"
                />
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
