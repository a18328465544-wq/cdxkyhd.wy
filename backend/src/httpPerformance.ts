import compression from "compression";
import express, { type Express } from "express";

export function registerHttpPerformance(app: Express) {
  app.disable("x-powered-by");
  app.use(compression({
    threshold: 1024,
    level: 6,
    filter: (req, res) => ["GET", "HEAD"].includes(req.method)
      && !req.path.startsWith("/api/forum")
      && !res.getHeader("Set-Cookie")
      && compression.filter(req, res),
  }));
  app.use("/api", (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
}

export const isVersionedAsset = (name: string) => /^[\w.-]+-[\w-]{8,}\.(?:js|css|woff2?|svg|png|webp|avif)$/.test(name);

export function registerStaticFiles(app: Express, frontendDist: string, retainedAssets?: string) {
  app.use("/assets", (req, res, next) => {
    if (!isVersionedAsset(req.path.slice(1))) { res.sendStatus(404); return; }
    next();
  });
  const assetOptions = { maxAge: "1y", immutable: true, index: false } as const;
  app.use("/assets", express.static(`${frontendDist}/assets`, assetOptions));
  if (retainedAssets) app.use("/assets", express.static(retainedAssets, assetOptions));
  app.use("/assets", (_req, res) => { res.sendStatus(404); });
  app.use(express.static(frontendDist, { setHeaders: res => { res.setHeader("Cache-Control", "no-cache"); } }));
}
