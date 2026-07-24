import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const deployWorkflow = await readFile(new URL("../.github/workflows/deploy.yml", import.meta.url), "utf8");

test("unchanged services resolve to the recorded successful SHA, never latest", () => {
  assert.match(deployWorkflow, /FRONTEND_IMAGE_TAG: \$\{\{ steps\.versions\.outputs\.frontend \}\}/);
  assert.match(deployWorkflow, /BACKEND_IMAGE_TAG: \$\{\{ steps\.versions\.outputs\.backend \}\}/);
  assert.doesNotMatch(deployWorkflow, /\|\| 'latest'/);
});

test("pre-migration backup fails closed and verifies a newly created backup", () => {
  assert.match(deployWorkflow, /LOCK_MODE=fail/);
  assert.match(deployWorkflow, /BACKUP_CREATED=/);
});
