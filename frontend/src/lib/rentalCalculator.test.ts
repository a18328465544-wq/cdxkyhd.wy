import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate, convertUnit, convertBasis } from './rentalCalculator.js';
const fixture = {
  unit: 'TH/s', hashrate: '100', hours: '24', rentRate: '2', rentBasis: 'day',
  revenueRate: '3', revenueBasis: 'day', accepted: '100', serviceFee: '10',
  feeBase: 'rent', otherCost: '5', powerIncluded: false, powerMode: 'total',
  powerWatts: '1000', electricityRate: '0.5'
};
function run(overrides = {}) { return calculate({ ...fixture, ...overrides }); }
function close(actual, expected) { assert.ok(Math.abs(actual - expected) < 1e-10 * Math.max(1, Math.abs(expected)), `${actual} != ${expected}`); }

test('daily quote includes every cost once', () => {
  const r = run(); assert.equal(r.valid, true);
  assert.equal(r.baseRent, 200); assert.equal(r.serviceCost, 20);
  assert.equal(r.energy, 24); assert.equal(r.powerCost, 12);
  assert.equal(r.totalCost, 237); assert.equal(r.gross, 300); assert.equal(r.net, 63);
  close(r.roi, 63 / 237 * 100); close(r.maxRentRate, 283 / 110);
});
test('income fee uses delivered revenue and changes with scenarios', () => {
  const r = run({ feeBase: 'income' }); assert.equal(r.totalCost, 247); assert.equal(r.net, 53); close(r.maxRentRate, 2.53);
  const lower = run({ feeBase: 'income', revenueRate: '2.1' }); assert.equal(lower.serviceCost, 21); assert.equal(lower.net, -28);
});
test('hourly quotes and short rentals use hours without an extra day factor', () => {
  const r = run({ hours: '12', rentBasis: 'hour', rentRate: '0.1', revenueBasis: 'hour', revenueRate: '0.2', accepted: '80', serviceFee: '0', otherCost: '0', powerIncluded: true });
  assert.equal(r.baseRent, 120); assert.equal(r.gross, 192); assert.equal(r.net, 72); close(r.maxRentRate, 0.16);
});
test('total order quotes are never multiplied by size or duration', () => {
  const r = run({ rentBasis: 'total', rentRate: '500', revenueBasis: 'total', revenueRate: '800', accepted: '90', powerIncluded: true });
  assert.equal(r.baseRent, 500); assert.equal(r.gross, 720); assert.equal(r.net, 165); close(r.maxRentRate, 650);
});
test('income optional for cost calculation', () => {
  const r = run({ revenueRate: '' }); assert.equal(r.valid, true); assert.equal(r.totalCost, 237); assert.equal(r.gross, null); assert.equal(r.net, null); assert.equal(r.roi, null); assert.equal(r.maxRentRate, null);
});
test('income fee cannot silently become zero when income is unknown', () => {
  const r = run({ revenueRate: '', feeBase: 'income' }); assert.equal(r.serviceCost, null); assert.equal(r.totalCost, null); assert.equal(r.net, null);
  assert.equal(run({ revenueRate: '', feeBase: 'income', serviceFee: '0' }).totalCost, 217);
});
test('power alone exceeding revenue has no break-even rental quote', () => {
  const r = run({ revenueRate: '0.1' }); assert.equal(r.breakEvenStatus, 'impossible'); assert.equal(r.maxRentRate, null);
});
test('zero rent may be the actual break-even quote', () => {
  const r = run({ revenueRate: '0', otherCost: '0', powerIncluded: true }); assert.equal(r.breakEvenStatus, 'available'); assert.equal(r.maxRentRate, 0);
});
test('zero total cost has no return-rate denominator', () => {
  const r = run({ rentRate: '0', serviceFee: '0', otherCost: '0', powerIncluded: true }); assert.equal(r.totalCost, 0); assert.equal(r.net, 300); assert.equal(r.roi, null);
});
test('per-unit power is multiplied by rented capacity once', () => {
  const r = run({ powerMode: 'perUnit', powerWatts: '2' }); close(r.energy, 4.8); close(r.powerCost, 2.4);
});
test('included electricity ignores hidden stale power inputs', () => {
  const r = run({ powerIncluded: true, powerWatts: '-2', electricityRate: '' }); assert.equal(r.valid, true); assert.equal(r.powerCost, 0);
});
test('delivery rate changes income, not full-period rental or electricity', () => {
  const r = run({ accepted: '50' }); assert.equal(r.gross, 150); assert.equal(r.baseRent, 200); assert.equal(r.powerCost, 12); assert.equal(r.net, -87);
});
for (const [field, value] of [['hashrate', ''], ['hashrate', '0'], ['hours', '0'], ['hours', '-1'], ['rentRate', '-2'], ['accepted', ''], ['accepted', '101'], ['serviceFee', '-1'], ['serviceFee', '101'], ['powerWatts', ''], ['electricityRate', ''], ['revenueRate', 'abc'], ['hashrate', 'Infinity'], ['rentRate', '1e309']]) {
  test(`rejects ${field}=${JSON.stringify(value)} instead of treating it as zero`, () => {
    const r = run({ [field]: value }); assert.equal(r.valid, false); assert.ok(r.errors.some(e => e.field === field));
  });
}
test('overflow and numeric underflow do not display fabricated zero amounts', () => {
  assert.equal(run({ hashrate: '1e308', hours: '24' }).valid, false);
  assert.equal(run({ hashrate: '1e-300', hours: '1e-300' }).valid, false);
});
test('unit conversion preserves revenue, rent, energy and profit for all supported units', () => {
  const perUnit = { ...fixture, powerMode: 'perUnit', powerWatts: '10' };
  const initial = calculate(perUnit);
  for (const unit of ['GH/s', 'PH/s', 'TH/s']) {
    const converted = convertUnit(perUnit, unit); const r = calculate(converted);
    for (const key of ['gross', 'baseRent', 'powerCost', 'totalCost', 'net']) close(r[key], initial[key]);
  }
});
test('order total prices and total wattage remain unchanged during unit conversion', () => {
  const converted = convertUnit({ ...fixture, rentBasis: 'total', revenueBasis: 'total' }, 'GH/s');
  assert.equal(converted.rentRate, fixture.rentRate); assert.equal(converted.revenueRate, fixture.revenueRate); assert.equal(converted.powerWatts, fixture.powerWatts);
});
test('billing basis conversion preserves both order totals', () => {
  for (const field of ['rentBasis', 'revenueBasis']) for (const basis of ['hour', 'total', 'day']) {
    const r = calculate(convertBasis(fixture, field, basis));
    assert.equal(r.valid, true); close(r.baseRent, 200); close(r.gross, 300); close(r.net, 63);
  }
});
test('invalid basis, unit and invalid conversion quantities are rejected', () => {
  assert.equal(run({ unit: 'unknown' }).valid, false); assert.equal(run({ rentBasis: 'week' }).valid, false);
  assert.throws(() => convertBasis({ ...fixture, hours: '0' }, 'rentBasis', 'hour'));
  assert.throws(() => convertUnit({ ...fixture, rentRate: '-1' }, 'GH/s'));
});
test('sub-cent rental amounts retain precision until display', () => {
  const r = run({ hashrate: '0.01', hours: '1', rentRate: '0.001', serviceFee: '0', otherCost: '0', powerIncluded: true });
  close(r.baseRent, 0.00001 / 24); assert.ok(r.baseRent > 0);
});
test('irrelevant delivery rate does not block cost-only calculation', () => {
  const r = run({ revenueRate: '', accepted: '' }); assert.equal(r.valid, true); assert.equal(r.totalCost, 237);
});
test('floating point equality does not become a tiny loss or an impossible break-even', () => {
  const r = run({ hashrate: '1', rentRate: '0.1', revenueRate: '0.3', serviceFee: '0', otherCost: '0.2', powerIncluded: true });
  assert.equal(r.net, 0); assert.equal(r.roi, 0);
  const zeroRent = run({ hashrate: '1', rentRate: '0', revenueRate: '0.3', serviceFee: '0', otherCost: '0.2', powerMode: 'total', powerWatts: '1000', hours: '1', electricityRate: '0.1', revenueBasis: 'total' });
  assert.equal(zeroRent.breakEvenStatus, 'available'); assert.equal(zeroRent.maxRentRate, 0);
});

