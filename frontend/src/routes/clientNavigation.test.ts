import assert from "node:assert/strict";
import test from "node:test";
import { clientNavigationHref } from "./clientNavigation";

const current = "https://cdgpu.cn/tools";

test("all existing site pages preserve paths, queries and anchors for client navigation", () => {
  for (const href of ["/", "/#inventory", "/build", "/gpu-sn.php", "/gpu-sn", "/gpu-daily/", "/community", "/community/post/example", "/community/manage", "/tools", "/tools/keyboard", "/tools/hashrate-rental", "/gpu-ranking?test=portRoyal&res=1440p"]) {
    assert.equal(clientNavigationHref(href, current), href);
  }
  assert.equal(clientNavigationHref("#page-questions-heading", current), "/tools#page-questions-heading");
  assert.equal(clientNavigationHref("/build", current, { target: "_self" }), "/build");
});

test("external links, files, phone links and browser shortcuts retain native navigation", () => {
  for (const href of ["https://example.com/build", "tel:17608075394", "mailto:test@example.com", "/api/health", "/hardware-tools/keyboard.html", "/favicon.svg", "/unknown", "javascript:void(0)", "https://[", "https://user:pass@cdgpu.cn/build"]) {
    assert.equal(clientNavigationHref(href, current), null);
  }
  for (const options of [{ button: 1 }, { button: 2 }, { modified: true }, { download: true }, { target: "_blank" }, { target: "other-frame" }, { external: true }]) {
    assert.equal(clientNavigationHref("/build", current, options), null);
  }
});
