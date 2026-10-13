import {useEffect, useMemo, useRef, useState, type FormEvent} from "react";
import {Dialog as BaseDialog} from "@base-ui/react/dialog";
import {ArrowUpRight, BadgeCheck, CalendarDays, Check, CircleAlert, Clock3, Copy, ExternalLink, Fingerprint, Headphones, Info, ScanLine, Search, ShieldCheck, X} from "lucide-react";
import {GPU_SN_RULES, type ApiEnvelope, type GpuSnDateResult, type GpuSnRule} from "@cdxkyhd/shared";
import {apiFetch} from "../lib/api";
import {Button, Input} from "./ui/controls";

const confidenceLabel = {high: "较高", medium: "中等", low: "较低"} as const;

function statusLabel(result: GpuSnDateResult) {
  if (result.status === "parsed") return "规则推算";
  if (result.status === "partial") return "仅识别部分字段";
  if (result.status === "invalid") return "编码字段无效";
  return "暂无可验证规则";
}

function resultHeading(result: GpuSnDateResult) {
  if (result.dateRange && result.week !== null) return `${result.year} 年第 ${result.week} 周`;
  if (result.dateRange && result.month !== null) return `${result.year} 年 ${result.month} 月`;
  if (result.year !== null) return `${result.year} 年`;
  if (result.month !== null) return `识别到 ${result.month} 月`;
  if (result.week !== null) return `识别到第 ${result.week} 周`;
  return statusLabel(result);
}

function approximateWeekMonth(result: GpuSnDateResult) {
  if (result.week === null || !result.dateRange) return "";
  const date = new Date(`${result.dateRange.start}T00:00:00Z`);
  return `约 ${date.getUTCFullYear()} 年 ${date.getUTCMonth() + 1} 月`;
}

function copyText(result: GpuSnDateResult) {
  const date = result.dateRange
    ? `${result.year} 年${result.month ? ` ${result.month} 月` : `第 ${result.week} 周 (${approximateWeekMonth(result)})`}`
    : statusLabel(result);
  return `${result.brandName} SN 查询\nSN：${result.sn}\n结果：${date}\n日期范围：${result.dateRange ? `${result.dateRange.start} 至 ${result.dateRange.end}` : "未确认"}\n规则 ID：${result.ruleId}\n规则：${result.ruleSummary}\n可信度：${confidenceLabel[result.confidence]}\n官方单卡确认：否`;
}

const brandMarks: Record<string, string> = {
  nvidia: "N", asus: "A", gigabyte: "G", msi: "M", colorful: "C", galax: "G",
  zotac: "Z", gainward: "GW", maxsun: "MX", sapphire: "S", powercolor: "PC", xfx: "X",
  dataland: "D", inno3d: "I", manli: "M", pny: "P", evga: "E", palit: "P", leadtek: "L", asl: "A", onda: "O",
};

const brandColors: Record<string, string> = {
  nvidia: "bg-emerald-50 text-emerald-700 ring-emerald-100", asus: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  gigabyte: "bg-blue-50 text-blue-700 ring-blue-100", msi: "bg-red-50 text-red-700 ring-red-100",
  colorful: "bg-violet-50 text-violet-700 ring-violet-100", galax: "bg-sky-50 text-sky-700 ring-sky-100",
  zotac: "bg-amber-50 text-amber-700 ring-amber-100", gainward: "bg-orange-50 text-orange-700 ring-orange-100",
  maxsun: "bg-cyan-50 text-cyan-700 ring-cyan-100", sapphire: "bg-blue-50 text-blue-700 ring-blue-100",
  powercolor: "bg-rose-50 text-rose-700 ring-rose-100", xfx: "bg-slate-100 text-slate-700 ring-slate-200",
};

