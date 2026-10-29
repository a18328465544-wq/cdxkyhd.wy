import { mkdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { buildGpuPriceHistory, gpuPriceHistoryDates, historicalGpuPriceSnapshot, normalizeDailyGpuPrices, type DailyGpuPrices, type GpuPriceHistoryPeriod } from "@cdxkyhd/shared";

export class GpuPriceHistoryService {
  private snapshots: DailyGpuPrices[] = [];
  private blocked = false;
  private pending?: Promise<void>;
  private checkedAt: number | null = null;
  private sourceStatus: DailyGpuPrices["feed_status"] = "unavailable";
  private publishedAt: string | null = null;

  private constructor(private readonly feedFile: string, private readonly archiveFile: string, private readonly clock: () => number) {}

  static async open(options: { feedFile: string; archiveFile: string; clock?: () => number }) {
    const service = new GpuPriceHistoryService(options.feedFile, options.archiveFile, options.clock ?? Date.now);
    try {
      if ((await stat(options.archiveFile)).size > 8 * 1024 * 1024) throw new Error("Oversized history archive");
      const raw = JSON.parse(await readFile(options.archiveFile, "utf8"));
      if (raw?.schema_version !== 1 || !Array.isArray(raw.snapshots) || raw.snapshots.length > 366) throw new Error("Invalid history archive");
      const dates = new Set<string>();
      service.snapshots = raw.snapshots.map((input: unknown) => {
        const snapshot = historicalGpuPriceSnapshot(input, service.clock());
        if (!snapshot || dates.has(snapshot.date)) throw new Error("Invalid history date");
        dates.add(snapshot.date);
        return snapshot;
      });
    } catch (error) {
      // A broken archive disables this feature without deleting data or stopping the website.
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") service.blocked = true;
    }
    return service;
  }

  async refresh(force = false): Promise<void> {
    if (this.blocked) return;
    if (this.pending) return this.pending;
    if (!force && this.checkedAt !== null && this.clock() - this.checkedAt < 60_000) return;
    const work = this.readAndArchive();
    this.pending = work;
    try { await work; } finally { if (this.pending === work) this.pending = undefined; }
  }

  private async readAndArchive() {
    const now = this.clock();
    this.checkedAt = now;
    let raw: unknown;
    try {
      if ((await stat(this.feedFile)).size > 256 * 1024) throw new Error("Oversized price feed");
      raw = JSON.parse(await readFile(this.feedFile, "utf8"));
    } catch (error) {
      this.sourceStatus = (error as NodeJS.ErrnoException).code === "ENOENT" ? "unavailable" : "invalid";
      return;
    }
    this.sourceStatus = normalizeDailyGpuPrices(raw, now).feed_status;
    const snapshot = historicalGpuPriceSnapshot(raw, now);
    if (!snapshot) { if (this.sourceStatus === "ready") this.sourceStatus = "invalid"; return; }
    const existing = this.snapshots.find(item => item.date === snapshot.date);
    if (existing && Date.parse(existing.generated_at!) > Date.parse(snapshot.generated_at!)) return;
    this.publishedAt = snapshot.generated_at;
    if (!existing && !snapshot.available_models) return;
    if (existing && JSON.stringify(existing) === JSON.stringify(snapshot)) return;
    if (existing && existing.generated_at === snapshot.generated_at) { this.sourceStatus = "invalid"; return; }
    const retainedDates = new Set(gpuPriceHistoryDates(366, now));
    if (!retainedDates.has(snapshot.date)) return;
    const next = [...this.snapshots.filter(item => item.date !== snapshot.date && retainedDates.has(item.date)), snapshot].sort((a, b) => a.date.localeCompare(b.date));
    const contents = JSON.stringify({ schema_version: 1, snapshots: next });
    if (Buffer.byteLength(contents) > 8 * 1024 * 1024) { this.blocked = true; return; }
    const temporary = `${this.archiveFile}.${process.pid}.${randomUUID()}.tmp`;
    try {
      await mkdir(path.dirname(this.archiveFile), { recursive: true });
      await writeFile(temporary, contents, { mode: 0o600 });
      await rename(temporary, this.archiveFile);
      this.snapshots = next;
    } catch {
      this.blocked = true;
    } finally {
      await unlink(temporary).catch(() => {});
    }
  }

  history(model: string, days: GpuPriceHistoryPeriod) {
    if (this.blocked) throw new Error("报价历史归档暂不可用，请稍后重试");
    return { ...buildGpuPriceHistory(this.snapshots, model, days, this.clock()), source_status: this.sourceStatus,
      checked_at: this.checkedAt === null ? null : new Date(this.checkedAt).toISOString(), published_at: this.publishedAt };
  }
}
