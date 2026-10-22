import { useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Calculator, RotateCcw } from "lucide-react";
import { Button, Input, Select, type SelectOption } from "../ui/controls";
import { PaybackPanel } from "./PaybackPanel";
import { formatPaybackDuration } from "../../lib/paybackSummary";
import { CalculatorNav } from "./CalculatorNav";
import { calculate, convertUnit, convertBasis } from "../../lib/rentalCalculator.js";

const defaults = {
  unit: "TH/s", hashrate: "100", hours: "24", rentRate: "", rentBasis: "day",
  revenueRate: "", revenueBasis: "day", accepted: "100", serviceFee: "0",
  feeBase: "rent", otherCost: "0", powerIncluded: true, powerMode: "total",
  powerWatts: "", electricityRate: "", mode: "rent", initialInvestment: "", projectionDays: "365",
};
type Inputs = typeof defaults;
type Key = keyof Inputs;
const billing: SelectOption[] = [{ value: "day", label: "每单位算力 / 天" }, { value: "hour", label: "每单位算力 / 小时" }, { value: "total", label: "本次订单总额" }];
const fmt = (value: number, digits = 6) => value.toLocaleString("zh-CN", { maximumFractionDigits: digits });
const money = (value: number | null | undefined): string => value == null ? "—" : value > 0 && value < 0.000001 ? "<¥0.000001" : "¥" + value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
const signed = (value: number) => (value > 0 ? "+" : value < 0 ? "−" : "") + money(Math.abs(value));
const rateUnit = (basis: string, unit: string) => basis === "total" ? "¥ / 本次" : `¥ / ${unit} / ${basis === "day" ? "天" : "小时"}`;

const paybackLabel = (result: { paybackStatus?: string; paybackDays?: number | null } | null | undefined) => {
  if (!result?.paybackStatus) return "—";
  if (result.paybackStatus === "missingInvestment") return "填写初始投入";
  if (result.paybackStatus === "missingIncome") return "填写预估收入";
  if (result.paybackStatus === "zeroInvestment") return "无初始投入";
  if (result.paybackStatus === "notProfitable") return "无法回本";
  if (result.paybackDays == null) return "—";
  return `约 ${formatPaybackDuration(result.paybackDays)} / ${formatPaybackDuration(result.paybackDays / 30, "个月")}`;
};

function Group({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5"><div className="mb-4 flex items-baseline justify-between gap-3"><h2 className="font-semibold text-slate-950">{title}</h2><span className="text-xs text-slate-500">{hint}</span></div>{children}</section>;
}
function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return <div className="min-w-0"><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 break-words text-xl font-semibold tabular-nums tracking-tight text-slate-950">{value}</dd><p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p></div>;
}

