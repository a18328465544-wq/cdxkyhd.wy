import assert from "node:assert/strict";
import test from "node:test";
import { resolveStandalonePage } from "./pageRoutes";

test("resolves the existing standalone page paths and aliases", () => {
  assert.equal(resolveStandalonePage("/") , null);
  assert.equal(resolveStandalonePage("/inventory"), null);
  assert.equal(resolveStandalonePage("/gpu-sn")?.id, "gpu-sn");
  assert.equal(resolveStandalonePage("/gpu-sn.php")?.id, "gpu-sn");
  assert.equal(resolveStandalonePage("/community/post/example")?.id, "community");
  assert.equal(resolveStandalonePage("/build/")?.id, "build");
  assert.equal(resolveStandalonePage("/tools/keyboard")?.id, "hardware-tools");
  assert.equal(resolveStandalonePage("/gpu-ranking/")?.id, "gpu-ranking");
  assert.equal(resolveStandalonePage("/tools/hashrate-rental/")?.id, "hardware-tools");
});

test("only the hardware-tools route retains homepage section prefetch", () => {
  assert.equal(resolveStandalonePage("/tools")?.prefetchHomeSections, true);
  assert.equal(resolveStandalonePage("/community")?.prefetchHomeSections, false);
});
