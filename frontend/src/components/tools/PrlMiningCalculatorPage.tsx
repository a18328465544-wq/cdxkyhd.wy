import { useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Gem, RotateCcw } from "lucide-react";
import { Button, Input, Select } from "../ui/controls";
import { usePrlMarket } from "../../lib/usePrlMarket";
import { PaybackPanel } from "./PaybackPanel";
import { formatPaybackDuration } from "../../lib/paybackSummary";
import { CalculatorNav } from "./CalculatorNav";
import { calculatePrl, prlDefaults, type PrlKey } from "../../lib/prlCalculator";

const fmt = (n: number, digits = 6) => n.toLocaleString("zh-CN", { maximumFractionDigits: digits });
const amount = (n: number | null | undefined, prefix = "¥") => n == null ? "—" : n !== 0 && Math.abs(n) < 0.000001 ? `${n < 0 ? "−" : ""}${prefix}<0.000001` : `${n < 0 ? "−" : ""}${prefix}${fmt(Math.abs(n))}`;
type Data = NonNullable<ReturnType<typeof calculatePrl>["data"]>;
const payback = (data: Data | null) => !data ? "等待有效参数" : data.paybackStatus === "missingInvestment" ? "填写初始投入" : data.paybackStatus === "zeroInvestment" ? "无初始投入" : data.paybackStatus === "missingPrice" ? "填写 PRL 单价" : data.paybackStatus === "notProfitable" ? "无法回本" : `约 ${formatPaybackDuration(data.paybackDays)} / ${formatPaybackDuration(data.paybackDays / 30, "个月")}`;

