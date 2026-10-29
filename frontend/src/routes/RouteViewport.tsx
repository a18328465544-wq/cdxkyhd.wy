import { useLayoutEffect, type ReactNode } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { cancelSectionAlignment, scrollToSectionTarget } from "../lib/navigation";

const positions = new Map<string, number>();

export default function RouteViewport({ children }: { children: ReactNode }) {
  const { pathname, hash, key } = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    cancelSectionAlignment();
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo({ top: navigationType === "POP" ? positions.get(key) ?? 0 : 0, behavior: "auto" });
    root.style.scrollBehavior = previousBehavior;
    if (hash) {
      try {
        const target = document.getElementById(decodeURIComponent(hash.slice(1)));
        if (target) scrollToSectionTarget(target, 80, "auto");
      } catch { /* Malformed external anchors must not break navigation. */ }
    }
    const rememberPosition = () => {
      positions.delete(key);
      positions.set(key, window.scrollY);
      if (positions.size > 50) positions.delete(positions.keys().next().value!);
    };
    window.addEventListener("scroll", rememberPosition, { passive: true });
    return () => window.removeEventListener("scroll", rememberPosition);
  }, [pathname, hash, key, navigationType]);

  return children;
}