test('capital payback uses operating profit without deducting capital twice', () => {
  const r = run({ initialInvestment: '6300', projectionDays: '100' });
  assert.equal(r.valid, true); assert.equal(r.net, 63); assert.equal(r.totalCost, 237);
  assert.equal(r.dailyNet, 63); assert.equal(r.monthlyNet, 1890); assert.equal(r.yearlyNet, 22995);
  assert.equal(r.paybackDays, 100); assert.equal(r.projectedOperatingNet, 6300);
  assert.equal(r.projectedCashBalance, 0); assert.equal(r.investmentRoi, 0);
  assert.equal(r.paybackWithinPlan, true);
});
test('a profitable order may still not recover capital within its operating plan', () => {
  const r = run({ initialInvestment: '6300', projectionDays: '30' });
  assert.equal(r.paybackStatus, 'available'); assert.equal(r.paybackDays, 100);
  assert.equal(r.projectedCashBalance, -4410); assert.equal(r.investmentRoi, -70);
  assert.equal(r.paybackWithinPlan, false);
});
test('owned equipment has no rental cost and charges service fees on delivered income', () => {
  const r = run({ mode: 'owned', rentRate: '', initialInvestment: '2530', projectionDays: '30' });
  assert.equal(r.valid, true); assert.equal(r.baseRent, 0); assert.equal(r.feeBase, 'income');
  assert.equal(r.serviceCost, 30); assert.equal(r.totalCost, 47); assert.equal(r.net, 253);
  assert.equal(r.paybackDays, 10); assert.equal(r.projectedCashBalance, 5060);
  assert.equal(r.investmentRoi, 200); assert.equal(r.breakEvenStatus, 'notApplicable'); assert.equal(r.maxRentRate, null);
});
test('owned equipment ignores stale rental fields even during unit conversion', () => {
  const input = { ...fixture, mode: 'owned', rentRate: '-1', rentBasis: 'invalid', initialInvestment: '2530' };
  const r = calculate(convertUnit(input, 'GH/s'));
  assert.equal(r.valid, true); assert.equal(r.baseRent, 0); close(r.paybackDays, 10);
});
test('normalizing a partial-day sample gives the same daily profit and payback', () => {
  const full = run({ mode: 'owned', powerIncluded: true, otherCost: '0', initialInvestment: '2700' });
  const half = run({ mode: 'owned', powerIncluded: true, otherCost: '0', initialInvestment: '2700', hours: '12' });
  assert.equal(full.dailyNet, 270); assert.equal(half.net, 135);
  assert.equal(half.dailyNet, full.dailyNet); assert.equal(half.paybackDays, full.paybackDays);
});
test('zero and negative operating profit cannot recover positive capital', () => {
  for (const revenueRate of ['2.37', '2']) {
    const r = run({ initialInvestment: '1000', revenueRate });
    assert.equal(r.paybackStatus, 'notProfitable'); assert.equal(r.paybackDays, null);
    assert.equal(r.paybackWithinPlan, false);
  }
});
test('unknown capital, unknown income and explicit zero capital stay distinct', () => {
  const missingCapital = run(); assert.equal(missingCapital.paybackStatus, 'missingInvestment'); assert.equal(missingCapital.paybackDays, null);
  assert.equal(missingCapital.projectedCashBalance, null); assert.equal(missingCapital.monthlyNet, 1890);
  const missingIncome = run({ initialInvestment: '1000', revenueRate: '' });
  assert.equal(missingIncome.paybackStatus, 'missingIncome'); assert.equal(missingIncome.dailyNet, null);
  const zeroCapital = run({ initialInvestment: '0' });
  assert.equal(zeroCapital.paybackStatus, 'zeroInvestment'); assert.equal(zeroCapital.paybackDays, 0);
  assert.equal(zeroCapital.investmentRoi, null); assert.equal(zeroCapital.projectedCashBalance, 22995);
});
test('an explicit zero investment does not hide operating losses', () => {
  const r = run({ initialInvestment: '0', revenueRate: '0' });
  assert.equal(r.paybackStatus, 'zeroInvestment'); assert.ok(r.dailyNet < 0); assert.equal(r.paybackWithinPlan, false);
});
for (const [field, value] of [['initialInvestment', '-1'], ['initialInvestment', 'Infinity'], ['projectionDays', '0'], ['projectionDays', '-1'], ['projectionDays', 'abc'], ['mode', 'unknown']]) {
  test(`invalid recovery input ${field}=${value} is rejected`, () => {
    const r = run({ [field]: value }); assert.equal(r.valid, false); assert.ok(r.errors.some(e => e.field === field));
  });
}
test('unit and billing conversions preserve capital payback and projected cash', () => {
  const input = { ...fixture, initialInvestment: '6300', projectionDays: '180' };
  const base = calculate(input);
  for (const converted of [convertUnit(input, 'PH/s'), convertBasis(input, 'rentBasis', 'total'), convertBasis(input, 'revenueBasis', 'hour')]) {
    const r = calculate(converted); close(r.paybackDays, base.paybackDays); close(r.projectedCashBalance, base.projectedCashBalance);
  }
});
test('out-of-range payback and projected profits never emit Infinity', () => {
  assert.equal(run({ initialInvestment: '1e308', mode: 'owned', serviceFee: '0', otherCost: '0', powerIncluded: true, hashrate: '1', revenueRate: '1e-300' }).valid, false);
  assert.equal(run({ projectionDays: '1e308' }).valid, false);
});