export default function HashrateRentalCalculatorPage() {
  const [input, setInput] = useState<Inputs>({ ...defaults });
  const [touched, setTouched] = useState<Set<Key>>(new Set());
  const [badInputs, setBadInputs] = useState<Set<Key>>(new Set());
  const [conversionError, setConversionError] = useState("");
  const resultRef = useRef<HTMLElement>(null);
  const result = calculate(input);
  const activeBadInputs = [...badInputs].filter(key => !(input.mode === "owned" && key === "rentRate") && !(input.powerIncluded && ["powerWatts", "electricityRate"].includes(key)) && !(key === "accepted" && input.revenueRate === ""));
  const errors = [...result.errors, ...activeBadInputs.map(field => ({ field, kind: "invalid", message: "请输入有效数字" }))];
  const data = result.valid && "totalCost" in result && activeBadInputs.length === 0 ? result : null;
  const touch = (key: Key) => setTouched(current => new Set(current).add(key));
  function update(key: Key, value: string | boolean, bad = false) {
    setInput(current => ({ ...current, [key]: value })); touch(key); setConversionError("");
    setBadInputs(current => { const next = new Set(current); if (bad) next.add(key); else next.delete(key); return next; });
  }
  function changeSelect(key: Key, value: string) {
    try {
      let next = { ...input, [key]: value };
      if (key === "mode" && value === "owned") { next.feeBase = "income"; next.powerIncluded = false; }
      else if (key === "unit") next = convertUnit(input, value) as Inputs;
      else if (key === "rentBasis" || key === "revenueBasis") next = convertBasis(input, key, value) as Inputs;
      else if (key === "powerMode" && input.powerWatts.trim() !== "") {
        const scale = Number(input.hashrate); const watts = Number(input.powerWatts);
        const converted = watts * (value === "total" ? scale : 1 / scale);
        if (!(scale > 0) || !(watts >= 0) || !Number.isFinite(converted)) throw new Error("请先填写有效的算力和功耗，再切换功耗方式");
        next.powerWatts = String(Number(converted.toPrecision(14)));
      }
      setInput(next); touch(key); setConversionError("");
    } catch (error) { setConversionError(error instanceof Error ? error.message : "请先修正输入再换算"); }
  }
  function numberField(key: Key, title: string, unit: string, help = "", optional = false, disabled = false) {
    const error = errors.find(entry => entry.field === key && (entry.kind === "invalid" || touched.has(key)));
    const id = `rental-${key}`;
    return <div className="min-w-0"><label htmlFor={id} className="mb-1.5 flex items-center justify-between gap-2 text-sm font-medium text-slate-700"><span>{title}{optional && <span className="ml-1 text-xs font-normal text-slate-400">选填</span>}</span><span className="text-xs font-normal text-slate-500">{unit}</span></label><Input id={id} type="number" step="any" min="0" max={["accepted", "serviceFee"].includes(key) ? 100 : undefined} inputMode="decimal" value={String(input[key])} disabled={disabled} placeholder={optional ? "可留空" : "请填写"} aria-invalid={Boolean(error)} aria-describedby={`${id}-help`} onChange={event => update(key, event.target.value, event.target.validity.badInput)} onBlur={() => touch(key)} /><p id={`${id}-help`} className={`mt-1 text-xs leading-5 ${error ? "text-red-600" : "text-slate-500"}`}>{error?.message || help}</p></div>;
  }
  function selectField(key: Key, title: string, options: SelectOption[], help = "", disabled = false) {
    return <div className="min-w-0"><label htmlFor={`rental-${key}`} className="mb-1.5 block text-sm font-medium text-slate-700">{title}</label><Select id={`rental-${key}`} aria-label={title} value={String(input[key])} options={options} disabled={disabled} onValueChange={value => changeSelect(key, value)} />{help && <p className="mt-1 text-xs leading-5 text-slate-500">{help}</p>}</div>;
  }
  const hasIncome = data?.gross != null;
  const heroValue = !data ? (errors.some(error => error.kind === "invalid") ? "请修正输入" : errors[0]?.message || "请填写参数") : data.net != null ? signed(data.net) : data.totalCost != null ? money(data.totalCost) : "填写收入参数";
  const impossible = data?.breakEvenStatus === "impossible";
  const notice = conversionError || (!data ? errors.map(error => error.message).join("；") : impossible ? "附加成本已超过收入，即使租金为 0 也无法保本。" : data.totalCost == null ? "服务费按收入收取，请填写预估收入后计算全部成本。" : !hasIncome ? "已算出本次租赁成本。收入选填，填写后可查看净收益。" : data.net > 0 ? "按当前输入，预估收入覆盖全部成本。" : data.net < 0 ? "按当前输入，预计亏损。可对照下方保本租价调整报价。" : "按当前输入，预估收入与全部成本持平。");
  const returnRate = data?.roi == null ? (data?.totalCost === 0 && data?.net != null ? "不适用" : "—") : data.roi !== 0 && Math.abs(data.roi) < 0.0001 ? `${data.roi < 0 ? "−" : ""}<0.0001%` : `${fmt(data.roi, 4)}%`;
  const scrollToResult = () => resultRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });

  return <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-28 pt-24 sm:px-6 sm:pt-28 lg:px-8 lg:pb-12">
    <a href="/tools" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-700"><ArrowLeft className="h-4 w-4" />硬件工具</a>
    <header className="mt-4 border-b border-slate-200 pb-6"><div className="flex items-center gap-3"><Calculator className="h-7 w-7 text-blue-600" aria-hidden="true" /><h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">算力租赁计算器</h1></div><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">核算租入算力或自有设备出租的收入与成本，填写初始投入后查看静态回本周期和计划期回报。统一按人民币计价。</p></header>
    <CalculatorNav active="/tools/hashrate-rental" />
    <div className="mt-6 grid items-start gap-6 lg:grid-cols-2 lg:gap-8">
      <form className="space-y-4" noValidate onSubmit={event => event.preventDefault()}>
        <Group title="初始投入与运营计划" hint="回本测算选填">
          <div className="grid gap-4 sm:grid-cols-2">
            {numberField("initialInvestment", "初始投入总额", "¥", "设备购置、部署等一次性投入；不含日常经营成本。填 0 表示无初始投入。", true)}
            {numberField("projectionDays", "计划运营天数", "天", "空白按 365 天计算，按相同收入和成本连续运营外推。", true)}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">{[30, 90, 180, 365].map(days => <Button key={days} size="sm" onClick={() => update("projectionDays", String(days))}>{days} 天</Button>)}</div>
          <p className="mt-3 text-xs leading-6 text-slate-500">回本周期 = 初始投入 ÷ 每日经营净收益。初始投入仅在累计现金结余中扣除一次，不重复计入本期经营成本。预测不计设备残值及后续价格变化。</p>
        </Group>
        <Group title="测算参数" hint="按时长比例计费"><div className="grid gap-4 sm:grid-cols-2">
          {selectField("mode", "测算方式", [{ value: "rent", label: "租入算力" }, { value: "owned", label: "自有设备出租" }], "买卡后出租请选择自有设备，不再计入租入成本。")}
          {numberField("hashrate", "算力规模", input.unit)}
          {selectField("unit", "算力单位", ["GH/s", "TH/s", "PH/s"].map(value => ({ value, label: value })), "切换单位会同步换算规模和单价，保持总额不变。")}
          {numberField("hours", input.mode === "owned" ? "收益测算时长" : "租赁时长", "小时")}
          {input.mode === "rent" && selectField("rentBasis", "租价计费方式", billing, "切换计费方式会换算报价，保持总额不变。")}
          {input.mode === "rent" && numberField("rentRate", "租赁报价", rateUnit(input.rentBasis, input.unit), "填写未包含下方附加费用的租金。")}
        </div><div className="mt-3 flex flex-wrap gap-2">{[6, 12, 24, 72].map(hours => <Button key={hours} size="sm" onClick={() => update("hours", String(hours))}>{hours < 24 ? `${hours} 小时` : `${hours / 24} 天`}</Button>)}</div></Group>
        <Group title="附加成本" hint="仅填额外收取的费用"><div className="grid gap-4 sm:grid-cols-2">
          {numberField("serviceFee", "服务费率", "%")}
          {selectField("feeBase", "服务费计算基数", [{ value: "rent", label: "按租金收取" }, { value: "income", label: "按实际收入收取" }], input.mode === "owned" ? "自有设备出租的服务费按实际收入收取。" : "", input.mode === "owned")}
          {numberField("otherCost", "其他费用", "¥ / 本次", "本测算周期内反复发生的费用；一次性费用填在初始投入中。", true)}
        </div><label className="mt-4 flex items-start gap-2 text-sm text-slate-700"><input id="rental-powerIncluded" type="checkbox" className="mt-1 accent-blue-600" checked={input.powerIncluded} onChange={event => update("powerIncluded", event.target.checked)} /><span>{input.mode === "owned" ? "电费无需另付（已包含在其他费用内）" : "租价已包含电费"}<small className="mt-1 block text-xs leading-5 text-slate-500">需另付时按全测算周期计入，功耗可包含主机与配套设备。</small></span></label>{!input.powerIncluded && <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {selectField("powerMode", "功耗填写方式", [{ value: "total", label: "设备总功耗" }, { value: "perUnit", label: "每单位算力功耗" }])}
          {numberField("powerWatts", "功耗", input.powerMode === "total" ? "W" : `W / ${input.unit}`)}
          {numberField("electricityRate", "电价", "¥ / kWh")}
        </div>}</Group>
        <Group title="预估收入" hint="选填，可单独算成本"><div className="grid gap-4 sm:grid-cols-2">
          {selectField("revenueBasis", "收入填写方式", billing)}
          {numberField("revenueRate", "预估收入报价", rateUnit(input.revenueBasis, input.unit), "留空时仅计算租赁成本；填 0 表示预计无收入。", true)}
          {numberField("accepted", "有效交付率", "%", "仅折算收入，不自动扣减租金和电费。", false, input.revenueRate === "")}
        </div><p className="mt-4 rounded-lg bg-blue-50 p-3 text-xs leading-6 text-blue-900">填写未扣租金、服务费和电费的收入，再乘有效交付率。收入若已按实际交付折算，请将交付率设为 100%。设备闲置时的耗电仍需计入，避免高估净收益。</p></Group>

        <div className="flex items-center justify-between gap-3 text-xs text-slate-500"><span>输入变动后自动计算</span><Button onClick={() => { setInput({ ...defaults }); setTouched(new Set()); setBadInputs(new Set()); setConversionError(""); }}><RotateCcw className="h-4 w-4" />恢复默认设置</Button></div>
      </form>
      <section ref={resultRef} id="rental-results" aria-label="计算结果" className="min-w-0 scroll-mt-4" aria-live="polite">
        <div className="rounded-2xl bg-slate-900 p-5 text-white sm:p-6"><p className="text-xs text-slate-300">{hasIncome ? "本期经营净收益 · 不含初始投入" : "本期经营成本"}</p><div id="rental-net" className={`mt-3 break-words text-3xl font-bold tabular-nums tracking-tight sm:text-4xl ${data?.net > 0 ? "text-emerald-300" : data?.net < 0 ? "text-red-300" : "text-white"}`}>{heroValue}</div><p className="mt-3 text-xs leading-5 text-slate-300">{hasIncome ? data.totalCost === 0 ? "全部成本为 0，成本回报率不适用" : `${money(data.gross)} − ${money(data.totalCost)}` : "收入选填；必填参数有效后自动计算"}</p></div>
        <p id="rental-message" className={`mt-3 rounded-lg p-3 text-xs leading-6 ${conversionError || impossible || errors.some(error => error.kind === "invalid") || data?.net < 0 ? "bg-red-50 text-red-800" : data?.net > 0 ? "bg-emerald-50 text-emerald-800" : "bg-blue-50 text-blue-900"}`}>{notice}</p>
        <PaybackPanel prefix="rental" investment={data?.initialInvestment ?? null} dailyNet={data?.dailyNet ?? null} planDays={data?.projectionDays ?? Number(input.projectionDays || 365)} ready={Boolean(data)} />
        <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-5 border-b border-slate-200 pb-5">
          <Metric label="预计总收入" value={money(data?.gross)} hint={hasIncome ? `${money(data.rawRevenue)} × ${input.accepted}%` : "可选填收入参数"} />
          <Metric label="全部成本合计" value={money(data?.totalCost)} hint="租金 + 服务费 + 电费 + 其他费用" />
          <Metric label="租金" value={money(data?.baseRent)} hint={input.mode === "owned" ? "自有设备，无租入成本" : `${input.hashrate} ${input.unit} · ${input.hours} 小时`} />
          <Metric label="服务费" value={money(data?.serviceCost)} hint={`${input.feeBase === "rent" ? "租金" : "折算后收入"} × ${input.serviceFee}%`} />
          <Metric label="额外电费" value={money(data?.powerCost)} hint={input.powerIncluded ? "已包含在租金内，额外电费为 0" : data ? `${fmt(data.energy)} kWh × ¥${input.electricityRate}` : "等待功耗和电价"} />
          <Metric label="其他费用" value={money(data?.otherCost)} hint="本次订单固定费用" />
          <Metric label="成本回报率" value={returnRate} hint="净收益 ÷ 全部成本；非年化" />
          <Metric label={input.mode === "owned" ? "每日经营成本" : "保本租价上限"} value={input.mode === "owned" ? money(data?.dailyCost) : impossible ? "无法保本" : money(data?.maxRentRate)} hint={input.mode === "owned" ? "按 24 小时折算，不含初始投入" : `${rateUnit(input.rentBasis, input.unit)}，已考虑附加成本`} />
        </dl>
        <div className="border-b border-slate-200 py-5"><h2 className="mb-3 text-sm font-semibold text-slate-950">收入与成本</h2>{[{ label: "收入", amount: data?.gross, color: "bg-blue-600" }, { label: "成本", amount: data?.totalCost, color: "bg-amber-500" }].map(item => <div key={item.label} className="mt-3 flex items-center gap-3 text-xs text-slate-600"><span>{item.label}</span><div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200"><div className={`h-full rounded-full ${item.color}`} style={{ width: item.amount != null && Math.max(data?.gross || 0, data?.totalCost || 0) > 0 ? `${item.amount / Math.max(data?.gross || 0, data?.totalCost || 0) * 100}%` : "0%" }} /></div><span className="max-w-[45%] break-words text-right tabular-nums">{money(item.amount)}</span></div>)}</div>
        <div className="py-5"><h2 className="text-sm font-semibold text-slate-950">收入与回本情景</h2><p className="mt-2 text-xs leading-5 text-slate-500">{data?.net == null ? "填写有效的收入与成本参数后显示。" : input.feeBase === "income" ? "租金、电费固定；收入手续费随收入变化。" : "算力、租期、租金和附加成本固定。"}</p><table className="mt-3 w-full text-left text-xs tabular-nums"><thead className="border-b border-slate-200 text-slate-500"><tr><th className="py-2 font-medium">收入变化</th><th className="py-2 font-medium">本期净收益</th><th className="py-2 text-right font-medium">静态回本</th></tr></thead><tbody>{data?.net != null && [0.7, 1, 1.3].map(factor => { const scenario = calculate({ ...input, revenueRate: Number(input.revenueRate) * factor }); return <tr key={factor} className={`border-b border-slate-100 ${factor === 1 ? "font-semibold text-blue-700" : "text-slate-600"}`}><td className="py-3">{factor === 1 ? "当前输入" : factor < 1 ? "收入 −30%" : "收入 +30%"}</td><td className="py-3">{"net" in scenario ? signed(scenario.net) : "超出范围"}</td><td className="py-3 text-right">{"paybackStatus" in scenario ? paybackLabel(scenario) : "超出范围"}</td></tr>; })}</tbody></table></div>
        <details className="rounded-lg border border-slate-200 bg-white p-4 text-xs leading-6 text-slate-600"><summary className="cursor-pointer font-semibold text-slate-800">查看计算过程</summary><div className="mt-3">{data ? <><p>租金：{input.mode === "owned" ? "自有设备，租入成本为 0" : input.rentBasis === "total" ? "订单总价" : `${input.hashrate} ${input.unit} × ${fmt(data.hours / (input.rentBasis === "day" ? 24 : 1))} ${input.rentBasis === "day" ? "天" : "小时"} × ¥${input.rentRate}`} = {money(data.baseRent)}</p><p>收入：{hasIncome ? `${money(data.rawRevenue)} × ${input.accepted}% = ${money(data.gross)}` : "未填写"}</p><p>服务费：{input.serviceFee}% × {input.feeBase === "rent" ? "租金" : "折算后收入"} = {money(data.serviceCost)}</p><p>额外电费：{input.powerIncluded ? "已包含在租金内" : `${fmt(data.energy)} kWh × ¥${input.electricityRate} = ${money(data.powerCost)}`}</p><p>全部成本：{money(data.baseRent)} + {money(data.serviceCost)} + {money(data.powerCost)} + {money(data.otherCost)} = {money(data.totalCost)}</p><p>本期经营净收益：{data.net == null ? "等待完整的收入与费用参数" : `${money(data.gross)} − ${money(data.totalCost)} = ${signed(data.net)}`}</p><p>静态回本：{data.paybackStatus === "available" ? `${money(data.initialInvestment)} ÷ ${money(data.dailyNet)} / 天 = ${paybackLabel(data)}` : paybackLabel(data)}</p><p>计划期投入后结余：{data.projectedCashBalance == null ? "等待初始投入和预估收入" : `${money(data.projectedOperatingNet)} − ${money(data.initialInvestment)} = ${signed(data.projectedCashBalance)}`}</p></> : "填写有效参数后显示。"}</div></details>
        <p className="mt-4 text-xs leading-6 text-slate-500">按 24 小时为一天，日单价与小时单价按实际租期比例折算。整日计费、最低消费或阶梯价，请先换算为本次订单总价。算力单位换算仅适用于同一计算任务与计量标准。</p>
      </section>
    </div>
    <div className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 lg:hidden"><Button variant="primary" className="w-full justify-between! shadow-lg" onClick={scrollToResult}><span>查看收益与回本 ↓</span><span className="min-w-0 break-words tabular-nums">{data?.paybackStatus === "available" ? paybackLabel(data) : heroValue}</span></Button></div>
  </main>;
}
