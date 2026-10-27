import type { TripMode } from "./trip";

/** Mode used when the hero “Compare a trip” action advances immediately. */
export function modeForHeroContinue(mode: TripMode | null): TripMode {
  return mode ?? "quick";
}

export type ChecklistEvent = "comparison-ready" | "open-guidance" | "edit-field" | "start-over";

/** A new result and a full restart clear the checklist. Looking or editing does not. */
export function checklistAfter(event: ChecklistEvent, current: boolean[]): boolean[] {
  if (event === "comparison-ready" || event === "start-over") {
    return current.map(() => false);
  }
  return current;
}
