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
  assert.equal(how && "href" in how ? how.href : "", `/#${HOW_IT_WORKS_ID}`);
  assert.equal(method && "href" in method ? method.href : "", `/#${PRINCIPLES_ID}`);
  assert.equal(HEADER_LINKS.find((link) => link.label === "Programs" && "href" in link)?.href, "/programs");
  assert.equal(HEADER_LINKS.find((link) => link.label === "Wallet" && "href" in link)?.href, "/wallet");
  assert.equal(HEADER_LINKS.find((link) => link.label === "Saved" && "href" in link)?.href, "/saved");
  assert.equal(HEADER_LINKS.find((link) => link.label === "Explorer" && "href" in link)?.href, "/explorer");
  assert.equal(HEADER_LINKS.find((link) => link.label === "Account" && "href" in link)?.href, "/account");
  assert.deepEqual(
    HEADER_LINKS.map((link) => ("href" in link ? link.href : link.kind)),
    ["compare-step", "/programs", "/wallet", "/saved", "/explorer", "/account", `/#${HOW_IT_WORKS_ID}`, `/#${PRINCIPLES_ID}`],
  );
});
