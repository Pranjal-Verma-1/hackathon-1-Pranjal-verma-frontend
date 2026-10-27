export const HOW_IT_WORKS_ID = "how-it-works";
export const PRINCIPLES_ID = "principles";
export const OPEN_COMPARE_EVENT = "aum-open-compare";

export const HEADER_LINKS = [
  { label: "Compare", kind: "compare-step" },
  { label: "How it works", kind: "section", href: `#${HOW_IT_WORKS_ID}` },
  { label: "Methodology", kind: "section", href: `#${PRINCIPLES_ID}` },
] as const;

export function requestCompareStep() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN_COMPARE_EVENT));
}
