import assert from "node:assert/strict";
import test from "node:test";
import { checklistAfter, modeForHeroContinue } from "./journey-rules";
import { HEADER_LINKS, HOW_IT_WORKS_ID, PRINCIPLES_ID } from "./navigation";

test("hero continue selects Quick Flight when no mode is chosen", () => {
  assert.equal(modeForHeroContinue(null), "quick");
  assert.equal(modeForHeroContinue("quick"), "quick");
  assert.equal(modeForHeroContinue("full"), "full");
});

test("a successful comparison clears the checklist and editing does not", () => {
  const checked = [true, false, true, false, true];
  assert.deepEqual(checklistAfter("comparison-ready", checked), [false, false, false, false, false]);
  assert.deepEqual(checklistAfter("start-over", checked), [false, false, false, false, false]);
  assert.equal(checklistAfter("open-guidance", checked), checked);
  assert.equal(checklistAfter("edit-field", checked), checked);
});

test("header links open the compare step and real sections", () => {
  const compare = HEADER_LINKS.find((link) => link.label === "Compare");
  const how = HEADER_LINKS.find((link) => link.label === "How it works");
  const method = HEADER_LINKS.find((link) => link.label === "Methodology");

  assert.equal(compare?.kind, "compare-step");
  assert.equal("href" in (compare ?? {}), false);
  assert.equal(how && "href" in how ? how.href : "", `#${HOW_IT_WORKS_ID}`);
  assert.equal(method && "href" in method ? method.href : "", `#${PRINCIPLES_ID}`);
  assert.deepEqual(
    HEADER_LINKS.map((link) => ("href" in link ? link.href : link.kind)),
    ["compare-step", `#${HOW_IT_WORKS_ID}`, `#${PRINCIPLES_ID}`],
  );
});
