import assert from "node:assert/strict";
import test from "node:test";
import {GPU_SN_BRANDS, GPU_SN_RULES, parseGpuSnDate, type GpuSnBrandId} from "@cdxkyhd/shared";

const now = new Date("2026-10-09T12:00:00.000Z");

function parse(brandId: GpuSnBrandId, sn: string, productModel?: string) {
  return parseGpuSnDate({brandId, sn, productModel}, now);
}

test("brand catalogue contains the reference brands and the user's expanded rule list", () => {
  const expected = [
    "nvidia", "asus", "gigabyte", "msi", "colorful", "galax", "zotac", "gainward", "maxsun", "sapphire", "powercolor", "xfx",
    "dataland", "inno3d", "manli", "pny", "evga", "palit", "leadtek", "asl", "onda",
  ];
  assert.deepEqual(GPU_SN_BRANDS.map(({id}) => id), expected);
  assert.deepEqual(GPU_SN_RULES.map(({id}) => id), expected);
  assert.ok(GPU_SN_RULES.every((rule) => rule.example && rule.officialUrl && rule.serviceInfo));
});

test("ASUS_SN_CUSTOM takes precedence while non-conflicting legacy and reference formats remain available", () => {
  const custom = parse("asus", "N1xxxxxxxxxxxx");
  assert.equal(custom.status, "parsed");
  assert.equal(custom.year, 2018);
  assert.equal(custom.month, 1);
  assert.equal(custom.ruleId, "ASUS_SN_CUSTOM");
  assert.equal(custom.confidence, "low");
  assert.deepEqual(custom.dateRange, {start: "2018-01-01", end: "2018-01-31"});

  const priorLegacyCode = parse("asus", "LB123456789012");
  assert.equal(priorLegacyCode.year, 2020);
  assert.equal(priorLegacyCode.month, 11);
  assert.equal(priorLegacyCode.ruleId, "ASUS_SN_LEGACY");

  const referenceLegacy = parse("asus", "9CC0AC186xxx");
  assert.equal(referenceLegacy.year, 2009);
  assert.equal(referenceLegacy.month, 12);
  assert.equal(referenceLegacy.officialConfirmed, false);
  assert.equal(referenceLegacy.ruleId, "ASUS_REFERENCE_NUMERIC");
  const referenceException = parse("asus", "MC12345678");
  assert.equal(referenceException.year, 2022);
  assert.equal(referenceException.month, 12);
  assert.equal(referenceException.ruleId, "ASUS_REFERENCE_EXCEPTION");
  assert.equal(parse("asus", "LB12345678901C", "RTX 5090").year, 2020);
  assert.equal(parse("asus", "L023456789012").status, "invalid");
  assert.equal(parse("asus", "WX123456789012").status, "invalid");
  for (const [code, year] of Object.entries({N: 2018, P: 2019, Q: 2020, R: 2021, S: 2022, T: 2023, U: 2024, V: 2025, W: 2026})) {
    const result = parse("asus", `${code}1xxxxxxxxxxxx`);
    assert.equal(result.year, year, `ASUS_SN_CUSTOM ${code} should map to ${year}`);
    assert.equal(result.ruleId, "ASUS_SN_CUSTOM");
  }
  for (const [code, year] of Object.entries({H: 2017, J: 2018, K: 2019, L: 2020, M: 2021})) {
    assert.equal(parse("asus", `${code}1xxxxxxxxxxxx`).year, year, `ASUS legacy ${code} should map to ${year}`);
  }
  for (const [code, month] of Object.entries({"1": 1, "9": 9, A: 10, B: 11, C: 12})) {
    const customMonth = parse("asus", `N${code}xxxxxxxxxxxx`);
    assert.equal(customMonth.month, month, `ASUS_SN_CUSTOM ${code} should map to month ${month}`);
    assert.equal(customMonth.ruleId, "ASUS_SN_CUSTOM");
    assert.equal(parse("asus", `L${code}xxxxxxxxxxxx`).month, month, `ASUS legacy ${code} should map to month ${month}`);
  }
});

