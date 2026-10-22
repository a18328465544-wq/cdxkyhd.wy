import assert from "node:assert/strict";
import test from "node:test";
import { startVisiblePolling } from "./visiblePolling";

test("polling deduplicates work, cancels hidden requests, resumes and cleans up", async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "document");
  const events = new EventTarget();
  const fake = { hidden: false, addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events) };
  Object.defineProperty(globalThis, "document", { configurable: true, value: fake });
  let calls = 0;
  let active = 0;
  let peak = 0;
  let aborted = 0;
  const task = (signal: AbortSignal) => new Promise<void>(resolve => {
    calls++; active++; peak = Math.max(peak, active);
    const timer = setTimeout(done, 10);
    function done() { clearTimeout(timer); signal.removeEventListener("abort", cancel); active--; resolve(); }
    function cancel() { aborted++; done(); }
    signal.addEventListener("abort", cancel, { once: true });
  });
  const stop = startVisiblePolling(task, 5);
  try {
    fake.hidden = true; events.dispatchEvent(new Event("visibilitychange"));
    await new Promise(resolve => setTimeout(resolve, 25));
    assert.equal(calls, 1); assert.equal(aborted, 1);
    fake.hidden = false; events.dispatchEvent(new Event("visibilitychange"));
    events.dispatchEvent(new Event("visibilitychange"));
    await new Promise(resolve => setTimeout(resolve, 12));
    assert.equal(calls, 2); assert.equal(peak, 1);
    stop();
    await new Promise(resolve => setTimeout(resolve, 20));
    assert.equal(calls, 2);
  } finally { stop(); if (previous) Object.defineProperty(globalThis, "document", previous); else Reflect.deleteProperty(globalThis, "document"); }
});
