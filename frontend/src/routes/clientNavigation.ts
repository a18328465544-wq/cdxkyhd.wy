import { resolveStandalonePage } from "./pageRoutes";

interface LinkOptions {
  button?: number;
  modified?: boolean;
  download?: boolean;
  target?: string | null;
  external?: boolean;
}

export function clientNavigationHref(href: string, currentHref: string, options: LinkOptions = {}): string | null {
  if ((options.button ?? 0) !== 0 || options.modified || options.download || options.external) return null;
  if (options.target && options.target.toLowerCase() !== "_self") return null;
  let current: URL;
  let destination: URL;
  try {
    current = new URL(currentHref);
    destination = new URL(href, current);
  } catch { return null; }
  if (!/^https?:$/.test(destination.protocol) || destination.origin !== current.origin) return null;
  if (destination.username || destination.password) return null;
  if (destination.pathname !== "/" && !resolveStandalonePage(destination.pathname)) return null;
  return `${destination.pathname}${destination.search}${destination.hash}`;
}
