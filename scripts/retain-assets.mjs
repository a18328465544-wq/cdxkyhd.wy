import { readdir, readFile, mkdir, writeFile, lstat } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";

const [source, target] = process.argv.slice(2).map(value => path.resolve(value));
assert.ok(source && target && source !== target, "Usage: node scripts/retain-assets.mjs PREVIOUS_DIST/assets PERSISTENT_ASSETS");
const fingerprinted = /^[\w.-]+-[\w-]{8,}\.(?:js|css|woff2?|svg|png|webp|avif)$/;
await mkdir(target, { recursive: true });
assert.ok(!(await lstat(target)).isSymbolicLink(), "Target must not be a symlink");
let copied = 0;
for (const name of await readdir(source)) {
  if (!fingerprinted.test(name)) continue;
  const input = path.join(source, name); const output = path.join(target, name);
  if (!(await lstat(input)).isFile()) continue;
  const content = await readFile(input);
  try { await writeFile(output, content, { flag: "wx", mode: 0o644 }); copied++; }
  catch (error) {
    if (error.code !== "EEXIST") throw error;
    assert.ok((await lstat(output)).isFile() && !(await lstat(output)).isSymbolicLink(), "Asset target must be a regular file");
    assert.ok(content.equals(await readFile(output)), `Fingerprint collision: ${name}`);
  }
}
console.log(JSON.stringify({ copied, source, target }));
