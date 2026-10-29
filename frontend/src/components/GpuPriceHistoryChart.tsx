import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Chart, CategoryScale, LinearScale, LineController, LineElement, PointElement, type Plugin } from "chart.js";
import type { GpuPriceHistory, GpuPricePlatform } from "@cdxkyhd/shared";
import { PRICE_PLATFORMS, priceHistoryLabelPositions, priceHistoryLastOffer, priceHistoryLines, priceHistoryMoney, priceHistoryPointRadius, priceHistoryTickIndices } from "../lib/gpuPriceHistory";

Chart.register(CategoryScale, LinearScale, LineController, LineElement, PointElement);
type PriceChart = Chart<"line", (number | null)[], string>;
type Selection = { index: number; x: number; y: number; keyboard: boolean };
const observedTime = (value: string) => new Date(value).toLocaleTimeString("zh-CN", { timeZone: "Asia/Shanghai", hour: "2-digit", minute: "2-digit", hour12: false });

export default function GpuPriceHistoryChart({ history, platforms }: { history: GpuPriceHistory; platforms: readonly GpuPricePlatform[] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<PriceChart | null>(null);
  const cursorIndex = useRef<number | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const readoutId = useId();
  const lastIndex = Math.max(-1, ...platforms.map(platform => priceHistoryLastOffer(history, platform)?.index ?? -1));
  const day = history.series[selection?.index ?? lastIndex];
  const offers = day?.offers.filter(offer => platforms.includes(offer.platform)) ?? [];

  useEffect(() => {
    if (!canvas.current) return;
    const lines = priceHistoryLines(history, platforms);
    const font = getComputedStyle(canvas.current).fontFamily;
    const prices = lines.flatMap(line => line.prices.filter((price): price is number => price !== null));
    const low = Math.min(...prices); const high = Math.max(...prices);
    const padding = Math.max((high - low) * 0.12, high * 0.015, 1);
    const annotations: Plugin<"line"> = {
      id: "gpu-price-annotations",
      beforeDatasetsDraw(chart) {
        if (cursorIndex.current === null) return;
        const x = chart.scales.x.getPixelForValue(cursorIndex.current);
        const { ctx, chartArea } = chart;
        ctx.save(); ctx.strokeStyle = "#cbd5e1"; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.moveTo(x, chartArea.top); ctx.lineTo(x, chartArea.bottom); ctx.stroke(); ctx.restore();
      },
      afterDatasetsDraw(chart) {
        if (chart.width < 700) return;
        const labels = lines.flatMap((line, dataset) => {
          const last = priceHistoryLastOffer(history, line.platform);
          const point = last && chart.getDatasetMeta(dataset).data[last.index];
          return point ? [{ ...line, ...last!, y: point.y }] : [];
        });
        const positions = priceHistoryLabelPositions(labels.map(label => label.y), chart.chartArea.top + 24, chart.chartArea.bottom - 24);
        const { ctx } = chart;
        ctx.save(); ctx.textAlign = "left"; ctx.textBaseline = "middle";
        labels.forEach((label, index) => {
          const x = chart.chartArea.right + 14; const y = positions[index];
          ctx.fillStyle = label.color; ctx.font = `500 11px ${font}`; ctx.fillText(label.label, x, y - 14);
          ctx.fillStyle = "#0f172a"; ctx.font = `600 14px ${font}`; ctx.fillText(priceHistoryMoney(label.offer.price_cents), x, y + 2);
          ctx.fillStyle = "#64748b"; ctx.font = `400 10px ${font}`; ctx.fillText(`${label.date.slice(5).replace("-", "/")} 采样`, x, y + 18);
        });
        ctx.restore();
      },
    };
    const chart = new Chart<"line", (number | null)[], string>(canvas.current, {
      type: "line", plugins: [annotations],
      data: { labels: history.series.map(day => day.date), datasets: lines.map(line => ({
        label: line.label, data: line.prices, borderColor: line.color, backgroundColor: line.color,
        borderWidth: 2.25, borderCapStyle: "round", borderDash: line.platform === "taobao" ? [5, 4] : [],
        pointRadius: context => priceHistoryPointRadius(line.prices, context.dataIndex), pointHoverRadius: 5,
        pointHitRadius: 12, spanGaps: false, tension: 0, fill: false,
      })) },
      options: {
        responsive: true, maintainAspectRatio: false, animation: false, locale: "zh-CN", events: [], font: { family: font },
        layout: { padding: { top: 12, right: canvas.current.parentElement!.clientWidth >= 700 ? 130 : 8 } },
        onResize(chart, size) { chart.options.layout!.padding = { top: 12, right: size.width >= 700 ? 130 : 8 }; },
        scales: {
          x: { border: { display: false }, grid: { display: false },
            afterBuildTicks: scale => { scale.ticks = priceHistoryTickIndices(history.series.length, scale.chart.width < 640 ? 4 : 7).map(value => ({ value })); },
            ticks: { autoSkip: false, maxRotation: 0, padding: 10, color: "#58677d", font: { size: 11 },
              callback: value => history.series[Number(value)]?.date.slice(5).replace("-", "/") ?? "" } },
          y: { suggestedMin: Math.max(0, low - padding), suggestedMax: high + padding, border: { display: false },
            grid: { color: "#edf1f5", drawTicks: false },
            ticks: { maxTicksLimit: 4, padding: 8, color: "#58677d", font: { size: 11 }, callback: value => `¥${Number(value).toLocaleString("zh-CN", { maximumFractionDigits: 2 })}` } },
        },
      },
    });
    chartRef.current = chart;
    return () => { chartRef.current = null; chart.destroy(); };
  }, [history, platforms]);

  const select = (index: number, keyboard: boolean, y?: number) => {
    const chart = chartRef.current;
    if (!chart) return;
    const next = Math.max(0, Math.min(history.series.length - 1, index));
    cursorIndex.current = next;
    chart.setActiveElements(chart.data.datasets.flatMap((dataset, datasetIndex) => dataset.data[next] == null ? [] : [{ datasetIndex, index: next }]));
    chart.draw();
    setSelection({ index: next, x: chart.scales.x.getPixelForValue(next), y: y ?? chart.chartArea.top + 16, keyboard });
  };
  const pointer = (event: PointerEvent<HTMLCanvasElement>) => {
    const chart = chartRef.current; if (!chart) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) * chart.width / rect.width;
    const y = (event.clientY - rect.top) * chart.height / rect.height;
    if (x < chart.chartArea.left || x > chart.chartArea.right || y < chart.chartArea.top || y > chart.chartArea.bottom) { if (event.pointerType !== "touch") clear(); return; }
    select(Number(chart.scales.x.getValueForPixel(x)), false, y);
  };
  const clear = () => {
    cursorIndex.current = null; setSelection(null);
    chartRef.current?.setActiveElements([]); chartRef.current?.draw();
  };
  const keyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    const current = cursorIndex.current ?? lastIndex;
    const index = event.key === "ArrowLeft" ? current - 1 : event.key === "ArrowRight" ? current + 1 : event.key === "Home" ? 0 : event.key === "End" ? history.series.length - 1 : null;
    if (event.key === "Escape") { event.preventDefault(); clear(); }
    else if (index !== null) { event.preventDefault(); select(index, true); }
  };
  const width = chartRef.current?.width ?? 0;
  const tooltipLeft = Math.max(8, Math.min(width - 264, (selection?.x ?? 0) > width / 2 ? selection!.x - 268 : (selection?.x ?? 0) + 16));
  const tooltipTop = Math.max(8, Math.min(100, selection?.y ?? 16));

  return <div className="relative min-w-0">
    <div className="relative h-[240px] min-w-0 w-full bg-white sm:h-72">
      <canvas ref={canvas} tabIndex={0} role="img" className="touch-pan-y rounded-sm outline-offset-2"
        aria-label={`${history.model.label}近${history.period_days}天全新显卡采样最低挂牌价，缺少报价的日期不连线。`}
        aria-describedby={selection ? readoutId : undefined} aria-keyshortcuts="ArrowLeft ArrowRight Home End Escape"
        onPointerMove={pointer} onPointerDown={pointer} onPointerLeave={event => { if (event.pointerType !== "touch" && !selection?.keyboard) clear(); }} onKeyDown={keyDown} onBlur={clear}>
        {history.model.label}全新售价历史，完整数据见历史明细。
      </canvas>
    </div>
    <div id={readoutId} role="status" aria-live={selection?.keyboard ? "polite" : "off"}
      className={`pointer-events-none min-h-20 border-t border-slate-100 py-2 sm:absolute sm:z-10 sm:min-h-0 sm:w-64 sm:rounded-lg sm:border sm:border-slate-200 sm:bg-white sm:p-3 sm:shadow-lg sm:shadow-slate-900/10 ${selection ? "sm:block" : "sm:hidden"}`}
      style={{ left: tooltipLeft, top: tooltipTop }}>
      <p className="mb-1 flex items-center justify-between gap-2 text-xs font-medium text-slate-800"><span>{day?.date}</span><span className="font-normal text-slate-500 sm:hidden">采样挂牌价</span></p>
      {offers.length ? offers.map(offer => <div key={offer.platform} className="py-0.5 sm:mt-2">
        <p className="flex items-center justify-between gap-3 text-xs"><span className="flex items-center gap-1.5 text-slate-600"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: PRICE_PLATFORMS.find(platform => platform.id === offer.platform)?.color }} />{offer.platform_name}</span><span className="font-semibold tabular-nums text-slate-900">{priceHistoryMoney(offer.price_cents)}</span></p>
        <p className="mt-1 hidden truncate text-[11px] leading-4 text-slate-500 sm:block" title={offer.merchant}>{offer.merchant}</p>
        <p className="hidden text-[11px] leading-4 text-slate-500 sm:block">{observedTime(offer.observed_at)} 采集 · 挂牌价</p>
      </div>) : <p className="py-2 text-xs text-slate-500">当日无已核对报价</p>}
    </div>
  </div>;
}
