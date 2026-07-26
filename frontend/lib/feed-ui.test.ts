import assert from "node:assert/strict";
import test from "node:test";
import { hasHorizontalOverflow } from "./feed-ui.ts";

test("reports overflow when content remains to the right", () => {
  assert.equal(
    hasHorizontalOverflow({ scrollWidth: 201, clientWidth: 200, scrollLeft: 0 }),
    false,
  );
  assert.equal(
    hasHorizontalOverflow({ scrollWidth: 202, clientWidth: 200, scrollLeft: 0 }),
    true,
  );
});

test("reports no overflow when the container fits its content", () => {
  assert.equal(
    hasHorizontalOverflow({ scrollWidth: 200, clientWidth: 200, scrollLeft: 0 }),
    false,
  );
});

test("reports no overflow at the right edge", () => {
  assert.equal(
    hasHorizontalOverflow({ scrollWidth: 400, clientWidth: 200, scrollLeft: 199 }),
    false,
  );
});
