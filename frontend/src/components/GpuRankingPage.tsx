import { useEffect, useMemo, useState } from "react";
import { ArrowDownWideNarrow, ArrowUpRight, BarChart3, CircleHelp, MessageSquare, RefreshCw, ShieldCheck } from "lucide-react";
import { apiFetch } from "../lib/api";
import { GPU_RANKING_DATA, gpuInventoryMatches, isGpuInventoryAvailable, resolveBlenderGpuBenchmark, resolveGpuBenchmark, resolveGpuRankingScore, type BlenderGpuRankingSnapshot, type GpuBrand, type GpuRankingMode, type GpuRankingScoreSnapshot, type GpuRankingSnapshot, type GpuResolution, type GpuScoreBenchmark } from "../data/gpuRanking";
import { Button, SearchInput, SegmentedControl } from "./ui/controls";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  price: number | string;
  quantity: number;
  specs?: string;
  status: string;
}

type InventoryState = "loading" | "ready" | "error";
type BenchmarkState = "loading" | "ready" | "error";
type RankingFamily = "gaming" | "threeDMark" | "compute";
type OptionalSourceStatus = { configured: boolean; reason: string };

const RESOLUTIONS: { value: GpuResolution; label: string }[] = [
  { value: "1080p", label: "1080p" },
  { value: "1440p", label: "2K" },
  { value: "4k", label: "4K" },
];

const BRANDS: { value: GpuBrand | "all"; label: string }[] = [
  { value: "all", label: "全部品牌" },
  { value: "NVIDIA", label: "NVIDIA" },
  { value: "AMD", label: "AMD" },
  { value: "Intel", label: "Intel" },
];

const RANKING_FAMILIES: { value: RankingFamily; label: string }[] = [
  { value: "gaming", label: "游戏实测" },
  { value: "threeDMark", label: "3DMark 跑分" },
  { value: "compute", label: "渲染与计算" },
];

const RANKING_MODES: Record<RankingFamily, { value: GpuRankingMode; label: string }[]> = {
  gaming: [
    { value: "raster", label: "光栅游戏" },
    { value: "rayTracing", label: "光线追踪" },
  ],
  threeDMark: [
    { value: "timeSpyGraphics", label: "Time Spy 显卡分" },
    { value: "portRoyal", label: "Port Royal 光追分" },
  ],
  compute: [
    { value: "blenderCycles", label: "Blender Cycles" },
    { value: "geekbenchVulkan", label: "Geekbench Vulkan" },
    { value: "geekbenchOpencl", label: "Geekbench OpenCL" },
    { value: "geekbenchCuda", label: "Geekbench CUDA" },
  ],
};

const SCORE_BENCHMARKS: Partial<Record<GpuRankingMode, GpuScoreBenchmark>> = {
  timeSpyGraphics: "timeSpyGraphics",
  portRoyal: "portRoyal",
  geekbenchVulkan: "geekbenchVulkan",
  geekbenchOpencl: "geekbenchOpencl",
  geekbenchCuda: "geekbenchCuda",
};

function priceNumber(price: number | string) {
  const value = Number(price);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function formatSourceDate(value: string | null | undefined) {
  if (!value) return "尚未提供";
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date)
    : "尚未提供";
}

