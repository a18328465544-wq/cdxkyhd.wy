import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { startVisiblePolling } from "../lib/visiblePolling";
import {
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  MessageSquare,
  Plus,
  RefreshCw,
  Share2,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { apiFetch } from "../lib/api";
import {
  buildGpuCatalog,
  findGameBenchmark,
  gpuIdentity,
  gpuInventoryMatches,
  isGpuInventoryAvailable,
  relativePerformance,
  resolveBlenderGpuBenchmark,
  resolveGpuBenchmark,
  resolveGpuRankingScore,
  type BlenderGpuRankingSnapshot,
  type GpuCatalogEntry,
  type GpuRankingMode,
  type GpuRankingScoreSnapshot,
  type GpuRankingSnapshot,
  type GpuResolution,
  type GpuScoreBenchmark,
} from "../data/gpuRanking";
import {
  parseRankingQuery,
  rankingQuery,
  RANKING_MODES,
} from "../data/gpuRankingQuery";
import { Button, SearchInput, Select, SegmentedControl } from "./ui/controls";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  price: number | string;
  quantity: number;
  specs?: string;
  status: string;
}
interface SourceStatus {
  configured?: boolean;
  reason?: string;
  refreshFailed?: boolean;
  lastAttemptAt?: string | null;
}
interface RankingResponse {
  success: boolean;
  snapshot: GpuRankingSnapshot | null;
  blenderSnapshot: BlenderGpuRankingSnapshot | null;
  geekbenchSnapshot: GpuRankingScoreSnapshot | null;
  threeDMarkSnapshot: GpuRankingScoreSnapshot | null;
  gamingStatus?: SourceStatus;
  blenderStatus?: SourceStatus;
  geekbenchStatus?: SourceStatus;
  threeDMarkStatus?: SourceStatus;
}
const EMPTY_DATA: RankingResponse = {
  success: true,
  snapshot: null,
  blenderSnapshot: null,
  geekbenchSnapshot: null,
  threeDMarkSnapshot: null,
};
const FAMILIES = [
  { value: "gaming", label: "游戏实测" },
  { value: "threeDMark", label: "3DMark" },
  { value: "compute", label: "渲染与计算" },
];
const KIND_NAMES = {
  desktop: "桌面显卡",
  professional: "专业显卡",
  mobile: "笔记本显卡",
};
const RESOLUTIONS: { value: GpuResolution; label: string }[] = [
  { value: "1080p", label: "1080p" },
  { value: "1440p", label: "2K" },
  { value: "4k", label: "4K" },
];
const SOURCE_URLS = {
  gaming: "https://www.tomshardware.com/reviews/gpu-hierarchy,4388.html",
  threeDMark: "https://www.3dmark.com/search",
  compute: "https://opendata.blender.org/benchmarks/query/",
};

