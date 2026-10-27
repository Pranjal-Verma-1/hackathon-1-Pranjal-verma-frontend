import { CheckIcon } from "./mile-mark";

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
      <ol className="grid grid-cols-4 gap-2 border-b border-line pb-4 sm:gap-4">
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
                className={`group flex w-full flex-col items-center gap-2 rounded-sm p-1 text-left sm:flex-row sm:items-center ${
                  enabled ? "cursor-pointer" : "cursor-not-allowed"
                }`}
              >
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    active
                      ? "bg-marker text-ink"
                      : done
                        ? "bg-ink text-foam"
                        : "border border-line bg-paper text-muted"
                  }`}
                >
                  {done ? <CheckIcon /> : step.number}
                </span>
                <span className="flex flex-col text-center sm:text-left">
                  <span className={`text-sm font-semibold ${active || done ? "text-ink" : "text-muted"}`}>{step.label}</span>
                  <span className="hidden text-xs text-muted sm:inline">
                    {step.id === "mode"
                      ? "Select a mode"
                      : step.id === "trip"
                        ? "Enter the quote"
                        : step.id === "compare"
                          ? "See the difference"
                          : "Check before booking"}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