export default function GpuSnLookupSection() {
  const [rules, setRules] = useState<GpuSnRule[]>(GPU_SN_RULES);
  const [selectedBrand, setSelectedBrand] = useState<GpuSnRule | null>(null);
  const [sn, setSn] = useState("");
  const [result, setResult] = useState<GpuSnDateResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    void apiFetch<ApiEnvelope<GpuSnRule[]>>("/api/gpu-sn/rules")
      .then((response) => {if (!cancelled && response.data) setRules(response.data);})
      .catch(() => { /* The shared catalogue remains visible if the API is temporarily unavailable. */ });
    return () => {cancelled = true;};
  }, []);

  useEffect(() => {
    if (!selectedBrand) return;
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(focusTimer);
  }, [selectedBrand]);

  const sortedRules = useMemo(() => rules.length ? rules : GPU_SN_RULES, [rules]);

  function openLookup(rule: GpuSnRule) {
    setSelectedBrand(rule);
    setSn("");
    setResult(null);
    setError("");
    setCopied(false);
  }

  function closeLookup() {
    if (loading) return;
    setSelectedBrand(null);
    setError("");
  }

  async function lookup(event: FormEvent) {
    event?.preventDefault();
    if (!selectedBrand) return;
    setError("");
    setResult(null);
    setCopied(false);
    const serial = sn.trim();
    if (!serial) {
      setError("请输入显卡标签上的 SN 序列号。");
      inputRef.current?.focus();
      return;
    }
    setLoading(true);
    try {
      const response = await apiFetch<ApiEnvelope<GpuSnDateResult>>("/api/gpu-sn/parse", {
        method: "POST",
        body: JSON.stringify({brandId: selectedBrand.id, sn: serial}),
      });
      if (!response.data) throw new Error("查询服务暂未返回结果，请稍后再试。");
      setResult(response.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "查询失败，请核对品牌和 SN 后重试。");
    } finally {
      setLoading(false);
    }
  }

  async function copyResult() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(copyText(result));
      setCopied(true);
    } catch {
      setError("当前浏览器无法访问剪贴板，请手动复制结果。");
    }
  }

  return <section className="bg-white pb-12 pt-24 sm:pb-16 lg:pb-20" aria-labelledby="gpu-sn-title">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <header className="mx-auto mb-9 max-w-3xl space-y-3 text-center sm:mb-11">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600">
          <Fingerprint className="h-3.5 w-3.5" /> 显卡序列号查询
        </span>
        <h1 id="gpu-sn-title" className="text-2xl font-bold text-slate-950 sm:text-3xl">显卡 SN 码查询生产日期</h1>
        <p className="mx-auto max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          覆盖 21 个显卡品牌。已知编码按年份、月份或生产周规则推算；尚无可靠规则的品牌会明确标记，不返回猜测日期。
        </p>
        <div className="mx-auto flex max-w-2xl items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm leading-6 text-slate-700">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <p><span className="font-bold">说明：</span>规则来自公开资料和样例，推算结果仅供参考；品牌可能调整编码方式，最终保修与生产信息请以品牌官方查询结果为准。</p>
        </div>
      </header>

      <div className="mb-4 flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">选择显卡品牌</h2>
          <p className="mt-1 text-sm text-slate-600">选择品牌后输入序列号，可粘贴或使用扫码枪</p>
        </div>
        <span className="text-xs font-medium text-gray-500">共 {sortedRules.length} 个品牌</span>
      </div>

      <div id="gpu-sn-brand-list" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {sortedRules.map((rule) => {
          const pending = rule.rule === "unknown" || rule.rule === "pending";
          const service = rule.serviceInfo;
          return <article key={rule.id} className="flex min-w-0 flex-col rounded-lg border border-slate-200 bg-white p-4 transition-colors duration-200 hover:border-blue-300">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ring-1 ${brandColors[rule.id] || "bg-slate-100 text-slate-700 ring-slate-200"}`}>{brandMarks[rule.id] || rule.name.slice(0, 1)}</span>
                <h3 className="truncate text-sm font-semibold text-slate-950">{rule.name}</h3>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${pending ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}>{pending ? "规则待补充" : "支持推算"}</span>
            </div>
            <p className="mt-3 min-h-[60px] text-sm leading-5 text-slate-600">{rule.description}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs">
              <div><span className="flex items-center gap-1 text-slate-500"><Headphones className="h-3 w-3" />客服电话</span>{service?.hotline && /^[0-9-]+$/.test(service.hotline) ? <a href={`tel:${service.hotline.replace(/[^0-9+]/g, "")}`} className="mt-1 block font-semibold text-blue-700 hover:underline">{service.hotline}</a> : <span className="mt-1 block font-semibold text-slate-800">{service?.hotline || "官网服务"}</span>}</div>
              <div><span className="flex items-center gap-1 text-slate-500"><ShieldCheck className="h-3 w-3" />个人送保</span><span className="mt-1 block font-semibold text-slate-800">{service?.personalSend || "以官网为准"}</span></div>
            </div>
            <div className="mt-auto flex items-center gap-2 pt-3">
              <Button onClick={() => openLookup(rule)} variant="primary" className="min-w-0 flex-1">
                <Search className="h-3.5 w-3.5" />立即查询 SN 码
              </Button>
                <a href={rule.officialUrl} target="_blank" rel="noreferrer" aria-label={`${rule.name}官网`} title="品牌官网" className="inline-flex h-10 shrink-0 items-center justify-center gap-1 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">官网<ArrowUpRight className="h-3.5 w-3.5" /></a>
            </div>
          </article>;
        })}
      </div>

      <div className="mx-auto mt-5 flex max-w-7xl items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>客服和个人送保状态来自公开服务信息，可能随时间、地区和产品系列变化；使用前请以品牌官网为准。编码推算不等于品牌对单卡生产日期或保修状态的确认。</p>
      </div>

      <section className="mx-auto mt-10 max-w-6xl" aria-labelledby="gpu-sn-faq-title">
        <div className="mb-4 flex items-center gap-2"><CircleAlert className="h-5 w-5 text-blue-700" /><h2 id="gpu-sn-faq-title" className="text-lg font-bold text-slate-900">查询说明</h2></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <details className="rounded-lg border border-slate-200 bg-white p-4"><summary className="cursor-pointer text-sm font-semibold text-slate-900">SN 序列号在哪里找？</summary><p className="mt-3 text-sm leading-6 text-slate-600">通常在显卡背面或侧边的条码标签上，也可查看原装包装盒侧面条码。不同型号贴纸位置可能不同，请勿撕毁或遮挡标签。</p></details>
          <details className="rounded-lg border border-slate-200 bg-white p-4"><summary className="cursor-pointer text-sm font-semibold text-slate-900">为什么查不到日期？</summary><p className="mt-3 text-sm leading-6 text-slate-600">请核对品牌、SN，以及 0/O、1/I 等字符。新批次或特殊产品线可能更换编码；规则证据不足时会标为待验证，并提供官方入口。</p></details>
          <details className="rounded-lg border border-slate-200 bg-white p-4"><summary className="cursor-pointer text-sm font-semibold text-slate-900">周数代表哪一天？</summary><p className="mt-3 text-sm leading-6 text-slate-600">周码会显示该 ISO 周对应的周一至周日日期范围，并给出约月份。厂商周码定义可能不同，所以范围属于规则推算。</p></details>
          <details className="rounded-lg border border-slate-200 bg-white p-4"><summary className="cursor-pointer text-sm font-semibold text-slate-900">这个日期可以用来确认保修吗？</summary><p className="mt-3 text-sm leading-6 text-slate-600">不能。保修还受型号、地区、购买渠道和凭证影响。请通过品牌官方入口核实，不要将推算日期当作官方保修起算日。</p></details>
          <details className="rounded-lg border border-slate-200 bg-white p-4"><summary className="cursor-pointer text-sm font-semibold text-slate-900">可信度表示什么？</summary><p className="mt-3 text-sm leading-6 text-slate-600">可信度反映规则来源和验证范围，不是统计准确率。来自用户规则表、参考样例或社区资料的推算会明确标为较低可信度；官方单卡确认仍以品牌查询为准。</p></details>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4"><h3 className="text-sm font-semibold text-blue-900">扫码枪可直接输入</h3><p className="mt-3 text-sm leading-6 text-blue-900/80">打开品牌查询窗口后扫描标签，扫码枪回车会直接提交。也可以粘贴 SN，结果卡片支持一键复制。</p></div>
        </div>
      </section>

      {selectedBrand && <BaseDialog.Root open onOpenChange={open => {if (!open) closeLookup();}}>
        <BaseDialog.Portal>
          <BaseDialog.Backdrop className="fixed inset-0 z-[70] bg-slate-950/30" />
          <BaseDialog.Viewport className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4">
        <BaseDialog.Popup className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-lg border border-[var(--erp-color-border)] bg-white p-5 shadow-[var(--erp-shadow-popover)] sm:rounded-lg sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-black ring-1 ${brandColors[selectedBrand.id] || "bg-slate-100 text-slate-700 ring-slate-200"}`}>{brandMarks[selectedBrand.id] || selectedBrand.name.slice(0, 1)}</span>
              <div><p className="text-xs font-semibold text-blue-600">显卡 SN 生产日期查询</p><BaseDialog.Title className="mt-0.5 text-lg font-semibold text-slate-950">{selectedBrand.name} SN 码查询</BaseDialog.Title></div>
            </div>
            <BaseDialog.Close render={<Button size="icon" variant="ghost" aria-label="关闭查询窗口" disabled={loading}><X className="h-5 w-5" /></Button>} />
          </div>

          <form onSubmit={(event) => void lookup(event)} className="mt-6">
            <label htmlFor="gpu-sn-serial" className="mb-2 block text-sm font-bold text-slate-800">请输入显卡序列号（SN）</label>
            <div className="relative">
              <ScanLine className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input ref={inputRef} id="gpu-sn-serial" value={sn} onChange={(event) => {setSn(event.target.value); setResult(null); setError("");}} autoCapitalize="characters" autoCorrect="off" spellCheck={false} maxLength={40} placeholder={`例如：${selectedBrand.example}`} className="sn-input font-mono uppercase" />
            </div>
            <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-5 text-slate-500"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />示例中的 X 表示被隐藏的字符，不能直接作为真实 SN 查询。支持粘贴；扫码枪输入完成后按回车即可。</p>
            {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm leading-5 text-rose-800">{error}</p>}
            <Button type="submit" disabled={loading} loading={loading} variant="primary" size="lg" className="mt-5 w-full"><Search className="h-4 w-4" />{loading ? "正在查询…" : "立即查询出厂日期"}</Button>
          </form>

          {result && <article aria-live="polite" className={`mt-5 rounded-2xl border p-4 sm:p-5 ${result.status === "parsed" ? "border-emerald-200 bg-emerald-50/60" : "border-amber-200 bg-amber-50/70"}`}>
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-xs font-semibold text-slate-600">{result.brandName} · {result.sn}</p><h3 className="mt-1.5 text-2xl font-black tracking-tight text-slate-950">{resultHeading(result)}</h3>
                {result.dateRange && <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-700"><CalendarDays className="h-3.5 w-3.5 text-blue-700" />生产日期范围：{result.dateRange.start} 至 {result.dateRange.end}</p>}
                {result.week !== null && result.dateRange && <p className="mt-1 text-xs text-slate-600">{approximateWeekMonth(result)}</p>}
              </div>
              <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${result.status === "parsed" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{result.status === "parsed" && <BadgeCheck className="h-3 w-3" />}{statusLabel(result)}</span>
            </div>
            {result.elapsedDays !== null && <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-600"><Clock3 className="h-3.5 w-3.5" />距今约 {result.elapsedDays} 天</p>}
            <p className="mt-3 text-xs leading-5 text-slate-700">{result.explanation}</p>
            <div className="mt-3 rounded-xl border border-white/80 bg-white/80 p-3">
              <p className="text-[11px] font-bold text-slate-800">规则依据</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">{result.ruleSummary}</p>
              <p className="mt-1.5 text-[10px] text-slate-500">规则 ID：<code className="font-mono">{result.ruleId}</code> · 可信度：{confidenceLabel[result.confidence]} · 官方单卡确认：否</p>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5">{result.sources.map((source) => source.url
                ? <a key={`${source.url}-${source.title}`} href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 hover:underline">{source.title}<ExternalLink className="h-2.5 w-2.5" /></a>
                : <span key={source.title} className="inline-flex items-center text-[10px] font-medium text-slate-600">{source.title}</span>)}</div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={result.officialUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 text-xs font-bold text-blue-700 transition hover:bg-blue-50"><ShieldCheck className="h-4 w-4" />品牌官方入口<ExternalLink className="h-3 w-3" /></a>
              <Button onClick={() => void copyResult()}>{copied ? <Check className="h-4 w-4 text-emerald-700" /> : <Copy className="h-4 w-4" />}{copied ? "已复制" : "复制结果"}</Button>
            </div>
          </article>}

          <p className="mt-4 text-center text-[10px] leading-5 text-slate-500">查询结果为编码规则推算，不是官方保修、真伪或维修资格确认。</p>
        </BaseDialog.Popup>
          </BaseDialog.Viewport>
        </BaseDialog.Portal>
      </BaseDialog.Root>}
      </div>
  </section>;
}
