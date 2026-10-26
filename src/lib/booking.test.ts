import assert from "node:assert/strict";
import { test } from "node:test";
import { BOOKING_CHECKS, CARRIERS, bookingHref } from "./booking";

test("returns only known https homepages", () => {
  const hrefs = new Set<string>();
  for (const carrier of CARRIERS) {
    const href = bookingHref(carrier.id);
    assert.equal(href, carrier.href);
    assert.ok(href?.startsWith("https://"));
    hrefs.add(carrier.id);
  }
  assert.equal(hrefs.size, CARRIERS.length);
});

test("does not turn an unknown or raw url into a booking link", () => {
  assert.equal(bookingHref(""), null);
  assert.equal(bookingHref("iberia "), null);
  assert.equal(bookingHref("https://www.iberia.com/"), null);
  assert.equal(bookingHref("javascript:alert(1)"), null);
});

test("keeps a booking checklist that does not claim the app tickets the trip", () => {
  assert.ok(BOOKING_CHECKS.length >= 4);
  assert.match(BOOKING_CHECKS.join(" "), /does not issue tickets/);
});