test("MSI finds SDYYMM and keeps the official historical SBYYMM example", () => {
  const current = parse("msi", "SD2103007640");
  assert.equal(current.year, 2021);
  assert.equal(current.month, 3);
  assert.equal(current.confidence, "low");
  assert.deepEqual(current.dateRange, {start: "2021-03-01", end: "2021-03-31"});

  const historical = parse("msi", "602-V308-02SB1401012951");
  assert.equal(historical.year, 2014);
  assert.equal(historical.month, 1);
  assert.equal(historical.confidence, "medium");
  assert.equal(parse("msi", "SD2413000000").status, "invalid");
  assert.equal(parse("msi", "SD2701000000").status, "invalid");
  assert.equal(parse("msi", "SD2403007640", "RTX 4090D").year, 2024);
});

test("GIGABYTE parses SN+YYWW across new years without model-specific blocking", () => {
  const current = parse("gigabyte", "SN2342xxxxxxxx");
  assert.equal(current.status, "parsed");
  assert.equal(current.year, 2023);
  assert.equal(current.week, 42);
  assert.deepEqual(current.dateRange, {start: "2023-10-16", end: "2023-10-22"});

  const with4090 = parse("gigabyte", "SN2342xxxxxxxx", "RTX 4090");
  const with4090d = parse("gigabyte", "SN2342xxxxxxxx", "RTX 4090D");
  const with5090 = parse("gigabyte", "SN2515xxxxxxxx", "RTX 5090");
  assert.equal(with4090.status, "parsed");
  assert.equal(with4090d.status, "parsed");
  assert.equal(with5090.year, 2025);
  assert.equal(with5090.week, 15);
  assert.equal(parse("gigabyte", "4719331803056SN080500084640").year, 2008);
  assert.equal(parse("gigabyte", "SN2454xxxxxxxx").status, "invalid");
  assert.equal(parse("gigabyte", "SN2153xxxxxxxx").status, "invalid");
  assert.equal(parse("gigabyte", "SN2752xxxxxxxx").status, "invalid");
  assert.equal(parse("gigabyte", "SN2642xxxxxxxx").status, "invalid");
});

test("Colorful parses the supplied 6th-year and 7th-month field map", () => {
  const legacy = parse("colorful", "GGBN1K3xxxxx");
  assert.equal(legacy.status, "parsed");
  assert.equal(legacy.year, 2020);
  assert.equal(legacy.month, 3);

  const newestListedCode = parse("colorful", "GGBN1SAXXXX");
  assert.equal(newestListedCode.year, 2026);
  assert.equal(newestListedCode.month, 10);
  assert.equal(parse("colorful", "GY6AC7XXXX").status, "unsupported");
  assert.equal(parse("colorful", "GGBN1K0XXXX").status, "invalid");
  assert.equal(parse("colorful", "GGBN1SCXXXX").status, "invalid");
  for (const [code, year] of Object.entries({K: 2020, L: 2021, M: 2022, N: 2023, P: 2024, R: 2025, S: 2026})) {
    assert.equal(parse("colorful", `GGBN1${code}1xxxxx`).year, year, `Colorful ${code} should map to ${year}`);
  }
  for (const [code, month] of Object.entries({"1": 1, "9": 9, A: 10, B: 11, C: 12})) {
    assert.equal(parse("colorful", `GGBN1K${code}xxxxx`).month, month, `Colorful ${code} should map to month ${month}`);
  }
});

test("GALAX and Gainward read YY plus a numeric or A-C month, including later years", () => {
  const galax = parse("galax", "21Axxxxxxxx");
  assert.equal(galax.year, 2021);
  assert.equal(galax.month, 10);
  const galax2024 = parse("galax", "24Cxxxxxxxx");
  assert.equal(galax2024.year, 2024);
  assert.equal(galax2024.month, 12);

  const gainward = parse("gainward", "22Cxxxxxxxx");
  assert.equal(gainward.year, 2022);
  assert.equal(gainward.month, 12);
  assert.equal(parse("galax", "24Dxxxxxxxx").status, "invalid");
  assert.equal(parse("gainward", "27Axxxxxxxx").status, "invalid");
});

