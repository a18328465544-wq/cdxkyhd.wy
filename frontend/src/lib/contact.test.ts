import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CONTACT_INFO } from "./contact";

const projectRoot = process.cwd();
const sourceRoot = join(projectRoot, "src");

function readSource(path: string) {
  return readFileSync(join(sourceRoot, path), "utf8");
}

const contactSourceFiles = [
  "components/ContactModal.tsx",
  "components/ContactSection.tsx",
  "components/FloatingContactButton.tsx",
  "components/Header.tsx",
];

assert.equal(CONTACT_INFO.wechatId, "GPU-CD1");
assert.equal(CONTACT_INFO.phoneDisplay, "17608075394");
assert.equal(CONTACT_INFO.phoneHref, "tel:17608075394");
assert.equal(CONTACT_INFO.wechatQrPath, "/contact/wechat-qr.jpg");
assert(existsSync(join(projectRoot, "public/contact/wechat-qr.jpg")), "wechat QR image should be bundled from public/contact");

for (const file of contactSourceFiles) {
  const source = readSource(file);

  assert(source.includes("CONTACT_INFO"), `${file} should read contact info from shared config`);
  assert(!source.includes("183-2846-5544"), `${file} should not show the old phone display`);
  assert(!source.includes("18328465544"), `${file} should not use the old phone link`);
  assert(!source.includes("GPU-CD183"), `${file} should not show the old WeChat id`);
}
