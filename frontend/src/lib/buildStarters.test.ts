import assert from "node:assert/strict";
import test from "node:test";
import { BUILD_STARTERS, resolveBuildStarter, type StarterPart } from "./buildStarters";

const part = (id: string, name: string, category: string, price = 1000, quantity = 1): StarterPart => ({ id, name, category, price, quantity, condition: "95新", specs: "" });

test("starter profiles match real stock without hardcoded item IDs", () => {
  const parts = [part("new-cpu", "Intel 14600KF 散片", "CPU"), part("new-gpu", "华硕 RTX5060 8G", "GPU")];
  const result = resolveBuildStarter(parts, "gaming");
  assert.equal(result.cpu?.id, "new-cpu");
  assert.equal(result.gpu?.id, "new-gpu");
  assert.equal(result.available, true);
  assert.deepEqual(Object.keys(result).sort(), ["available", "cpu", "gpu"]);
});

test("starter profiles do not invent missing, unsaleable or miscategorized parts", () => {
  for (const profile of BUILD_STARTERS) assert.equal(resolveBuildStarter([], profile.id).available, false);
  const parts = [part("sold", "Intel 14600KF", "CPU", 1000, 0), part("zero-price", "RTX5060", "GPU", 0), part("wrong", "RTX5060", "Accessories"), part("unknown-stock", "RTX5060", "GPU")];
  parts[3].quantity = undefined;
  parts.push({ ...part("shipped", "RTX5060", "GPU"), status: "已出库" });
  assert.equal(resolveBuildStarter(parts, "gaming").available, false);
  assert.equal(resolveBuildStarter(parts, "gaming").gpu, undefined);
});

test("profile preferences are deterministic and preserve exact source items", () => {
  const parts = [part("cpu", "Intel I9-14900KF 盒装", "CPU"), part("gpu-high", "七彩虹 RTX4080 SUPER 16G", "GPU", 6000), part("gpu-low", "影驰 RTX4080 SUPER 16G", "GPU", 5800)];
  assert.equal(resolveBuildStarter(parts, "productivity").gpu, parts[2]);
  assert.equal(resolveBuildStarter([...parts].reverse(), "productivity").gpu?.id, "gpu-low");
  assert.deepEqual(parts.map(part => part.id), ["cpu", "gpu-high", "gpu-low"]);
});

test("local AI has a separate core pair and never substitutes an unrelated cheap card", () => {
  const parts = [part("cpu", "Intel 14600KF", "CPU"), part("wrong-gpu", "RTX3060", "GPU", 1000), part("ai-gpu", "七彩虹 RTX3090 火神 24G", "GPU", 8000)];
  assert.equal(resolveBuildStarter(parts, "ai").gpu?.id, "ai-gpu");
  assert.equal(resolveBuildStarter(parts.slice(0, 2), "ai").available, false);
});
