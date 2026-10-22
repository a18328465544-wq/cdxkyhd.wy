import type { Express } from "express";
import { appendFile, mkdir, readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";

const publicPaths = new Set(["/", "/build", "/gpu-ranking", "/gpu-daily", "/gpu-sn.php", "/gpu-sn", "/tools", "/tools/keyboard", "/tools/mouse", "/tools/audio", "/tools/monitor", "/tools/prl-mining", "/tools/hashrate-rental"]);
export function performanceSample(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const { path: page, name, value, device } = body as Record<string, unknown>;
  if (typeof page !== "string" || !publicPaths.has(page) || !["LCP", "INP", "CLS"].includes(String(name))
    || typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > (name === "CLS" ? 100 : 300_000)
    || (device !== "mobile" && device !== "desktop")) return null;
  return { path: page, name, value, device };
}

/** Numeric, anonymous, bounded local samples. No public analytics read endpoint. */
export function registerPerformanceRoutes(app: Express, directory: string, siteOrigin?: string) {
  let minute = 0;
  let requests = 0;
  let initializedDay = "";
  let bytes = 0;
  let pending = 0;
  let chain = Promise.resolve();
  app.post("/api/performance", (req, res) => {
    const origin = siteOrigin || `${req.protocol}://${req.get("host")}`;
    if (req.get("origin") !== origin) { res.sendStatus(403); return; }
    const currentMinute = Math.floor(Date.now() / 60_000);
    if (minute !== currentMinute) { minute = currentMinute; requests = 0; }
    if (++requests > 120 || pending >= 16) { res.sendStatus(429); return; }
    const sample = performanceSample(req.body);
    if (!sample) { res.sendStatus(400); return; }
    const day = new Date().toISOString().slice(0, 10);
    const line = JSON.stringify({ day, ...sample }) + "\n";
    pending += 1;
    chain = chain.then(async () => {
      const file = path.join(directory, `vitals-${day}.jsonl`);
      if (initializedDay !== day) {
        await mkdir(directory, { recursive: true });
        bytes = await stat(file).then(value => value.size).catch(error => { if (error.code === "ENOENT") return 0; throw error; });
        initializedDay = day;
        const cutoff = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
        for (const name of await readdir(directory)) {
          if (/^vitals-\d{4}-\d{2}-\d{2}\.jsonl$/.test(name) && name.slice(7, 17) < cutoff) await unlink(path.join(directory, name));
        }
      }
      if (bytes + Buffer.byteLength(line) <= 1024 * 1024) {
        await appendFile(file, line, { mode: 0o600 });
        bytes += Buffer.byteLength(line);
      }
    }).then(() => { res.sendStatus(204); }).catch(() => { res.sendStatus(503); }).finally(() => { pending -= 1; });
  });
}
