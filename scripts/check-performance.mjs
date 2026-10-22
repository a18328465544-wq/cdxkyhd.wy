import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import path from "node:path";
import assert from "node:assert/strict";

const dist = path.resolve("frontend/dist");
const manifest = JSON.parse(await readFile(path.join(dist, ".vite/manifest.json"), "utf8"));
const entry = Object.keys(manifest).find(key => manifest[key].isEntry);
const rental = Object.keys(manifest).find(key => key.endsWith("/HashrateRentalCalculatorPage.tsx"));
const router = Object.keys(manifest).find(key => manifest[key].name === "HardwareToolsRouter");
assert.ok(entry && rental && router, "Production route manifest is incomplete");
const keys = new Set();
function visit(key) { if (keys.has(key)) return; keys.add(key); for (const dependency of manifest[key].imports ?? []) visit(dependency); }
visit(entry); visit(router); visit(rental);
assert.ok(![...keys].some(key => /HomePage|FAQSection|InventorySection|PriceSection/.test(key)), "Tools import homepage content");
let raw = 0; let gzip = 0;
for (const key of keys) { const content = await readFile(path.join(dist, manifest[key].file)); raw += content.length; gzip += gzipSync(content).length; }
assert.ok(gzip <= 200 * 1024, `Rental route JS exceeds 200 KiB gzip: ${gzip}`);
const css = [...new Set([...keys].flatMap(key => manifest[key].css ?? []))];
let cssGzip = 0;
for (const file of css) cssGzip += gzipSync(await readFile(path.join(dist, file))).length;
assert.ok(cssGzip <= 20 * 1024, `Initial CSS exceeds 20 KiB gzip: ${cssGzip}`);
console.log(JSON.stringify({ route: "/tools/hashrate-rental", jsFiles: keys.size, rawJSBytes: raw, gzipJSBytes: gzip, gzipCSSBytes: cssGzip, homepageImports: false }, null, 2));
