/** One request at a time; hidden pages cancel work and resume with a fresh read. */
export function startVisiblePolling(task: (signal: AbortSignal) => Promise<number | void>, defaultDelay: number) {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: AbortController | undefined;
  const run = async () => {
    if (stopped || document.hidden || pending) return;
    const controller = new AbortController();
    pending = controller;
    let delay = defaultDelay;
    try { const next = await task(controller.signal); if (typeof next === "number" && Number.isFinite(next) && next >= 0) delay = next; }
    catch { /* The task owns its user-facing error state. */ }
    finally {
      pending = undefined;
      if (!stopped && !document.hidden) timer = setTimeout(run, controller.signal.aborted ? 0 : delay);
    }
  };
  const visibility = () => {
    clearTimeout(timer);
    if (document.hidden) pending?.abort();
    else void run();
  };
  document.addEventListener("visibilitychange", visibility);
  void run();
  return () => {
    stopped = true;
    clearTimeout(timer);
    pending?.abort();
    document.removeEventListener("visibilitychange", visibility);
  };
}
