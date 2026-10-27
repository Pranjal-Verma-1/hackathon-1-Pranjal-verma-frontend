export const STEPS = [
  { id: "mode", label: "Choose", number: "1" },
  { id: "trip", label: "Trip", number: "2" },
  { id: "compare", label: "Compare", number: "3" },
  { id: "guide", label: "Guidance", number: "4" },
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
  const currentIndex = STEPS.findIndex((step) => step.id === current);

  return (
    <nav aria-label="Trip progress" className="w-full">
      <ol className="grid grid-cols-4 gap-2 sm:gap-4 border-b border-line pb-4">
        {STEPS.map((step, index) => {
          const active = step.id === current;
          const enabled = canVisit(step.id);
          const done = enabled && index < currentIndex;

          return (
            <li key={step.id}>
              <button
                type="button"
                aria-current={active ? "step" : undefined}
                disabled={!enabled}
                onClick={() => onVisit(step.id)}
                className={`group flex w-full flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-2.5 rounded-lg p-2 text-left transition-all ${
                  active
                    ? "bg-sheet border border-line shadow-subtle cursor-default"
                    : done
                      ? "cursor-pointer hover:bg-sheet hover:border-line border border-transparent"
                      : "cursor-not-allowed opacity-50 border border-transparent"
                }`}
              >
                <span
                  className={`flex size-6 sm:size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    active
                      ? "bg-ink text-white shadow-sm"
                      : done
                        ? "bg-ink/10 text-ink font-semibold"
                        : "bg-subtle text-muted"
                  }`}
                >
                  {done ? "✓" : step.number}
                </span>
                <div className="flex flex-col text-center sm:text-left">
                  <span
                    className={`text-xs sm:text-sm font-semibold tracking-tight transition-colors ${
                      active ? "text-ink" : done ? "text-ink group-hover:text-black" : "text-muted"
                    }`}
                  >
                    {step.label}
                  </span>
                  <span className="hidden sm:inline text-[11px] text-tertiary">
                    {step.id === "mode"
                      ? "Select format"
                      : step.id === "trip"
                        ? "Enter details"
                        : step.id === "compare"
                          ? "Financial math"
                          : "Final checklist"}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