function Group({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5"><h2 className="mb-4 font-semibold text-slate-950">{title}</h2>{children}</section>;
}
function Metric({ title, value, hint }: { title: string; value: string; hint: string }) {
  return <div className="min-w-0"><dt className="text-xs text-slate-500">{title}</dt><dd className="mt-1 break-words text-xl font-semibold tabular-nums text-slate-950">{value}</dd><p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p></div>;
}

export default function PrlMiningCalculatorPage() {
  const [input, setInput] = useState({ ...prlDefaults });
  const [touched, setTouched] = useState<Set<PrlKey>>(new Set());
  const [bad, setBad] = useState<Set<PrlKey>>(new Set());
  const results = useRef<HTMLElement>(null);
  const [autoPrice, setAutoPrice] = useState(true);
  const { quote, fresh, loading, error: marketError, refresh } = usePrlMarket();
  const effectiveInput = { ...input, price: autoPrice ? fresh && quote ? String(quote.cny) : "" : input.price };
  const actual = input.mode === "actual";
  const calculation = calculatePrl(effectiveInput);
  const toggleAutoPrice = (enabled: boolean) => {
    if (!enabled && autoPrice && fresh && quote) setInput(current => ({ ...current, price: String(quote.cny) }));
    setAutoPrice(enabled);
    setBad(current => { const next = new Set(current); next.delete("price"); return next; });
  };
  const inactive = actual ? ["hashrate", "yieldRate", "accepted", "minerFee", "poolFee"] : ["actualCoins"];
  const badActive = [...bad].filter(key => !inactive.includes(key) && !(key === "price" && autoPrice));
  const errors = [...calculation.errors, ...badActive.map(field => ({ field, message: "请输入有效数字" }))];
  const data = calculation.valid && badActive.length === 0 ? calculation.data : null;
  const update = (key: PrlKey, value: string, badInput = false) => {
    setInput(current => ({ ...current, [key]: value }));
    setTouched(current => new Set(current).add(key));
    setBad(current => { const next = new Set(current); if (badInput) next.add(key); else next.delete(key); return next; });
  };
  function field(key: PrlKey, title: string, unit: string, help = "", optional = false, max?: number) {
    const id = `prl-${key}`;
    const error = errors.find(entry => entry.field === key && touched.has(key));
    return <div className="min-w-0"><label htmlFor={id} className="mb-1.5 flex flex-wrap items-center justify-between gap-1 text-sm font-medium text-slate-700"><span>{title}{optional && <span className="ml-1 text-xs font-normal text-slate-400">选填</span>}</span><span className="text-xs font-normal text-slate-500">{unit}</span></label>
      <Input id={id} type="number" inputMode="decimal" step={key === "cards" ? "1" : "any"} min="0" max={max} value={effectiveInput[key]} readOnly={key === "price" && autoPrice} placeholder={key === "price" && autoPrice ? "等待有效行情" : optional ? "可留空" : "请填写"} aria-invalid={Boolean(error)} aria-describedby={`${id}-help`} onChange={event => update(key, event.target.value, event.target.validity.badInput)} onBlur={() => setTouched(current => new Set(current).add(key))} />
      <p id={`${id}-help`} className={`mt-1 text-xs leading-5 ${error ? "text-red-600" : "text-slate-500"}`}>{error?.message || help}</p></div>;
  }
  const scrollToResult = () => results.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  const reset = () => { setInput({ ...prlDefaults }); setAutoPrice(true); setTouched(new Set()); setBad(new Set()); };
  return <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-28 pt-24 sm:px-6 sm:pt-28 lg:px-8 lg:pb-12">
    <a href="/tools" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-700"><ArrowLeft className="h-4 w-4" />硬件工具</a>
    <header className="mt-4 border-b border-slate-200 pb-6"><div className="flex items-center gap-3"><Gem className="h-7 w-7 shrink-0 text-blue-600" aria-hidden="true" /><h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">PRL 珍珠币挖矿计算器</h1></div><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">按显卡算力或实际到账产量，测算 PRL 产出、电费、经营净收益与设备回本周期。</p></header>
    <CalculatorNav active="/tools/prl-mining" />
    <section aria-label="PRL 市场参考价" id="prl-market" className="mt-5 rounded-xl border border-blue-100 bg-blue-50/60 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0"><h2 className="text-sm font-semibold text-slate-800">Pearl 市场参考价 <span className="font-normal text-slate-500">PRL / PEARL</span></h2>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1"><span id="prl-market-cny" className="break-words text-2xl font-bold tabular-nums text-blue-900">{quote ? amount(quote.cny) : loading ? "正在获取…" : "暂不可用"}</span>{quote && <span className="text-sm tabular-nums text-slate-600">{amount(quote.usd, "$")} / PRL</span>}{quote?.change24hPercent != null && <span className={`text-xs tabular-nums ${quote.change24hPercent >= 0 ? "text-emerald-700" : "text-red-700"}`}>24h {quote.change24hPercent > 0 ? "+" : ""}{fmt(quote.change24hPercent, 2)}%</span>}</div>
        </div>
        <Button size="sm" disabled={loading} onClick={refresh}>{loading ? "获取中…" : "刷新价格"}</Button>
      </div>
      <p id="prl-market-status" role="status" className={`mt-2 text-xs leading-6 ${fresh ? "text-slate-600" : "text-amber-800"}`}>{fresh ? "已获取最新可用参考价" : quote ? "历史报价，当前不可自动用于测算" : loading ? "正在连接行情接口" : "行情暂不可用"}{quote && ` · 报价时间 ${new Date(quote.updatedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false })}（北京时间）`}</p>
      {marketError && <p className="mt-1 text-xs leading-6 text-amber-800">{marketError}</p>}
      {!fresh && quote && !marketError && <p className="mt-1 text-xs leading-6 text-amber-800">报价已超过 15 分钟，请刷新或切换为手动价格。</p>}
      <label className="mt-3 flex items-start gap-2 text-sm text-slate-700"><input id="prl-autoPrice" type="checkbox" className="mt-1 accent-blue-600" checked={autoPrice} onChange={event => toggleAutoPrice(event.target.checked)} /><span>跟随行情自动更新测算单价<small className="mt-1 block text-xs leading-5 text-slate-500">{autoPrice ? "净收益和回本随有效报价更新；取消勾选可在下方手动设价。" : "当前使用手动价格，行情刷新不会覆盖；重新勾选可恢复自动跟价。"}</small></span></label>
      <p className="mt-2 text-xs leading-6 text-slate-500">来源：<a href="https://www.coingecko.com/en/coins/pearl-research" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">CoinGecko</a> · 每分钟刷新 · 人民币为接口折算参考价，可能与实际成交价有差异。</p>
    </section>
    <div className="mt-6 grid items-start gap-6 lg:grid-cols-2 lg:gap-8">
      <form className="space-y-4" noValidate onSubmit={event => event.preventDefault()}>
        <Group title="设备投入与回本"><div className="grid gap-4 sm:grid-cols-2">
          {field("investment", "整组设备初始投入", "¥", "所有显卡、主机及部署的一次性总投入，不再乘卡数。填 0 表示无初始投入。", true)}
          {field("days", "计划运营天数", "天", "空白按 365 天，每天按相同产出、币价和费用外推。", true)}
        </div><div className="mt-3 flex flex-wrap gap-2">{[30, 90, 180, 365].map(days => <Button key={days} size="sm" onClick={() => update("days", String(days))}>{days} 天</Button>)}</div><p className="mt-3 text-xs leading-6 text-slate-500">回本按每日经营净收益计算；初始投入仅在计划结余中扣除一次。未计设备残值、折旧及未来币价、产出变化。</p></Group>
        <Group title="设备与产出"><div className="grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="prl-mode" className="mb-1.5 block text-sm font-medium text-slate-700">产出计算方式</label><Select id="prl-mode" aria-label="产出计算方式" value={input.mode} onValueChange={value => update("mode", value)} options={[{ value: "hashrate", label: "按算力推算产出" }, { value: "actual", label: "填写实际日到账产量" }]} /></div>
          {field("cards", "显卡数量", "张", "同型号、相同算力和功耗的显卡数量。")}
          {field("hours", "每日运行时长", "小时 / 天", actual ? "仅用于电费；实际日产量已包含停机影响。" : "产出与运行电费按该时长折算。", false, 24)}
          {actual ? field("actualCoins", "整组设备日到账产量", "PRL / 天", "填写实际一个自然日的净到账量，不再乘卡数、时长或扣矿池与软件费用。") : <>
            {field("hashrate", "单卡实测算力", "TH/s", "填写当前 PearlHash 算法下的实测值。")}
            {field("yieldRate", "单位算力日产出", "PRL / TH/s / 天", "连续运行 24 小时、未扣费用的理论产出。来自矿池或自己的测量，请及时更新。")}
            {field("accepted", "有效算力比例", "%", "只折算产出，不减少运行电费。若算力已是有效算力，填 100%。", false, 100)}
            {field("minerFee", "软件抽水", "%", "先扣软件抽水；已反映在算力中时填 0。", false, 100)}
            {field("poolFee", "矿池费率", "%", "在扣除软件抽水后的产出上扣除；已扣费的产出请用实际到账模式。", false, 100)}
          </>}
        </div><p className="mt-3 rounded-lg bg-blue-50 p-3 text-xs leading-6 text-blue-900">{actual ? "实际到账模式适合已有运行记录的设备。请使用与每日运行时长一致的整组设备自然日产量。" : "PRL 产出会随网络条件改变。这里使用你填写的单位算力产出，不把历史数值当作实时收益；不同版本算法的算力不能混用。"}</p></Group>
        <Group title="功耗与经营费用"><div className="grid gap-4 sm:grid-cols-2">
          {field("cardWatts", "运行时单卡功耗", "W", "优先用实测功耗；不能只填显卡额定功率。")}
          {field("hostWatts", "运行时配套总功耗", "W", "主机、散热等整组额外功耗；不会乘显卡数量。空白按 0。", true)}
          {field("standbyWatts", "停挖时整机功耗", "W", "每天剩余时段的整组功耗；关机填 0，空白按 0。", true)}
          {field("electricity", "电价", "¥ / kWh")}
          {field("otherDaily", "每日其他费用", "¥ / 天", "托管、维护等每日重复支出；空白按 0，不含初始投入。", true)}
        </div></Group>
        <Group title="PRL 价格与折算"><div className="grid gap-4 sm:grid-cols-2">
          {field("price", "PRL 折算单价", "¥ / PRL", autoPrice ? "自动使用上方有效人民币参考价；取消自动更新后可手动填写。" : "手动人民币单价，行情刷新不会覆盖；留空不算收益，填 0 表示无折算收入。", true)}
          {field("sellFee", "折算费用率", "%", "按产出折算金额计费，和矿池费分开；没有则填 0。", false, 100)}
        </div><p className="mt-3 text-xs leading-6 text-slate-500">币价可自动获取或手动填写；单位算力产出仍需手填。产出参考：<a href="https://pool.kryptex.com/en/prl" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">Kryptex PRL 矿池</a>、<a href="https://prlscan.com/tools" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">PRLScan 计算工具</a>。请核对时间、单位及费用口径后填写。</p></Group>

        <div className="flex items-center justify-between gap-2 text-xs text-slate-500"><span>输入变动后自动计算</span><Button onClick={reset}><RotateCcw className="h-4 w-4" />恢复默认设置</Button></div>
      </form>
      <section ref={results} id="prl-results" aria-label="PRL 计算结果" aria-live="polite" className="min-w-0 scroll-mt-4">
        <div className="rounded-2xl bg-slate-900 p-5 text-white sm:p-6"><p className="text-xs text-slate-300">每日经营净收益 · 不含初始投入</p><div id="prl-net" className={`mt-3 break-words text-3xl font-bold tabular-nums sm:text-4xl ${data?.dailyNet > 0 ? "text-emerald-300" : data?.dailyNet < 0 ? "text-red-300" : ""}`}>{!data ? "请填写有效参数" : data.dailyNet === null ? "填写 PRL 单价" : amount(data.dailyNet)}</div><p className="mt-3 text-xs leading-6 text-slate-300">{data ? `${amount(data.dailyRevenue)} 折算后收入 − ${amount(data.dailyCost)} 经营成本` : "填写设备、产出、功耗和电价后自动计算。"}</p></div>
        <p className={`mt-3 rounded-lg p-3 text-xs leading-6 ${!data || data.dailyNet < 0 ? "bg-amber-50 text-amber-900" : "bg-blue-50 text-blue-900"}`}>{!data ? [...new Set(errors.map(error => error.message))].join("；") : data.dailyNet === null ? "已计算产币量与电费；补充 PRL 单价后计算净收益与回本。" : data.dailyNet < 0 ? "当前假设下经营亏损，增加运行天数不会收回设备投入。" : data.dailyNet === 0 ? "当前假设下收支持平，无法靠经营净收益回收初始投入。" : "以下为固定参数下的静态测算，实际收入取决于产出与价格变化。"}</p>
        <PaybackPanel prefix="prl" investment={data?.investment ?? null} dailyNet={data?.dailyNet ?? null} planDays={data?.days ?? Number(input.days || 365)} ready={Boolean(data)} incomeHint={autoPrice ? "等待有效行情价格" : "填写 PRL 单价"} />
        <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-5 border-b border-slate-200 pb-5">
          <Metric title="每日净产币量" value={amount(data?.coins, "") + (data ? " PRL" : "")} hint={actual ? "整组设备实际到账，不重复扣费" : "按时长、有效比例及两项费用折算"} />
          <Metric title="计划期净产币量" value={amount(data?.planCoins, "") + (data ? " PRL" : "")} hint={`${data?.days ?? (input.days || 365)} 天，按当前产出不变`} />
          <Metric title="每日折算金额" value={amount(data?.gross)} hint="净产币量 × PRL 单价，未扣折算费" />
          <Metric title="每日耗电量" value={amount(data?.energy, "") + (data ? " kWh" : "")} hint="运行与停挖时段分别计算" />
          <Metric title="每日电费" value={amount(data?.powerCost)} hint="每日耗电量 × 电价" />
          <Metric title="每日折算费用" value={amount(data?.exchangeCost)} hint="每日折算金额 × 折算费用率" />
          <Metric title="每日经营成本" value={amount(data?.dailyCost)} hint="电费 + 其他每日费用，不含折算费" />
          <Metric title="保本 PRL 单价" value={amount(data?.breakEvenPrice)} hint={data && data.breakEvenPrice === null ? "无可折算产出，无法以单价计算保本" : "覆盖经营成本，不含设备投入"} />
          <Metric title="保本电价上限" value={amount(data?.breakEvenElectricity)} hint={data?.energy === 0 ? "耗电为 0，不适用" : data?.dailyRevenue != null && data.dailyRevenue < Number(input.otherDaily || 0) ? "收入不足以覆盖其他费用" : "¥ / kWh，固定产出和单价"} />
        </dl>
        <section className="mt-5"><h2 className="text-sm font-semibold text-slate-950">币价变化与回本</h2><p className="mt-2 text-xs leading-5 text-slate-500">保持产出、电价与费用不变，仅调整 PRL 折算单价。</p><table className="mt-3 w-full text-left text-xs tabular-nums"><thead className="border-b border-slate-200 text-slate-500"><tr><th className="py-2 font-medium">单价</th><th className="py-2 font-medium">每日净收益</th><th className="py-2 text-right font-medium">回本周期</th></tr></thead><tbody>{data?.dailyNet != null ? [0.7, 1, 1.3].map(factor => {
          const scenario = calculatePrl({ ...effectiveInput, price: String(Number(effectiveInput.price) * factor) }).data;
          return <tr key={factor} className={`border-b border-slate-100 ${factor === 1 ? "font-semibold text-blue-700" : "text-slate-600"}`}><td className="py-3">{factor === 1 ? "当前单价" : factor < 1 ? "下跌 30%" : "上涨 30%"}</td><td className="py-3">{amount(scenario?.dailyNet)}</td><td className="py-3 text-right">{payback(scenario)}</td></tr>;
        }) : <tr><td colSpan={3} className="py-4 text-slate-500">填写完整参数与 PRL 单价后显示。</td></tr>}</tbody></table></section>
        <details className="mt-5 rounded-lg border border-slate-200 bg-white p-4 text-xs leading-6 text-slate-600"><summary className="cursor-pointer font-semibold text-slate-800">查看计算过程</summary>{data ? <div className="mt-3 space-y-1">
          {actual ? <p>实际日产量：{fmt(data.coins)} PRL，已含运行时长与费用影响。</p> : <><p>总算力：{input.cards} × {input.hashrate} = {fmt(data.totalHashrate)} TH/s</p><p>费用前日产量：{fmt(data.totalHashrate)} × {input.yieldRate} × {input.hours} / 24 × {input.accepted}% = {fmt(data.rawCoins)} PRL</p><p>软件抽水：{fmt(data.minerCoins)} PRL；矿池费：{fmt(data.poolCoins)} PRL；净产量：{fmt(data.coins)} PRL</p></>}
          <p>每日耗电：[{fmt(data.runningWatts)} W × {input.hours} 小时 + {input.standbyWatts || 0} W × {fmt(24 - Number(input.hours))} 小时] ÷ 1000 = {fmt(data.energy)} kWh</p>
          <p>每日电费：{fmt(data.energy)} × {input.electricity} = {amount(data.powerCost)}</p>
          <p>每日净收益：{amount(data.gross)} − {amount(data.exchangeCost)} 折算费用 − {amount(data.powerCost)} 电费 − {amount(Number(input.otherDaily || 0))} 其他费用 = {amount(data.dailyNet)}</p>
          <p>回本周期：{amount(data.investment)} ÷ 每日净收益 = {payback(data)}</p>
          <p>计划期投入后结余：{amount(data.planNet)} − {amount(data.investment)} = {amount(data.balance)}</p>
        </div> : <p className="mt-3">填写有效参数后显示。</p>}</details>
      </section>
    </div>
    <div className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 lg:hidden"><Button variant="primary" className="w-full justify-between! shadow-lg" onClick={scrollToResult}><span>查看收益与回本 ↓</span><span className="min-w-0 break-words tabular-nums">{data?.paybackStatus === "available" ? payback(data) : amount(data?.dailyNet)}</span></Button></div>
  </main>;
}