function sourceDate(value?: string | null) {
  return value && Number.isFinite(Date.parse(value))
    ? new Intl.DateTimeFormat("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "未提供";
}
function metricFor(
  entry: GpuCatalogEntry,
  data: RankingResponse,
  mode: GpuRankingMode,
  resolution: GpuResolution,
) {
  if (mode === "raster" || mode === "rayTracing") {
    const game = resolveGpuBenchmark(
      entry,
      findGameBenchmark(entry, data.snapshot),
      mode,
      resolution,
    );
    return { value: game.fps, samples: null as number | null };
  }
  if (mode === "blenderCycles") {
    const result = resolveBlenderGpuBenchmark(
      entry,
      data.blenderSnapshot?.models ?? [],
    );
    return { value: result.score, samples: result.samples };
  }
  const snapshot = mode.startsWith("geekbench")
    ? data.geekbenchSnapshot
    : data.threeDMarkSnapshot;
  const result = resolveGpuRankingScore(entry, snapshot?.models ?? [], mode);
  return { value: result.score, samples: result.samples };
}
function metricText(value: number | null, mode: GpuRankingMode) {
  if (value === null) return "待收录";
  return mode === "raster" || mode === "rayTracing"
    ? `${value.toFixed(1)} FPS`
    : value.toLocaleString("zh-CN", { maximumFractionDigits: 1 });
}

export default function GpuRankingPage({
  onOpenContact,
}: {
  onOpenContact: () => void;
}) {
  const [initial] = useState(() =>
    parseRankingQuery(
      typeof window === "undefined" ? "" : window.location.search,
    ),
  );
  const [mode, setMode] = useState(initial.mode);
  const [resolution, setResolution] = useState(initial.resolution);
  const [selected, setSelected] = useState(initial.selected);
  const [baseline, setBaseline] = useState(initial.baseline);
  const [brand, setBrand] = useState("all");
  const [kind, setKind] = useState("desktop");
  const [memory, setMemory] = useState("0");
  const [budget, setBudget] = useState("0");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [scoredOnly, setScoredOnly] = useState(true);
  const [limit, setLimit] = useState(50);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [data, setData] = useState<RankingResponse>(EMPTY_DATA);
  const [dataState, setDataState] = useState("loading");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryState, setInventoryState] = useState("loading");
  const [inventoryRevision, setInventoryRevision] = useState(0);
  const family = RANKING_MODES.find((item) => item.value === mode)!.family;
  const gameMode = family === "gaming";
  const activeSnapshot = gameMode
    ? data.snapshot
    : mode === "blenderCycles"
      ? data.blenderSnapshot
      : mode.startsWith("geekbench")
        ? data.geekbenchSnapshot
        : data.threeDMarkSnapshot;
  const benchmarkSource =
    family === "threeDMark"
      ? data.threeDMarkSnapshot?.sources?.[mode as GpuScoreBenchmark]
      : undefined;
  const sourceSnapshot = benchmarkSource ?? activeSnapshot;
  const activeStatus = gameMode
    ? data.gamingStatus
    : family === "threeDMark"
      ? benchmarkSource
        ? {
            ...data.threeDMarkStatus,
            refreshFailed: benchmarkSource.refreshFailed,
            reason: benchmarkSource.reason,
          }
        : data.threeDMarkSnapshot?.sources
          ? {
              configured: false,
              refreshFailed: false,
              reason:
                "当前公开来源未提供此测试项目的独立成绩，暂不以其他项目替代。",
            }
          : data.threeDMarkStatus
      : mode.startsWith("geekbench")
        ? data.geekbenchStatus
        : data.blenderStatus;
  const sourceName = gameMode
    ? "Tom's Hardware 游戏测试集"
    : mode === "blenderCycles"
      ? `Blender ${data.blenderSnapshot?.version ?? ""} Open Data`
      : mode.startsWith("geekbench")
        ? (data.geekbenchSnapshot?.version ?? "Geekbench 7")
        : (benchmarkSource?.name ?? "3DMark");
  const sourceUrl = mode.startsWith("geekbench")
    ? "https://browser.geekbench.com/v7/gpu"
    : (benchmarkSource?.source ??
      SOURCE_URLS[family as keyof typeof SOURCE_URLS]);

  useEffect(() => {
    return startVisiblePolling(async signal => {
      try {
        const result = await apiFetch<RankingResponse>("/api/gpu-ranking", {
          signal,
        });
        if (!result.success) throw new Error("GPU ranking unavailable");
        if (signal.aborted) return;
        setData(result);
        setDataState("ready");
        return result.snapshot || result.blenderSnapshot ? 15 * 60_000 : 15_000;
      } catch {
        if (signal.aborted) return;
        setDataState("error");
        return 30_000;
      }
    }, 30_000);
  }, []);

  useEffect(() => {
    const abort = new AbortController();
    setInventoryState("loading");
    void apiFetch<{ success: boolean; items?: InventoryItem[] }>(
      "/api/inventory?view=availability&category=GPU",
      { signal: abort.signal },
    )
      .then((result) => {
        if (abort.signal.aborted) return;
        if (!result.success || !Array.isArray(result.items))
          throw new Error("Inventory unavailable");
        setInventory(result.items.filter((item) => item.category === "GPU"));
        setInventoryState("ready");
      })
      .catch(() => {
        if (!abort.signal.aborted) {
          setInventory([]);
          setInventoryState("error");
        }
      });
    return () => abort.abort();
  }, [inventoryRevision]);

  useEffect(() => {
    const url = new URL(window.location.href);
    for (const key of ["test", "res", "compare", "base"])
      url.searchParams.delete(key);
    new URLSearchParams(
      rankingQuery({ mode, resolution, selected, baseline }),
    ).forEach((value, key) => url.searchParams.set(key, value));
    window.history.replaceState(window.history.state, "", url);
    setShareLink("");
  }, [mode, resolution, selected, baseline]);

  useEffect(() => {
    setLimit(50);
  }, [
    mode,
    resolution,
    brand,
    kind,
    memory,
    budget,
    search,
    inStockOnly,
    scoredOnly,
  ]);

  const catalog = useMemo(
    () =>
      buildGpuCatalog(
        [
          ...(data.snapshot?.models ?? []),
          ...(data.blenderSnapshot?.models ?? []),
          ...(data.geekbenchSnapshot?.models ?? []),
          ...(data.threeDMarkSnapshot?.models ?? []),
        ].map((item) => item.model),
      ),
    [data],
  );
  const allRows = useMemo(
    () =>
      catalog
        .map((entry) => {
          const metric = metricFor(entry, data, mode, resolution);
          const available = inventory.filter(
            (item) =>
              isGpuInventoryAvailable(item) &&
              gpuInventoryMatches(
                entry.model,
                `${item.name} ${item.specs ?? ""}`,
              ),
          );
          const prices = available
            .map((item) => Number(item.price))
            .filter((price) => Number.isFinite(price) && price > 0);
          return {
            entry,
            ...metric,
            count: available.reduce((sum, item) => sum + item.quantity, 0),
            price: prices.length ? Math.min(...prices) : null,
          };
        })
        .sort(
          (a, b) =>
            (b.value ?? -1) - (a.value ?? -1) ||
            a.entry.model.localeCompare(b.entry.model),
        ),
    [catalog, data, inventory, mode, resolution],
  );
  const selectedRows = selected
    .map((id) => allRows.find((row) => row.entry.id === id))
    .filter((row) => row !== undefined);
  const unavailableSelections =
    dataState !== "loading"
      ? selected.filter((id) => !allRows.some((row) => row.entry.id === id))
      : [];
  const baseRow =
    selectedRows.find((row) => row.entry.id === baseline) ??
    selectedRows[0] ??
    allRows.find((row) => row.entry.kind === kind && row.value !== null);
  const baseValue = baseRow?.value ?? null;
  const query = deferredSearch.trim().toUpperCase().replace(/\s/g, "");
  const queryIdentity = gpuIdentity(deferredSearch);
  const rows = allRows
    .filter((row) => row.entry.kind === kind)
    .filter((row) => brand === "all" || row.entry.brand === brand)
    .filter(
      (row) =>
        !query ||
        row.entry.model.toUpperCase().replace(/\s/g, "").includes(query) ||
        (queryIdentity &&
          gpuIdentity(row.entry.model)?.base === queryIdentity.base &&
          (queryIdentity.memoryGb === undefined ||
            queryIdentity.memoryGb === row.entry.memoryGb)),
    )
    .filter(
      (row) =>
        Number(memory) === 0 || (row.entry.memoryGb ?? 0) >= Number(memory),
    )
    .filter(
      (row) =>
        Number(budget) === 0 ||
        (inventoryState === "ready" &&
          row.price !== null &&
          row.price <= Number(budget)),
    )
    .filter(
      (row) => !inStockOnly || (inventoryState === "ready" && row.count > 0),
    )
    .filter((row) => !scoredOnly || row.value !== null);
  const measuredCount = allRows.filter(
    (row) => row.entry.kind === kind && row.value !== null,
  ).length;
  const projectHasScores = allRows.some((row) => row.value !== null);
  const maxValue = Math.max(1, ...rows.map((row) => row.value ?? 0));
  const modeLabel = RANKING_MODES.find((item) => item.value === mode)!.label;
  const benchmarkUnit = gameMode
    ? "平均 FPS"
    : mode === "blenderCycles"
      ? "样本 / 分钟"
      : "测试分数";

  function toggleCompare(id: string) {
    setNotice("");
    if (selected.includes(id)) {
      const next = selected.filter((value) => value !== id);
      setSelected(next);
      if (baseline === id) setBaseline(next[0] ?? "");
    } else if (selected.length < 4) {
      setSelected([...selected, id]);
      if (!selected.length) setBaseline(id);
    } else setNotice("最多同时对比 4 款，请先移除一款。");
  }
  async function share() {
    const url = new URL("/gpu-ranking", window.location.origin);
    url.search = rankingQuery({ mode, resolution, selected, baseline });
    try {
      await navigator.clipboard.writeText(url.toString());
      setNotice("对比链接已复制");
    } catch {
      setShareLink(url.toString());
      setNotice("请复制下方对比链接");
    }
  }

  return (
    <main className="gpu-ranking-page min-h-screen flex-1 bg-slate-50 pt-20 sm:pt-28">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <header className="page-heading">
          <div className="min-w-0 flex-1">
            <h1 className="page-title flex items-center gap-2.5"><BarChart3 className="h-6 w-6 text-blue-600" />显卡性能天梯</h1>
            <p className="page-description">
              游戏帧数、渲染与计算成绩 · 门店现货
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`hidden text-xs sm:inline ${inventoryState === "error" ? "text-amber-700" : "text-slate-600"}`}
            >
              {inventoryState === "ready"
                ? "门店库存已同步"
                : inventoryState === "loading"
                  ? "库存同步中"
                  : "库存暂不可用"}
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="刷新库存"
              title="刷新库存"
              disabled={inventoryState === "loading"}
              onClick={() => setInventoryRevision((value) => value + 1)}
            >
              <RefreshCw
                className={`h-4 w-4 ${inventoryState === "loading" ? "animate-spin" : ""}`}
              />
            </Button>
            <Button size="sm" onClick={onOpenContact} title="咨询选卡" aria-label="咨询选卡" className="h-10 w-10 px-0! sm:w-auto sm:px-3!">
              <MessageSquare className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">咨询选卡</span>
            </Button>
          </div>
        </header>

        <section
          aria-label="天梯筛选"
          className="space-y-3 border-b border-slate-200 pb-4"
        >
          <div className={`grid items-center gap-3 sm:grid-cols-2 ${gameMode ? 'grid-cols-[minmax(0,1fr)_auto] xl:grid-cols-[auto_180px_auto_minmax(200px,1fr)]' : 'grid-cols-1 lg:grid-cols-[auto_220px_minmax(200px,1fr)]'}`}>
            <SegmentedControl
              label="成绩分类"
              options={FAMILIES}
              value={family}
              onChange={(next) =>
                setMode(
                  RANKING_MODES.find((item) => item.family === next)!.value,
                )
              }
              className={gameMode ? 'col-span-2 sm:col-span-1' : ''}
            />
            <div className="min-w-0"><Select
              aria-label="测试项目"
              options={RANKING_MODES.filter(
                (item) => item.family === family,
              ).map((item) => ({
                value: item.value,
                label:
                  family === "threeDMark"
                    ? `${item.label} · ${data.threeDMarkSnapshot?.models.filter((model) => model.benchmark === item.value).length ?? 0}款`
                    : item.label,
              }))}
              value={mode}
              onValueChange={(value) => setMode(value as GpuRankingMode)}
            /></div>
            {gameMode && (
              <SegmentedControl<GpuResolution>
                label="游戏分辨率"
                options={RESOLUTIONS}
                value={resolution}
                onChange={setResolution}
                className="ranking-resolution"
              />
            )}
            <div className={gameMode ? 'col-span-2 min-w-0 sm:col-span-1' : 'min-w-0'}>
              <SearchInput
                aria-label="搜索显卡型号"
                placeholder="搜索型号，如 4080S、GTX 1080"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div id="ranking-catalog-type" className={`${filtersOpen ? '' : 'hidden sm:block'} w-[calc(50%-4px)] sm:w-36`}><Select
              aria-label="显卡类型"
              options={Object.entries(KIND_NAMES).map(([value, label]) => ({
                value,
                label,
              }))}
              value={kind}
              onValueChange={setKind}
            /></div>
            <div id="ranking-catalog-brand" className={`${filtersOpen ? '' : 'hidden sm:block'} w-[calc(50%-4px)] sm:w-36`}><Select
              aria-label="显卡品牌"
              options={[
                { value: "all", label: "全部品牌" },
                ...["NVIDIA", "AMD", "Intel"].map((value) => ({
                  value,
                  label: value,
                })),
              ]}
              value={brand}
              onValueChange={setBrand}
            /></div>
            <Button variant="ghost" size="sm" aria-expanded={filtersOpen} aria-controls="ranking-catalog-type ranking-catalog-brand ranking-advanced-filters" onClick={() => setFiltersOpen(open => !open)}>
              <SlidersHorizontal className="h-4 w-4" />更多筛选{Number(memory !== '0') + Number(budget !== '0') > 0 && <span className="rounded bg-blue-50 px-1.5 text-xs text-blue-700">{Number(memory !== '0') + Number(budget !== '0')}</span>}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
            </Button>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 sm:ml-auto">
              <label className="flex min-h-10 items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-blue-600" checked={scoredOnly} onChange={event => setScoredOnly(event.target.checked)} />仅看已有成绩</label>
              <label className="flex min-h-10 items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-blue-600" disabled={inventoryState !== 'ready'} checked={inStockOnly} onChange={event => setInStockOnly(event.target.checked)} />只看有货</label>
            </div>
          </div>
          <div id="ranking-advanced-filters" className={filtersOpen ? 'grid grid-cols-1 gap-3 border-t border-slate-200 pt-3 sm:grid-cols-2 lg:max-w-xl' : 'hidden'}>
            <label className="min-w-0 space-y-1.5"><span className="text-xs font-medium text-slate-600">最低显存</span>
            <Select
              aria-label="最低显存"
              options={[
                { value: "0", label: "不限显存" },
                ...[8, 12, 16, 24, 32].map((value) => ({
                  value: String(value),
                  label: `${value}GB 及以上`,
                })),
              ]}
              value={memory}
              onValueChange={setMemory}
            />
            </label>
            <label className="min-w-0 space-y-1.5"><span className="text-xs font-medium text-slate-600">门店预算</span>
            <Select
              aria-label="门店预算"
              disabled={inventoryState !== "ready"}
              options={[
                { value: "0", label: "不限门店价格" },
                ...[1000, 2000, 3000, 5000, 10000].map((value) => ({
                  value: String(value),
                  label: `门店 ¥${value.toLocaleString()} 以内`,
                })),
              ]}
              value={budget}
              onValueChange={setBudget}
            />
            </label>
          </div>
          {(kind !== 'desktop' || brand !== 'all' || memory !== '0' || budget !== '0' || inStockOnly || !scoredOnly) && <div aria-label="已选筛选条件" className="flex flex-wrap items-center gap-2 pt-1">
            {[
              ...(kind !== 'desktop' ? [{ label: KIND_NAMES[kind as keyof typeof KIND_NAMES], clear: () => setKind('desktop') }] : []),
              ...(brand !== 'all' ? [{ label: brand, clear: () => setBrand('all') }] : []),
              ...(memory !== '0' ? [{ label: `${memory}GB 及以上`, clear: () => setMemory('0') }] : []),
              ...(budget !== '0' ? [{ label: `¥${Number(budget).toLocaleString()} 以内`, clear: () => setBudget('0') }] : []),
              ...(inStockOnly ? [{ label: '仅看有货', clear: () => setInStockOnly(false) }] : []),
              ...(!scoredOnly ? [{ label: '包含待收录型号', clear: () => setScoredOnly(true) }] : []),
            ].map(filter => <span key={filter.label} className="inline-flex items-center gap-1 rounded-md bg-blue-50 py-1 pl-2.5 pr-1 text-xs text-blue-800">{filter.label}<button type="button" onClick={filter.clear} aria-label={`清除筛选：${filter.label}`} title="清除筛选" className="flex h-7 w-7 items-center justify-center rounded hover:bg-blue-100"><X className="h-3.5 w-3.5" /></button></span>)}
          </div>}
          <p className="text-xs leading-5 text-slate-600">已收录 {catalog.length} 款 · 当前类型有成绩 {measuredCount} 款</p>
        </section>

        {selected.length > 0 && (
          <section
            aria-label="显卡对比"
            className="border-b border-slate-200 bg-white py-5"
          >
            <div className="mb-4 flex items-center justify-between gap-3 px-3 sm:px-4">
              <h2 className="text-base font-semibold text-slate-900">
                显卡对比{" "}
                <span className="text-sm font-normal text-slate-500">
                  {selected.length} / 4
                </span>
              </h2>
              <div className="flex items-center gap-1">
                <Button size="sm" onClick={() => void share()}>
                  <Share2 className="h-4 w-4" />
                  分享
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="清空对比"
                  title="清空对比"
                  onClick={() => {
                    setSelected([]);
                    setBaseline("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[540px] table-fixed text-left text-sm">
                <caption className="sr-only">
                  {modeLabel}，{gameMode ? resolution : sourceName}
                  ；以所选基准卡为 100%
                </caption>
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="w-28 px-3 py-3 text-xs font-normal text-slate-500">
                      {gameMode
                        ? `${resolution === "1440p" ? "2K" : resolution} · `
                        : ""}
                      {modeLabel}
                    </th>
                    {selectedRows.map((row) => (
                      <th key={row.entry.id} className="px-3 py-3 align-top">
                        <div className="flex items-start gap-1">
                          <span className="min-w-0 flex-1 break-words font-semibold">
                            {row.entry.model}
                          </span>
                          <button
                            type="button"
                            className="shrink-0 p-1 text-slate-400 hover:text-slate-800"
                            aria-label={`移除 ${row.entry.model}`}
                            title="移除对比"
                            onClick={() => toggleCompare(row.entry.id)}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <label className="mt-2 flex items-center gap-1.5 text-xs font-normal text-slate-500">
                          <input
                            type="radio"
                            name="gpu-baseline"
                            checked={baseRow?.entry.id === row.entry.id}
                            onChange={() => setBaseline(row.entry.id)}
                          />
                          设为基准
                        </label>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <th className="px-3 py-3 text-xs font-normal text-slate-500">
                      {benchmarkUnit}
                    </th>
                    {selectedRows.map((row) => (
                      <td
                        key={row.entry.id}
                        className="px-3 py-3 text-lg font-semibold tabular-nums text-slate-900"
                      >
                        {metricText(row.value, mode)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-100">
                    <th className="px-3 py-3 text-xs font-normal text-slate-500">
                      相对 / 升级幅度
                    </th>
                    {selectedRows.map((row) => {
                      const ratio = relativePerformance(row.value, baseValue);
                      return (
                        <td
                          key={row.entry.id}
                          className="px-3 py-3 tabular-nums"
                        >
                          {ratio === null ? (
                            "无法比较"
                          ) : (
                            <>
                              <strong>{ratio.toFixed(1)}%</strong>
                              <span
                                className={`mt-1 block text-xs ${ratio >= 100 ? "text-emerald-700" : "text-slate-500"}`}
                              >
                                {row.entry.id === baseRow?.entry.id
                                  ? "基准显卡"
                                  : `${ratio >= 100 ? "+" : ""}${(ratio - 100).toFixed(1)}%`}
                              </span>
                            </>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <th className="px-3 py-2 text-xs font-normal text-slate-500">
                      显存 / 参考功耗
                    </th>
                    {selectedRows.map((row) => (
                      <td key={row.entry.id} className="px-3 py-2 text-xs">
                        {row.entry.memoryGb
                          ? `${row.entry.memoryGb}GB`
                          : "显存未区分"}{" "}
                        /{" "}
                        {row.entry.referencePowerW ? (
                          <a
                            className="underline underline-offset-2"
                            href={row.entry.specSource}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {row.entry.referencePowerW}W
                          </a>
                        ) : (
                          "功耗待补充"
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th className="px-3 py-2 text-xs font-normal text-slate-500">
                      门店在售起价
                    </th>
                    {selectedRows.map((row) => (
                      <td key={row.entry.id} className="px-3 py-2 text-xs">
                        {inventoryState !== "ready"
                          ? "库存暂不可用"
                          : row.price
                            ? `¥${row.price.toLocaleString()} · ${row.count}件`
                            : row.count
                              ? "有货，价格待确认"
                              : "暂无现货"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th className="px-3 py-2 text-xs font-normal text-slate-500">
                      来源样本数
                    </th>
                    {selectedRows.map((row) => (
                      <td
                        key={row.entry.id}
                        className={`px-3 py-2 text-xs ${row.samples !== null && row.samples < 5 ? "text-amber-700" : "text-slate-500"}`}
                      >
                        {row.samples === null
                          ? row.value !== null
                            ? "源站未提供"
                            : "未收录"
                          : `${row.samples} 次${row.samples < 5 ? " · 样本较少" : ""}`}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            {unavailableSelections.map((id) => (
              <p className="mt-2 px-3 text-xs text-amber-700" key={id}>
                链接中的型号 {id} 当前未收录。
                <button
                  type="button"
                  className="ml-2 underline"
                  onClick={() => toggleCompare(id)}
                >
                  移除
                </button>
              </p>
            ))}
            {selected.length === 1 && (
              <p className="mt-3 px-3 text-xs text-slate-500">
                尚未选择第二款显卡
              </p>
            )}
          </section>
        )}
        <div
          role="status"
          aria-live="polite"
          className={notice ? "py-3 text-sm text-blue-700" : "sr-only"}
        >
          {notice}
        </div>
        {shareLink && (
          <input
            aria-label="对比分享链接"
            readOnly
            value={shareLink}
            onFocus={(event) => event.target.select()}
            className="my-2 w-full rounded border border-slate-300 p-2 text-sm"
          />
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 py-4 text-xs text-slate-500">
          <span>
            {rows.length} 款符合条件 · 按{benchmarkUnit}排序
          </span>
          <span>
            {baseRow && baseValue
              ? `基准 ${baseRow.entry.model} = 100%`
              : "当前项目暂无可用基准"}
          </span>
        </div>
        {dataState === "error" && (
          <p role="alert" className="mb-3 text-sm text-amber-700">
            成绩同步暂不可用
            {data.snapshot || data.blenderSnapshot
              ? "，当前保留上次有效数据。"
              : "，稍后将自动重试。"}
          </p>
        )}
        {benchmarkSource && (
          <p className="mb-3 text-xs leading-5 text-slate-600">
            {benchmarkSource.name} ·{" "}
            {benchmarkSource.methodology === "community-rating"
              ? "社区提交汇总，含超频、降压和不同整机配置，非原厂标准分"
              : benchmarkSource.methodology === "review"
                ? "编辑部统一平台测试，非用户平均分"
                : "公开用户成绩中位数，非默认频率限定样本"}
          </p>
        )}
        {activeStatus?.refreshFailed && (
          <p role="alert" className="mb-3 text-sm text-amber-700">
            数据源本次检查失败，以下为上次有效成绩。
          </p>
        )}
        <section
          aria-label="显卡性能排名"
          className="border-y border-slate-200 bg-white"
        >
          <div className="hidden grid-cols-[36px_minmax(180px,1.5fr)_minmax(120px,1fr)_120px_90px_80px] items-center gap-3 border-b border-slate-200 px-4 py-3 text-xs text-slate-500 lg:grid">
            <span>序号</span>
            <span>显卡型号</span>
            <span>相对表现</span>
            <span className="text-right">{benchmarkUnit}</span>
            <span className="text-right">相对基准</span>
            <span className="text-center">对比</span>
          </div>
          {rows.slice(0, limit).map((row, index) => {
            const ratio = relativePerformance(row.value, baseValue);
            const isSelected = selected.includes(row.entry.id);
            return (
              <article
                key={row.entry.id}
                className="border-b border-slate-100 last:border-0"
              >
                <div className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 px-3 py-4 lg:grid-cols-[36px_minmax(180px,1.5fr)_minmax(120px,1fr)_120px_90px_80px] lg:gap-3 lg:px-4">
                  <span className="text-xs tabular-nums text-slate-400">
                    {row.value === null
                      ? "—"
                      : String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <button
                      type="button"
                      className="flex w-full items-start gap-1 text-left"
                      onClick={() =>
                        setExpanded(
                          expanded === row.entry.id ? null : row.entry.id,
                        )
                      }
                      aria-expanded={expanded === row.entry.id}
                    >
                      <span className="break-words text-sm font-semibold text-slate-900">
                        {row.entry.model}
                      </span>
                      {expanded === row.entry.id ? (
                        <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      ) : (
                        <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      )}
                    </button>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                      <span>
                        {row.entry.brand}
                        {row.entry.memoryGb ? ` · ${row.entry.memoryGb}GB` : ""}
                      </span>
                      {inventoryState === "ready" && row.count > 0 && (
                        <a href="/#inventory" className="text-emerald-700">
                          有货 {row.count}件
                          {row.price
                            ? ` · ¥${row.price.toLocaleString()} 起`
                            : ""}
                        </a>
                      )}
                    </div>
                  </div>
                  <div
                    className="hidden h-1.5 overflow-hidden rounded-full bg-slate-100 lg:block"
                    aria-label={`${row.entry.model} 当前成绩 ${metricText(row.value, mode)}`}
                  >
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{
                        width: `${row.value === null ? 0 : (row.value / maxValue) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="col-start-3 row-start-1 text-right tabular-nums lg:col-start-auto lg:row-start-auto">
                    <strong className="text-sm font-semibold text-slate-900">
                      {metricText(row.value, mode)}
                    </strong>
                    {row.samples !== null && (
                      <small
                        className={`mt-1 block text-[11px] ${row.samples < 5 ? "text-amber-700" : "text-slate-500"}`}
                      >
                        {row.samples} 次{row.samples < 5 ? " · 样本较少" : ""}
                      </small>
                    )}
                    <small className="mt-1 block text-xs text-slate-500 lg:hidden">
                      {ratio !== null ? `${ratio.toFixed(1)}%` : "—"}
                    </small>
                  </div>
                  <span className="hidden text-right text-sm tabular-nums text-slate-600 lg:block">
                    {ratio !== null ? `${ratio.toFixed(1)}%` : "—"}
                  </span>
                  <div className="col-span-3 flex justify-end lg:col-span-1 lg:justify-center">
                    <Button
                      size="sm"
                      variant={isSelected ? "choice" : "ghost"}
                      aria-pressed={isSelected}
                      aria-label={`${isSelected ? "取消对比" : "加入对比"} ${row.entry.model}`}
                      onClick={() => toggleCompare(row.entry.id)}
                      disabled={!isSelected && selected.length >= 4}
                    >
                      {isSelected ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                      {isSelected ? "已选" : "对比"}
                    </Button>
                  </div>
                </div>
                {expanded === row.entry.id && (
                  <div className="border-t border-slate-100 bg-slate-50 px-4 py-4">
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
                      {RANKING_MODES.map((item) => {
                        const metric = metricFor(
                          row.entry,
                          data,
                          item.value,
                          resolution,
                        );
                        return (
                          <div key={item.value}>
                            <dt className="text-xs text-slate-500">
                              {item.label}
                              {item.family === "gaming"
                                ? ` · ${resolution === "1440p" ? "2K" : resolution}`
                                : ""}
                            </dt>
                            <dd className="mt-1 text-sm font-medium text-slate-800">
                              {metricText(metric.value, item.value)}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                    <p className="mt-4 text-xs leading-5 text-slate-500">
                      {KIND_NAMES[row.entry.kind]} ·{" "}
                      {row.entry.specSource ? (
                        <a
                          className="underline underline-offset-2"
                          href={row.entry.specSource}
                          target="_blank"
                          rel="noreferrer"
                        >
                          参考功耗 {row.entry.referencePowerW}W · 官方规格
                        </a>
                      ) : (
                        "参考功耗尚未收录"
                      )}{" "}
                      · 各测试独立比较；缺项不代表不支持。
                    </p>
                  </div>
                )}
              </article>
            );
          })}
          {rows.length === 0 && (
            <div className="px-5 py-12 text-center">
              <CircleHelp className="mx-auto mb-3 h-6 w-6 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-800">
                {dataState === "loading"
                  ? "正在读取成绩"
                  : !projectHasScores
                    ? "当前测试成绩尚未接入"
                    : "没有符合条件的成绩"}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {!projectHasScores && dataState !== "loading"
                  ? (activeStatus?.reason ??
                    "等待数据源提供可用成绩，不以其他测试或相似型号代替。")
                  : "可以调整筛选条件，或查看尚未收录成绩的型号。"}
              </p>
              {scoredOnly && (
                <Button
                  className="mt-4"
                  size="sm"
                  onClick={() => setScoredOnly(false)}
                >
                  查看全部已收录型号
                </Button>
              )}
            </div>
          )}
        </section>
        {rows.length > limit && (
          <div className="py-4 text-center">
            <Button onClick={() => setLimit((value) => value + 50)}>
              加载更多 · 剩余 {rows.length - limit} 款
            </Button>
          </div>
        )}

        <details className="mt-5 border-y border-slate-200 py-4 text-sm text-slate-600">
          <summary className="cursor-pointer select-none font-medium text-slate-700">
            数据来源与口径{" "}
            <span className="mt-1 block text-xs font-normal leading-5 text-slate-500">
              {sourceName} · 源站更新{" "}
              {sourceDate(sourceSnapshot?.sourceUpdatedAt)} · 最近检查{" "}
              {sourceDate(sourceSnapshot?.checkedAt)}
            </span>
          </summary>
          <div className="mt-4 grid gap-4 text-xs leading-6 sm:grid-cols-2">
            <div>
              <p>源站更新：{sourceDate(sourceSnapshot?.sourceUpdatedAt)}</p>
              <p>本站数据更新：{sourceDate(sourceSnapshot?.updatedAt)}</p>
              <p>最近成功检查：{sourceDate(sourceSnapshot?.checkedAt)}</p>
              {benchmarkSource?.reason && (
                <p className="text-amber-700">
                  {benchmarkSource.reason}
                  ；继续展示上次核验的参考成绩，不代表本次已更新。
                </p>
              )}
              {activeStatus?.lastAttemptAt && (
                <p>最近尝试：{sourceDate(activeStatus.lastAttemptAt)}</p>
              )}
              <a
                href={sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-700 underline underline-offset-2"
              >
                查看测试来源
                <ArrowUpRight className="h-3 w-3" />
              </a>
            </div>
            <div>
              <p>
                {gameMode
                  ? "游戏成绩取同一原生分辨率测试集的平均 FPS，不包含超分和帧生成。每小时检查源站；源站未更新不等于实时实测。"
                  : mode === "blenderCycles"
                    ? `Blender ${data.blenderSnapshot?.version ?? ""} 设备中位数，单位为样本/分钟。每 6 小时检查；仅在同一版本内比较。`
                    : mode.startsWith("geekbench")
                      ? "Geekbench 各计算 API 独立比较；只展示已接入的有效成绩，每 6 小时检查。"
                      : benchmarkSource?.methodology === "review"
                        ? `${modeLabel} 取自 ComputerBase 编辑部实测，不是 UL 用户平均分，也不是含 CPU 的总分。样本次数未公开，不推测次数；每 6 小时尝试检查，源站拒绝访问时保留核验快照。`
                        : benchmarkSource?.methodology === "public-median"
                          ? "Steel Nomad 取自 UL 官方公开硬件榜的用户成绩中位数，官网每日更新，本站每 6 小时检查。不限定默认频率，不能当作严格原厂基准；同名但分数存在歧义的条目不展示。样本数未公开。"
                          : benchmarkSource?.methodology === "community-rating"
                            ? "Port Royal 取自 ComputerBase 社区公开的 GPU 汇总值，保留源站样本数；不是编辑部实测或原厂标准分。包含超频、降压、功耗调整和不同驱动/整机配置，不能据此直接判断硬件故障。每 6 小时尝试检查；失败保留核验快照。"
                            : "仅比较同一 3DMark 项目显卡成绩，不使用含 CPU 的总分。未收录项目不推算。"}
              </p>
              <p className="mt-2">
                D 版、笔记本版及明确区分的显存容量不混用成绩。样本少于 5
                次的结果仅供参考；功耗为已核实型号的官方参考值，不代表整机功耗。门店起价不是市场均价，成色与配件以库存页为准。
              </p>
            </div>
          </div>
        </details>
      </div>
    </main>
  );
}
