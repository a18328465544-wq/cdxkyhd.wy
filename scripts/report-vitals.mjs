import { readFile } from "node:fs/promises";
assertArgs();
function assertArgs() { if (!process.argv[2]) throw new Error("Usage: node scripts/report-vitals.mjs /private/path/vitals-YYYY-MM-DD.jsonl"); }
const groups = new Map();
for (const line of (await readFile(process.argv[2], "utf8")).trim().split("\n")) {
  if (!line) continue;
  const sample = JSON.parse(line); const key = `${sample.path} ${sample.device} ${sample.name}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(sample.value);
}
for (const [key, values] of groups) {
  values.sort((a, b) => a - b);
  console.log(`${key}: samples=${values.length}, p75=${values[Math.max(0, Math.ceil(values.length * 0.75) - 1)]}${key.endsWith("CLS") ? "" : "ms"}`);
}
