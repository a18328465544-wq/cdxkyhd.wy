let alignmentTimer = 0;
let cancelAlignment: (() => void) | null = null;

export function scrollToSectionTarget(element: HTMLElement, offset = 80): void {
  if (alignmentTimer) window.clearTimeout(alignmentTimer);
  cancelAlignment?.();

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const destination = () => Math.max(0, window.scrollY + element.getBoundingClientRect().top - offset);

  window.scrollTo({top: destination(), behavior: prefersReducedMotion ? "auto" : "smooth"});

  const root = document.documentElement;
  const previousBehavior = root.style.scrollBehavior;
  let userInterrupted = false;
  const stopAlignment = () => {
    userInterrupted = true;
    window.clearTimeout(alignmentTimer);
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

  const deadline = Date.now() + 4_000;
  let stableFrames = 0;
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
      stableFrames = 0;
    } else {
      stableFrames += 1;
    }
    if (Date.now() < deadline && stableFrames < 5) {
      alignmentTimer = window.setTimeout(alignAfterLayout, 250);
    } else {
      stopAlignment();
    }
  };

  alignmentTimer = window.setTimeout(alignAfterLayout, 300);
}
