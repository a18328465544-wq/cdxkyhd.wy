import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { act, lazy, Suspense } from "react";
import { BrowserRouter, useLocation } from "react-router-dom";
import SiteNavigation, { useSiteNavigation } from "./SiteNavigation";
import RouteViewport from "./RouteViewport";
import RouteErrorBoundary from "./RouteErrorBoundary";
import { cancelSectionAlignment, scrollToSectionTarget } from "../lib/navigation";

test("lazy page changes retain the revealed content and header, then commit one complete page", async () => {
  const dom = new JSDOM('<!doctype html><html style="scroll-behavior:smooth"><body><div id="root"></div></body></html>', { url: "https://cdgpu.cn/tools" });
  const win = dom.window;
  const originalDescriptors = new Map<string, PropertyDescriptor | undefined>();
  for (const [key, value] of Object.entries({ window: win, document: win.document, Element: win.Element, HTMLElement: win.HTMLElement, HTMLAnchorElement: win.HTMLAnchorElement, IS_REACT_ACT_ENVIRONMENT: true })) {
    originalDescriptors.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  win.history.replaceState({ key: "transition-test" }, "");
  win.history.scrollRestoration = "auto";
  let scrollY = 0;
  const scrolls: Array<{ top: number; style: string }> = [];
  Object.defineProperty(win, "scrollY", { get: () => scrollY });
  win.scrollTo = ((options: ScrollToOptions) => {
    scrollY = options.top ?? 0;
    scrolls.push({ top: scrollY, style: win.document.documentElement.style.scrollBehavior });
  }) as typeof win.scrollTo;
  win.matchMedia = query => ({
    matches: false, media: query, onchange: null,
    addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true; },
  });
  let reveal!: (module: { default: () => React.JSX.Element }) => void;
  const DelayedPage = lazy(() => new Promise<{ default: () => React.JSX.Element }>(resolve => { reveal = resolve; }));
  let rejectChunk!: (error: Error) => void;
  const BrokenPage = lazy(() => new Promise<{ default: () => React.JSX.Element }>((_resolve, reject) => { rejectChunk = reject; }));
  const { createRoot } = await import("react-dom/client");
  const root = createRoot(win.document.getElementById("root")!, { onCaughtError: () => {} });
  function TestApp() {
    const location = useLocation();
    const { pending, navigate } = useSiteNavigation();
    return <>
      <header id="persistent-header"><button onClick={() => navigate("/build")}>装机</button><a href="/tools">工具</a><a href="/#inventory">库存</a><a href="/gpu-sn">SN</a></header>
      {pending && <div role="status">正在切换页面</div>}
      <RouteErrorBoundary resetKey={location.pathname}>
      <Suspense fallback={<div id="page-fallback">加载页面</div>}>
        <RouteViewport>
          {location.pathname === "/build" ? <DelayedPage /> : location.pathname === "/gpu-sn" ? <BrokenPage /> : <main><h1>{location.pathname === "/" ? "首页" : "硬件工具"}</h1><div id="inventory" /></main>}
          <footer>{location.pathname} 页脚</footer>
        </RouteViewport>
      </Suspense>
      </RouteErrorBoundary>
    </>;
  }
  const click = (selector: string) => win.document.querySelector(selector)!.dispatchEvent(new win.MouseEvent("click", { button: 0, bubbles: true, cancelable: true }));
  try {
    await act(async () => root.render(<BrowserRouter><SiteNavigation><TestApp /></SiteNavigation></BrowserRouter>));
    const header = win.document.getElementById("persistent-header");
    assert.equal(win.history.scrollRestoration, "manual");
    scrollY = 420;
    win.dispatchEvent(new win.Event("scroll"));
    await act(async () => { click("button"); });
    assert.equal(win.document.querySelector("h1")?.textContent, "硬件工具");
    assert.equal(win.document.querySelector("footer")?.textContent, "/tools 页脚");
    assert.equal(win.document.querySelector("#page-fallback"), null);
    assert.match(win.document.querySelector('[role="status"]')?.textContent ?? "", /切换/);
    assert.equal(win.document.getElementById("persistent-header"), header);
    await act(async () => { reveal({ default: () => <main><h1>在线装机</h1></main> }); });
    assert.equal(win.document.querySelector("h1")?.textContent, "在线装机");
    assert.equal(win.document.querySelectorAll("main").length, 1);
    assert.equal(win.document.querySelector("footer")?.textContent, "/build 页脚");
    assert.equal(win.document.querySelector('[role="status"]'), null);
    assert.equal(scrollY, 0);
    assert.equal(win.document.documentElement.style.scrollBehavior, "smooth");
    assert(scrolls.every(scroll => scroll.style === "auto"));
    assert.equal(win.document.getElementById("persistent-header"), header);

    await act(async () => {
      const popped = new Promise<void>(resolve => win.addEventListener("popstate", () => resolve(), { once: true }));
      win.history.back();
      await popped;
    });
    assert.equal(win.document.querySelector("h1")?.textContent, "硬件工具");
    assert.equal(scrollY, 420);
    await act(async () => { click('a[href="/#inventory"]'); });
    assert.equal(win.location.hash, "#inventory");
    assert.equal(win.document.querySelector("h1")?.textContent, "首页");
    assert.equal(win.document.getElementById("persistent-header"), header);
    assert.equal(win.document.querySelector("#page-fallback"), null);

    let onResize!: ResizeObserverCallback;
    let disconnected = false;
    Object.defineProperty(win, "ResizeObserver", { configurable: true, value: class {
      constructor(callback: ResizeObserverCallback) { onResize = callback; }
      observe() {}
      disconnect() { disconnected = true; }
    } });
    const inventory = win.document.getElementById("inventory")!;
    let targetY = 1000;
    inventory.getBoundingClientRect = () => ({ top: targetY - scrollY }) as DOMRect;
    scrollToSectionTarget(inventory, 80, "auto");
    assert.equal(scrollY, 920);
    targetY += 56;
    onResize([], {} as ResizeObserver);
    assert.equal(scrollY, 976, "late content above an anchor is compensated before the next paint");
    win.dispatchEvent(new win.Event("wheel"));
    targetY += 40;
    onResize([], {} as ResizeObserver);
    assert.equal(scrollY, 976, "manual scrolling cancels anchor locking");
    assert.equal(disconnected, true);

    await act(async () => { click('a[href="/gpu-sn"]'); });
    await act(async () => { rejectChunk(new Error("Failed to fetch dynamically imported module")); });
    assert.equal(win.document.querySelector("h1")?.textContent, "页面暂时无法打开");
    assert.equal(win.document.getElementById("persistent-header"), header);
    await act(async () => { click('a[href="/"]'); });
    assert.equal(win.document.querySelector("h1")?.textContent, "首页");
    assert.equal(win.document.querySelector('[role="alert"]'), null);
  } finally {
    cancelSectionAlignment();
    await act(async () => root.unmount());
    assert.equal(win.history.scrollRestoration, "auto");
    dom.window.close();
    for (const [key, descriptor] of originalDescriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
