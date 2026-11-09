import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Express, Request, Response } from "express";
import { getForumSession, InMemoryRateLimiter, forumClientAddress } from "../forumSecurity.js";

export const CONVERSION_EVENTS = ["wechat_estimate", "product_inquiry", "phone_click"] as const;
export type ConversionEvent = typeof CONVERSION_EVENTS[number];

type DailyCounts = Record<string, Partial<Record<ConversionEvent, number>>>;

function isConversionEvent(value: unknown): value is ConversionEvent {
  return typeof value === "string" && CONVERSION_EVENTS.includes(value as ConversionEvent);
}

export function registerConversionRoutes(app: Express, directory: string, sessionSecret: string) {
  const file = path.join(directory, "conversion-counts.json");
  const limiter = new InMemoryRateLimiter();
  let counts: DailyCounts | null = null;
  let writes = Promise.resolve();
  let pending = 0;

  const loadCounts = async () => {
    if (counts) return counts;
    counts = await readFile(file, "utf8")
      .then((content) => JSON.parse(content) as DailyCounts)
      .catch((error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") return {};
        throw error;
      });
    return counts;
  };

  app.post("/api/conversions", async (req, res) => {
    const origin = req.get("origin");
    const host = req.get("host");
    let originUrl: URL | null = null;
    try { originUrl = new URL(origin || ""); } catch { /* rejected below */ }
    if (!origin || !host || !originUrl || !["http:", "https:"].includes(originUrl.protocol)
      || originUrl.origin !== origin || originUrl.host.toLowerCase() !== host.toLowerCase()) {
      res.sendStatus(403);
      return;
    }
    if (!req.body || Object.keys(req.body).length !== 1 || !isConversionEvent(req.body.event)) {
      res.status(400).json({ error: "无效的统计事件" });
      return;
    }
    const rate = limiter.consume(forumClientAddress(req), 120, 60_000);
    if (!rate.allowed || pending >= 32) {
      res.setHeader("Retry-After", String(Math.ceil(rate.retryAfterMs / 1000) || 1));
      res.sendStatus(429);
      return;
    }

    const event = req.body.event as ConversionEvent;
    const day = new Date().toISOString().slice(0, 10);
    pending += 1;
    writes = writes.catch(() => {}).then(async () => {
      const data = await loadCounts();
      const cutoff = new Date(Date.now() - 90 * 86_400_000).toISOString().slice(0, 10);
      for (const savedDay of Object.keys(data)) if (savedDay < cutoff) delete data[savedDay];
      const today = data[day] ?? (data[day] = {});
      const previous = today[event] ?? 0;
      today[event] = (today[event] ?? 0) + 1;
      await mkdir(directory, { recursive: true });
      const temporaryFile = `${file}.tmp`;
      try {
        await writeFile(temporaryFile, JSON.stringify(data), { mode: 0o600 });
        await rename(temporaryFile, file);
      } catch (error) {
        today[event] = previous;
        throw error;
      }
    });
    try {
      await writes;
      res.sendStatus(204);
    } catch {
      res.sendStatus(503);
    } finally {
      pending -= 1;
    }
  });

  app.get("/api/conversions/summary", async (req: Request, res: Response) => {
    const session = sessionSecret.length >= 32 ? getForumSession(req, sessionSecret, "admin") : null;
    if (session?.role !== "admin" || session.sub !== "forum-admin") {
      res.status(401).json({ error: "请先登录审核后台" });
      return;
    }
    const requestedDays = Number(req.query.days ?? 30);
    const days = [7, 30, 90].includes(requestedDays) ? requestedDays : 30;
    try {
      await writes;
      const data = await loadCounts();
      const from = new Date(Date.now() - (days - 1) * 86_400_000).toISOString().slice(0, 10);
      const to = new Date().toISOString().slice(0, 10);
      const totals: Record<ConversionEvent, number> = { wechat_estimate: 0, product_inquiry: 0, phone_click: 0 };
      for (const [day, daily] of Object.entries(data)) {
        if (day < from || day > to) continue;
        for (const event of CONVERSION_EVENTS) totals[event] += daily[event] ?? 0;
      }
      res.set("Cache-Control", "no-store").json({ from, to, days, counts: totals });
    } catch {
      res.status(503).json({ error: "统计数据暂时不可用" });
    }
  });
}
