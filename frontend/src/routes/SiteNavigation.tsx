import { createContext, useCallback, useContext, useEffect, useTransition, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { cancelSectionAlignment } from "../lib/navigation";
import { clientNavigationHref } from "./clientNavigation";

const NavigationContext = createContext({ navigate: (href: string) => window.location.assign(href), pending: false });

export const useSiteNavigation = () => useContext(NavigationContext);

export default function SiteNavigation({ children }: { children: ReactNode }) {
  const routerNavigate = useNavigate();
  const [pending, startTransition] = useTransition();
  const navigate = useCallback((href: string) => {
    cancelSectionAlignment();
    startTransition(() => { void routerNavigate(href); });
  }, [routerNavigate]);

  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => { window.history.scrollRestoration = previous; };
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || !(event.target instanceof Element)) return;
      const anchor = event.target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const href = clientNavigationHref(anchor.href, window.location.href, {
        button: event.button,
        modified: event.metaKey || event.ctrlKey || event.shiftKey || event.altKey,
        download: anchor.hasAttribute("download"),
        target: anchor.target,
        external: anchor.relList.contains("external"),
      });
      if (!href) return;
      event.preventDefault();
      navigate(href);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [navigate]);

  return <NavigationContext.Provider value={{ navigate, pending }}>{children}</NavigationContext.Provider>;
}