test("ZOTAC parses N+YYWW on later batches and validates production weeks", () => {
  const result = parse("zotac", "N2245xxxxxx");
  assert.equal(result.year, 2022);
  assert.equal(result.week, 45);
  assert.deepEqual(result.dateRange, {start: "2022-11-07", end: "2022-11-13"});
  assert.equal(parse("zotac", "N2539XXXXXXXX").year, 2025);
  assert.equal(parse("zotac", "N2153XXXXXXXX").status, "invalid");
  assert.equal(parse("zotac", "N2739XXXXXXXX").status, "invalid");
});

test("MAXSUN and Sapphire support the supplied week formats", () => {
  const maxsun = parse("maxsun", "S2312xxxxxx");
  assert.equal(maxsun.year, 2023);
  assert.equal(maxsun.week, 12);
  assert.deepEqual(maxsun.dateRange, {start: "2023-03-20", end: "2023-03-26"});
  assert.equal(parse("maxsun", "4247S20410XXX").week, 41);

  const sapphire = parse("sapphire", "A2135xxxx");
  assert.equal(sapphire.year, 2021);
  assert.equal(sapphire.week, 35);
  assert.equal(parse("sapphire", "Z2541xxxx").year, 2025);
  assert.equal(parse("sapphire", "A2153xxxx").status, "invalid");
});

test("DATALAND and INNO3D decode their stated date fields and reject ambiguity", () => {
  const dataland = parse("dataland", "DLZ2140xxxx");
  assert.equal(dataland.year, 2021);
  assert.equal(dataland.week, 40);
  assert.deepEqual(dataland.dateRange, {start: "2021-10-04", end: "2021-10-10"});
  assert.equal(parse("dataland", "DLZ2154xxxx").status, "invalid");

  const inno3d = parse("inno3d", "32-771-2108xxxx");
  assert.equal(inno3d.year, 2021);
  assert.equal(inno3d.month, 8);
  assert.equal(parse("inno3d", "32-771-2613xxxx").status, "invalid");
  assert.equal(parse("inno3d", "21-08-24-10").status, "unsupported");
});

test("PowerColor keeps its observed LG+YYMM format through recent batches", () => {
  const result = parse("powercolor", "LG2509XXXXX");
  assert.equal(result.year, 2025);
  assert.equal(result.month, 9);
  assert.deepEqual(result.dateRange, {start: "2025-09-01", end: "2025-09-30"});
  assert.equal(parse("powercolor", "LG251300000").status, "invalid");
  assert.equal(parse("powercolor", "LG27010000").status, "invalid");
});

test("brands without a verified date rule are identified but never given a guessed date", () => {
  const unknownSamples: Record<GpuSnBrandId, string> = {
    nvidia: "1322421040000", xfx: "WWH0XXXXX", manli: "12345678901234567890123", pny: "1234567890",
    evga: "1234567890", palit: "1234567890", leadtek: "1234567890", asl: "1234567890", onda: "1234567890",
    asus: "LB123456789012", gigabyte: "SN2342xxxx", msi: "SD210300", colorful: "GGBN1K3xxx", galax: "18B000",
    zotac: "N2139xxxx", gainward: "179xxxx", maxsun: "S2041xxxx", sapphire: "A1843xxxx", powercolor: "LG2109xxxx",
    dataland: "DLZ2140xxxx", inno3d: "32-771-2108xxxx",
  };
  for (const brandId of ["nvidia", "xfx", "manli", "pny", "evga", "palit", "leadtek", "asl", "onda"] as GpuSnBrandId[]) {
    const result = parse(brandId, unknownSamples[brandId]);
    assert.equal(result.status, "unsupported", `${brandId} must not guess a date`);
    assert.equal(result.year, null);
    assert.equal(result.dateRange, null);
    assert.equal(result.officialConfirmed, false);
  }
  assert.equal(parse("manli", "1234567890123456789012").status, "invalid");
});

test("future dates, malformed serials, and unsupported fields do not produce ranges", () => {
  assert.equal(parse("asus", "WC123456789012").dateRange, null);
  assert.equal(parse("gigabyte", "SN2752xxxxxxxx").dateRange, null);
  assert.equal(parse("zotac", "N2739xxxxxxxx").dateRange, null);
  assert.equal(parse("maxsun", "S2753xxxxxx").status, "invalid");
  assert.equal(parse("nvidia", "#########").status, "invalid");
  assert.equal(parse("colorful", "GY6AC7XXXX").dateRange, null);
});
