import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { stampControl } from "./control-props";

test("wrapped price inputs receive the id and error description", () => {
  const html = renderToStaticMarkup(
    stampControl(
      createElement(
        "div",
        { className: "relative" },
        createElement("span", null, "€"),
        createElement("input", { className: "fare" }),
      ),
      {
        id: "cashPrice",
        "aria-invalid": true,
        "aria-describedby": "cashPrice-hint cashPrice-error",
      },
    ),
  );

  assert.match(html, /<input[^>]*id="cashPrice"/);
  assert.match(html, /aria-invalid="true"/);
  assert.match(html, /aria-describedby="cashPrice-hint cashPrice-error"/);
  assert.doesNotMatch(html, /<div[^>]*id="cashPrice"/);
});
