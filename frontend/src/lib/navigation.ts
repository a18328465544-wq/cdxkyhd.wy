let alignmentTimer = 0;
let cancelAlignment: (() => void) | null = null;

export function cancelSectionAlignment(): void {
  if (alignmentTimer) window.clearTimeout(alignmentTimer);
  cancelAlignment?.();
  alignmentTimer = 0;
  cancelAlignment = null;
}

export function scrollToSectionTarget(element: HTMLElement, offset = 80, behavior: ScrollBehavior = "smooth"): void {
  cancelSectionAlignment();

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const destination = () => Math.max(0, window.scrollY + element.getBoundingClientRect().top - offset);

  window.scrollTo({top: destination(), behavior: prefersReducedMotion ? "auto" : behavior});

  const root = document.documentElement;
  const previousBehavior = root.style.scrollBehavior;
  let userInterrupted = false;
  let observer: ResizeObserver | undefined;
  let startTimer = 0;
  const stopAlignment = () => {
    userInterrupted = true;
    window.clearTimeout(alignmentTimer);
    window.clearTimeout(startTimer);
    observer?.disconnect();
    window.removeEventListener("wheel", stopAlignment);
    window.removeEventListener("touchstart", stopAlignment);
    window.removeEventListener("pointerdown", stopAlignment);
    window.removeEventListener("keydown", stopAlignment);
    root.style.scrollBehavior = previousBehavior;
  };
  cancelAlignment = stopAlignment;

  window.addEventListener("wheel", stopAlignment, {passive: true});
  window.addEventListener("touchstart", stopAlignment, {passive: true});
  window.addEventListener("pointerdown", stopAlignment, {passive: true});
  window.addEventListener("keydown", stopAlignment);

  const alignAfterLayout = () => {
    if (!element.isConnected || userInterrupted) {
      stopAlignment();
      return;
    }
    const delta = element.getBoundingClientRect().top - offset;
    if (Math.abs(delta) > 10) {
      root.style.scrollBehavior = "auto";
      window.scrollTo({top: Math.max(0, window.scrollY + delta), behavior: "auto"});
      root.style.scrollBehavior = previousBehavior;
    }
  };

  const observeLayout = () => {
    alignAfterLayout();
    if (userInterrupted) return;
    if (typeof window.ResizeObserver === "function") {
      // Correct layout changes before paint instead of visibly snapping every 250ms.
      observer = new window.ResizeObserver(alignAfterLayout);
      observer.observe(document.body);
      observer.observe(element);
    }
  };
  if (behavior === "auto" || prefersReducedMotion) observeLayout();
  else startTimer = window.setTimeout(observeLayout, 300);
  alignmentTimer = window.setTimeout(stopAlignment, 20_000);
}