export default function GpuRankingPage({ onOpenContact }: { onOpenContact: () => void }) {
  const [mode, setMode] = useState<GpuRankingMode>("raster");
  const [family, setFamily] = useState<RankingFamily>("gaming");
  const [resolution, setResolution] = useState<GpuResolution>("1440p");
  const [brand, setBrand] = useState<GpuBrand | "all">("all");
  const [search, setSearch] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[] | null>(null);
  const [inventoryState, setInventoryState] = useState<InventoryState>("loading");
  const [rankingSnapshot, setRankingSnapshot] = useState<GpuRankingSnapshot | null>(null);
  const [blenderSnapshot, setBlenderSnapshot] = useState<BlenderGpuRankingSnapshot | null>(null);
  const [geekbenchSnapshot, setGeekbenchSnapshot] = useState<GpuRankingScoreSnapshot | null>(null);
  const [threeDMarkSnapshot, setThreeDMarkSnapshot] = useState<GpuRankingScoreSnapshot | null>(null);
  const [geekbenchStatus, setGeekbenchStatus] = useState<OptionalSourceStatus>({ configured: false, reason: "正在读取数据源状态" });
  const [threeDMarkStatus, setThreeDMarkStatus] = useState<OptionalSourceStatus>({ configured: false, reason: "正在读取数据源状态" });
  const [benchmarkState, setBenchmarkState] = useState<BenchmarkState>("loading");
  const [blenderBenchmarkState, setBlenderBenchmarkState] = useState<BenchmarkState>("loading");

  const refreshInventory = async () => {
    setInventoryState("loading");
    try {
      const result = await apiFetch<{ success: boolean; items?: InventoryItem[] }>("/api/inventory");
      if (!result.success || !Array.isArray(result.items)) throw new Error("Inventory response is unavailable");
      setInventoryItems(result.items.filter(item => item.category === "GPU"));
      setInventoryState("ready");
    } catch {
      setInventoryItems(null);
      setInventoryState("error");
    }
  };

  useEffect(() => {
    void refreshInventory();
  }, []);

  useEffect(() => {
    let disposed = false;
    let timer: number | undefined;

    const refresh = async () => {
      try {
        const result = await apiFetch<{
          success: boolean;
          snapshot?: GpuRankingSnapshot | null;
          blenderSnapshot?: BlenderGpuRankingSnapshot | null;
          geekbenchSnapshot?: GpuRankingScoreSnapshot | null;
          geekbenchStatus?: OptionalSourceStatus;
          threeDMarkSnapshot?: GpuRankingScoreSnapshot | null;
          threeDMarkStatus?: OptionalSourceStatus;
        }>("/api/gpu-ranking");
        if (!result.success) throw new Error("GPU ranking data is unavailable");
        if (disposed) return;
        setRankingSnapshot(result.snapshot ?? null);
        setBenchmarkState(result.snapshot ? "ready" : "error");
        setBlenderSnapshot(result.blenderSnapshot ?? null);
        setBlenderBenchmarkState(result.blenderSnapshot ? "ready" : "error");
        setGeekbenchSnapshot(result.geekbenchSnapshot ?? null);
        setGeekbenchStatus(result.geekbenchStatus ?? { configured: false, reason: "Geekbench 数据源状态不可用" });
        setThreeDMarkSnapshot(result.threeDMarkSnapshot ?? null);
        setThreeDMarkStatus(result.threeDMarkStatus ?? { configured: false, reason: "3DMark 数据源状态不可用" });
        const hasAllSources = Boolean(
          result.snapshot &&
          result.blenderSnapshot &&
          (!result.geekbenchStatus?.configured || result.geekbenchSnapshot) &&
          (!result.threeDMarkStatus?.configured || result.threeDMarkSnapshot),
        );
        timer = window.setTimeout(() => void refresh(), hasAllSources ? 15 * 60 * 1000 : 15 * 1000);
      } catch {
        if (disposed) return;
        setBenchmarkState("error");
        setBlenderBenchmarkState("error");
        timer = window.setTimeout(() => void refresh(), 15 * 1000);
      }
    };

    void refresh();
    return () => {
      disposed = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  const syncedModels = useMemo(
    () => new Map(rankingSnapshot?.models.map(model => [model.model, model]) ?? []),
    [rankingSnapshot],
  );

  const { rows, hasRankableScores } = useMemo(() => {
    const query = search.trim().toLowerCase();
    const blenderBenchmarks = new Map(GPU_RANKING_DATA.map(entry => [
      entry.model,
      resolveBlenderGpuBenchmark(entry, blenderSnapshot?.models ?? []),
    ]));
    const maxBlenderScore = Math.max(0, ...[...blenderBenchmarks.values()].map(item => item.score ?? 0));
    const scoreBenchmark = SCORE_BENCHMARKS[mode];
    const scoreSnapshot = mode === "timeSpyGraphics" || mode === "portRoyal"
      ? threeDMarkSnapshot
      : mode === "geekbenchVulkan" || mode === "geekbenchOpencl" || mode === "geekbenchCuda"
        ? geekbenchSnapshot
        : null;
    const externalBenchmarks = new Map(GPU_RANKING_DATA.map(entry => [
      entry.model,
      scoreBenchmark ? resolveGpuRankingScore(entry, scoreSnapshot?.models ?? [], scoreBenchmark) : { score: null, samples: null },
    ]));
    const maxExternalScore = Math.max(0, ...[...externalBenchmarks.values()].map(item => item.score ?? 0));

    const allRows = GPU_RANKING_DATA
      .map(entry => {
        const isGameMode = mode === "raster" || mode === "rayTracing";
        const gameBenchmark = isGameMode
          ? resolveGpuBenchmark(entry, syncedModels.get(entry.model), mode, resolution)
          : null;
        const blenderBenchmark = mode === "blenderCycles" ? blenderBenchmarks.get(entry.model)! : null;
        const blenderScore = blenderBenchmark?.score ?? null;
        const externalBenchmark = scoreBenchmark ? externalBenchmarks.get(entry.model)! : null;
        const measuredScore = mode === "blenderCycles" ? blenderScore : externalBenchmark?.score ?? null;
        const relativeScore = isGameMode
          ? gameBenchmark!.relativeScore
          : measuredScore !== null
            ? (measuredScore / (mode === "blenderCycles" ? maxBlenderScore : maxExternalScore || 1)) * 100
            : 0;
        const fps = gameBenchmark?.fps ?? null;
        const matched = inventoryItems?.filter(item =>
          gpuInventoryMatches(entry.model, `${item.name} ${item.specs ?? ""}`)
        ) ?? [];
        const available = matched.filter(isGpuInventoryAvailable);
        const count = available.reduce((sum, item) => sum + item.quantity, 0);
        const prices = available.map(item => priceNumber(item.price)).filter((price): price is number => price !== null);
        const stockPrice = prices.length ? Math.min(...prices) : null;
        return {
          entry,
          score: relativeScore,
          sortScore: isGameMode ? relativeScore : measuredScore ?? -1,
          fps,
          measuredScore,
          samples: blenderBenchmark?.samples ?? externalBenchmark?.samples ?? null,
          matched,
          available,
          count,
          stockPrice,
        };
      });
    const hasRankableScores = allRows.some(row => mode === "raster" || mode === "rayTracing" ? row.score > 0 : row.measuredScore !== null);
    const rows = allRows
      .filter(row => brand === "all" || row.entry.brand === brand)
      .filter(row => !query || row.entry.model.toLowerCase().includes(query))
      .filter(row => !inStockOnly || row.available.length > 0)
      .sort((left, right) => right.sortScore - left.sortScore);
    return { rows, hasRankableScores };
  }, [blenderSnapshot, brand, geekbenchSnapshot, inStockOnly, inventoryItems, mode, resolution, search, syncedModels, threeDMarkSnapshot]);

  const modeOptions = RANKING_MODES[family];
  const currentModeIsGame = mode === "raster" || mode === "rayTracing";
  const sourceStatusText = mode === "blenderCycles"
    ? blenderSnapshot ? `Blender ${blenderSnapshot.version} · 最近同步 ${formatSourceDate(blenderSnapshot.checkedAt)}` : blenderBenchmarkState === "loading" ? "正在同步 Blender 跑分" : "Blender 跑分暂不可用"
    : mode === "timeSpyGraphics" || mode === "portRoyal"
      ? threeDMarkSnapshot ? `3DMark · 最近检查 ${formatSourceDate(threeDMarkSnapshot.checkedAt)}` : `${threeDMarkStatus.reason}，暂无实测成绩`
      : mode === "geekbenchVulkan" || mode === "geekbenchOpencl" || mode === "geekbenchCuda"
        ? geekbenchSnapshot ? `Geekbench 7 · 最近同步 ${formatSourceDate(geekbenchSnapshot.checkedAt)}` : `${geekbenchStatus.reason}，暂无实测成绩`
        : rankingSnapshot ? `源站更新 ${formatSourceDate(rankingSnapshot.sourceUpdatedAt)} · 最近检查 ${formatSourceDate(rankingSnapshot.checkedAt)}` : benchmarkState === "loading" ? "正在同步实测 FPS" : "实测 FPS 暂不可用，当前仅显示相对成绩";
  const benchmarkExplanation = mode === "blenderCycles"
    ? "跑分取自 Blender Cycles 设备中位数，单位为样本/分钟；只在同一 Blender 版本内比较。每款显卡同时展示来源样本数，少于 5 份时会标出。"
    : mode === "timeSpyGraphics"
      ? "只比较 3DMark Time Spy Graphics 显卡子分，不使用包含 CPU 影响的总分；与真实游戏 FPS 是不同指标。"
      : mode === "portRoyal"
        ? "Port Royal 是 1440p 光追合成测试；成绩仅与相同测试版本比较，不等同于具体游戏的光追帧数。"
        : mode === "geekbenchVulkan" || mode === "geekbenchOpencl" || mode === "geekbenchCuda"
          ? "Geekbench 7 GPU 计算成绩按所选 API 独立排名；取每款显卡近期有效样本中位数，不能用来推算游戏 FPS。"
          : "平均 FPS 是源站测试集的汇总成绩，按原生分辨率统计，不包含 DLSS、FSR、XeSS 超分或帧生成；实际帧数会随游戏与整机配置变化。";
  const syncExplanation = mode === "blenderCycles"
    ? "Blender Open Data 每日发布公开成绩，本站每 6 小时检查同步一次；跑分是渲染性能，不代表游戏 FPS。"
    : mode === "timeSpyGraphics" || mode === "portRoyal"
      ? "仅从已获展示授权的成绩文件导入，本站每 15 分钟检查文件更新；未授权数据不会抓取或显示。"
      : mode === "geekbenchVulkan" || mode === "geekbenchOpencl" || mode === "geekbenchCuda"
        ? "通过 Geekbench Browser API 每 6 小时同步；展示数据需配置 API Key 并确认再展示许可。"
        : "游戏测试源站没有实时推送接口，本站每小时自动检查并同步，源站与测试平台说明请见原文。";
  const sourceUrl = mode === "blenderCycles"
    ? "https://opendata.blender.org/benchmarks/query/"
    : mode === "timeSpyGraphics" || mode === "portRoyal"
      ? "https://www.3dmark.com/search"
      : mode === "geekbenchVulkan" || mode === "geekbenchOpencl" || mode === "geekbenchCuda"
        ? mode === "geekbenchOpencl" ? "https://browser.geekbench.com/opencl-benchmarks" : mode === "geekbenchVulkan" ? "https://browser.geekbench.com/vulkan-benchmarks" : "https://browser.geekbench.com/v7/gpu"
        : "https://www.tomshardware.com/reviews/gpu-hierarchy,4388.html";
  const sourceName = mode === "blenderCycles"
    ? "Blender Open Data"
    : mode === "timeSpyGraphics" || mode === "portRoyal"
      ? "3DMark 成绩查询"
      : mode === "geekbenchVulkan" || mode === "geekbenchOpencl" || mode === "geekbenchCuda"
        ? "Geekbench Browser"
        : "游戏测试";

  return (
    <main className="min-h-[calc(100vh-5rem)] flex-1 bg-slate-50 pt-20 sm:pt-24">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <header className="border-b border-slate-200 pb-7 sm:pb-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-700">
                <BarChart3 className="h-4 w-4" aria-hidden="true" />
                显卡实测成绩
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">显卡性能天梯</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                对比游戏帧数、3DMark、Blender 与 Geekbench 成绩，并同步核对门店 ERP 现货。
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-sm text-slate-500" aria-live="polite">
              <span className={`h-2 w-2 rounded-full ${inventoryState === "ready" ? "bg-emerald-500" : inventoryState === "error" ? "bg-amber-500" : "animate-pulse bg-blue-500"}`} />
              {inventoryState === "ready" ? "ERP 库存已同步" : inventoryState === "error" ? "ERP 库存暂不可用" : "正在同步 ERP 库存"}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => void refreshInventory()}
                disabled={inventoryState === "loading"}
                title="刷新 ERP 库存"
                aria-label="刷新 ERP 库存"
              >
                <RefreshCw className={`h-4 w-4 ${inventoryState === "loading" ? "animate-spin" : ""}`} />
              </Button>
              <Button variant="secondary" size="sm" onClick={onOpenContact}>
                <MessageSquare className="h-4 w-4" />咨询选卡
              </Button>
            </div>
          </div>
        </header>

        <section aria-label="天梯筛选" className="border-b border-slate-200 py-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[auto_auto_auto_minmax(220px,1fr)] xl:items-center">
            <SegmentedControl<RankingFamily>
              label="成绩分类"
              className="w-full sm:w-fit"
              options={RANKING_FAMILIES}
              value={family}
              onChange={nextFamily => {
                setFamily(nextFamily);
                setMode(RANKING_MODES[nextFamily][0].value);
              }}
            />
            <SegmentedControl<GpuRankingMode>
              label="成绩类型"
              className={`w-full sm:w-fit gpu-ranking-mode-switch gpu-ranking-mode-switch-${family}`}
              options={modeOptions}
              value={mode}
              onChange={setMode}
            />
            {currentModeIsGame && (
              <SegmentedControl<GpuResolution>
                label="游戏分辨率"
                className="w-full sm:w-fit"
                options={RESOLUTIONS}
                value={resolution}
                onChange={setResolution}
              />
            )}
            <SearchInput
              aria-label="搜索显卡型号"
              placeholder="搜索显卡型号"
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SegmentedControl<GpuBrand | "all">
              label="显卡品牌"
              className="w-full sm:w-fit"
              options={BRANDS}
              value={brand}
              onChange={setBrand}
            />
            <label className={`inline-flex min-h-10 items-center gap-2 self-start text-sm ${inventoryState === "ready" ? "cursor-pointer text-slate-700" : "cursor-not-allowed text-slate-400"}`}>
              <input
                type="checkbox"
                checked={inStockOnly}
                disabled={inventoryState !== "ready"}
                onChange={event => setInStockOnly(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-blue-600"
              />
              只看 ERP 有货
            </label>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-slate-200 py-4 text-sm text-slate-500">
          <span className="inline-flex items-center gap-2">
            <ArrowDownWideNarrow className="h-4 w-4 text-slate-400" aria-hidden="true" />
            {rows.length ? `共 ${rows.length} 款，${hasRankableScores ? "按当前成绩排序" : "暂无跑分排名"}` : "没有符合筛选条件的显卡"}
          </span>
          <span aria-live="polite">{sourceStatusText}</span>
        </div>

        <section aria-label="显卡性能排名" className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="hidden grid-cols-[52px_minmax(190px,1.1fr)_minmax(130px,1.8fr)_110px_72px_230px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold text-slate-500 md:grid">
            <span>排名</span><span>显卡型号</span><span>相对表现</span><span className="text-right">{currentModeIsGame ? "平均 FPS" : mode === "blenderCycles" ? "Cycles 渲染跑分" : "测试分数"}</span><span className="text-right">比例</span><span>门店库存</span>
          </div>
          {rows.length ? rows.map(({ entry, score, fps, measuredScore, samples, matched, available, count, stockPrice }, index) => (
            <article
              key={entry.model}
              className="grid grid-cols-[36px_minmax(0,1fr)_auto] grid-rows-[auto_auto_auto] items-center gap-x-3 gap-y-2 border-b border-slate-100 px-3 py-3.5 last:border-b-0 sm:px-5 md:grid-cols-[52px_minmax(190px,1.1fr)_minmax(130px,1.8fr)_110px_72px_230px] md:grid-rows-1 md:gap-4 md:py-3"
            >
              <span className="row-span-2 text-center font-display text-sm font-semibold tabular-nums text-slate-400 md:row-span-1">{(currentModeIsGame ? score > 0 : measuredScore !== null) ? String(index + 1).padStart(2, "0") : "—"}</span>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-slate-900 sm:text-base">{entry.model}</h2>
                <span className="mt-0.5 block text-xs text-slate-500">{entry.brand}</span>
              </div>
              <span className="col-start-3 row-start-1 flex min-w-[5.5rem] flex-col items-end text-right font-display tabular-nums text-slate-900 md:col-start-4 md:row-start-1">
                {!currentModeIsGame ? (
                  <>
                    <strong className="text-sm font-semibold sm:text-base">{measuredScore === null ? "暂无跑分" : Math.round(measuredScore).toLocaleString("zh-CN")}</strong>
                    <small className={`text-[11px] font-medium ${samples !== null && samples < 5 ? "text-amber-700" : "text-slate-500"}`}>
                      {samples === null ? "数据源待接入" : `${samples < 5 ? "样本较少 · " : ""}${samples} 次成绩`}
                    </small>
                  </>
                ) : (
                  <strong className="text-sm font-semibold sm:text-base">{fps === null ? "暂无 FPS" : `${fps.toFixed(1)} FPS`}</strong>
                )}
                <small className="text-[11px] font-medium text-slate-500 md:hidden">{score > 0 ? `${score.toFixed(1)}% 相对` : "暂无相对成绩"}</small>
              </span>
              <span className="hidden text-right font-display text-sm font-semibold tabular-nums text-slate-600 md:block md:col-start-5 md:row-start-1">{score > 0 ? `${score.toFixed(1)}%` : "—"}</span>
              <div className="col-start-2 col-span-2 flex min-w-0 items-center gap-3 md:col-start-3 md:col-span-1 md:row-start-1">
                {score > 0 ? (
                  <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100" aria-label={`${entry.model} 相对成绩 ${score.toFixed(1)}%`}>
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(3, score)}%` }} />
                  </div>
                ) : (
                  <span className="hidden shrink-0 text-xs text-slate-400 md:inline">暂无相对成绩</span>
                )}
                {currentModeIsGame && (
                  <span className="shrink-0 text-[11px] tabular-nums text-slate-400 md:hidden">{resolution === "1440p" ? "2K" : resolution}</span>
                )}
              </div>
              <div className="col-span-3 flex min-h-9 items-center justify-between gap-3 border-t border-slate-100 pt-2 text-xs md:col-span-1 md:border-0 md:pt-0 md:text-sm">
                {inventoryState === "loading" ? (
                  <span className="text-slate-400">同步库存中</span>
                ) : inventoryState === "error" ? (
                  <span className="text-amber-700">库存暂不可用</span>
                ) : available.length ? (
                  <>
                    <span className="min-w-0 truncate font-medium text-emerald-700">ERP 有货 · {count} 件{stockPrice !== null && ` · ¥${stockPrice.toLocaleString("zh-CN")}`}</span>
                    <a href="/#inventory" className="inline-flex shrink-0 items-center gap-1 font-medium text-blue-700 hover:text-blue-800">
                      看现货 <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  </>
                ) : matched.length ? (
                  <span className="text-slate-500">ERP 暂无可售库存</span>
                ) : (
                  <span className="text-slate-400">ERP 无匹配库存</span>
                )}
              </div>
            </article>
          )) : (
            <div className="px-5 py-16 text-center text-sm text-slate-500">调整品牌或搜索条件后再试试。</div>
          )}
        </section>

        <section className="mt-5 grid gap-4 border-b border-slate-200 pb-6 text-sm leading-6 text-slate-600 md:grid-cols-2">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
            <p>{benchmarkExplanation}</p>
          </div>
          <div className="flex items-start gap-2.5">
            <CircleHelp className="mt-1 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <p>现货与价格取自 ERP。显卡品牌型号与跑分型号无法严格对应时不会强行标为有货，具体卡型、成色与配件以库存页和门店确认为准。</p>
          </div>
        </section>

        <footer className="flex flex-col gap-2 pt-4 text-xs leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>{syncExplanation}</span>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-blue-700"
          >
            查看{sourceName}来源 <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
          </a>
        </footer>
        {inventoryState === "ready" && inventoryItems?.length === 0 && (
          <p className="mt-3 text-xs text-slate-500">ERP 当前未返回显卡类库存。</p>
        )}
        <div className="sr-only" aria-live="polite">{inStockOnly ? `${rows.length} 款显卡有货` : `${rows.length} 款显卡`}</div>
      </div>
    </main>
  );
}
