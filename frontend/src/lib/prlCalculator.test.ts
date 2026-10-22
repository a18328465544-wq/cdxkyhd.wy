import assert from "node:assert/strict";
import test from "node:test";
import { calculatePrl, prlDefaults } from "./prlCalculator";

const inputs = { ...prlDefaults, mode: "actual", cards: "2", actualCoins: "10", hours: "12", cardWatts: "200", hostWatts: "100", standbyWatts: "50", electricity: "0.5", otherDaily: "2", price: "10", sellFee: "10", investment: "1000", days: "10" };
const near = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);

test("PRL actual receipts are not multiplied by cards or charged pool fees twice", () => {
  const result = calculatePrl({ ...inputs, hashrate: "invalid", yieldRate: "invalid", poolFee: "invalid", minerFee: "invalid", accepted: "invalid" });
  assert.equal(result.valid, true);
  const data = result.data!;
  assert.equal(data.coins, 10);
  near(data.energy, 6.6);
  near(data.powerCost, 3.3);
  near(data.dailyNet!, 84.7);
  near(data.balance!, -153);
  near(data.paybackDays!, 1000 / 84.7);
  assert.equal(data.withinPlan, false);
});

test("PRL hashrate output applies time, acceptance and sequential fees exactly once", () => {
  const data = calculatePrl({ ...inputs, mode: "hashrate", hashrate: "100", yieldRate: "0.1", accepted: "80", minerFee: "10", poolFee: "10", actualCoins: "invalid" }).data!;
  assert.ok(data);
  near(data.rawCoins!, 8);
  near(data.minerCoins, 0.8);
  near(data.poolCoins, 0.72);
  near(data.coins!, 6.48);
});

test("PRL missing price and explicit zero price remain distinct", () => {
  const missing = calculatePrl({ ...inputs, price: "" }).data!;
  assert.equal(missing.dailyNet, null);
  assert.equal(missing.paybackStatus, "missingPrice");
  const zero = calculatePrl({ ...inputs, price: "0" }).data!;
  near(zero.dailyNet!, -5.3);
  assert.equal(zero.paybackStatus, "notProfitable");
});

test("PRL initial investment is not part of daily operating expense", () => {
  const a = calculatePrl(inputs).data!;
  const b = calculatePrl({ ...inputs, investment: "2000" }).data!;
  assert.equal(a.dailyNet, b.dailyNet);
  near(a.balance! - b.balance!, 1000);
  near(b.paybackDays!, a.paybackDays! * 2);
  assert.equal(calculatePrl({ ...inputs, investment: "" }).data!.paybackStatus, "missingInvestment");
  assert.equal(calculatePrl({ ...inputs, investment: "0" }).data!.paybackStatus, "zeroInvestment");
});

test("PRL invalid and overflowing parameters cannot produce a plausible result", () => {
  for (const change of [{ cards: "1.5" }, { cards: "" }, { cardWatts: "-1" }, { hours: "25" }, { electricity: "NaN" }, { price: "Infinity" }, { sellFee: "101" }, { days: "0" }, { mode: "unknown" }, { actualCoins: "1e308", price: "1e308" }]) {
    const result = calculatePrl({ ...inputs, ...change });
    assert.equal(result.valid, false, JSON.stringify(change));
    assert.equal(result.data, null);
  }
});
