import { formatPaybackDuration, summarizePayback } from "../../lib/paybackSummary";

const money = (value: number | null) => value == null ? "—" : value !== 0 && Math.abs(value) < 0.000001 ? `${value < 0 ? "−" : ""}<¥0.000001` : `${value < 0 ? "−" : ""}¥${Math.abs(value).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`;
const percent = (value: number | null) => value === null ? "—" : value !== 0 && Math.abs(value) < 0.01 ? `${value < 0 ? "−" : ""}<0.01%` : `${value.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}%`;

export function PaybackPanel({ prefix, investment, dailyNet, planDays, ready, incomeHint = "填写预估收入" }: {
  prefix: string; investment: number | null; dailyNet: number | null; planDays: number; ready: boolean; incomeHint?: string;
}) {
  const summary = summarizePayback(ready ? investment : null, ready ? dailyNet : null, planDays);
  const duration = !ready ? "请先填写有效参数" : summary.status === "missingInvestment" ? "填写初始投入" : summary.status === "missingIncome" ? incomeHint : summary.status === "zeroInvestment" ? "无初始投入，无需回本" : summary.status === "breakEven" ? "收支持平，无法回本" : summary.status === "loss" ? "经营亏损，无法回本" : summary.paybackDays === null ? "回本周期超出计算范围" : `约 ${formatPaybackDuration(summary.paybackDays)}`;
  const planLabel = !ready || summary.balance === null ? summary.status === "zeroInvestment" ? "无需回本" : "待计算" : summary.capital === 0 ? "无需回本" : summary.balance >= 0 ? "可回本" : "无法回本";
  const metrics = [
    ["初始投入总额", money(summary.capital), "设备及部署等一次性投入，不重复扣费"],
    ["每日经营净收益", money(summary.dailyNet), "已扣除经营费用，用于计算回本"],
    ["30 日经营净收益", money(summary.monthlyNet), "每天按相同收入与费用外推"],
    ["365 日经营净收益", money(summary.yearlyNet), "未扣初始投入"],
    ["计划期经营净收益", money(summary.planNet), `${summary.days ?? "—"} 天，未扣初始投入`],
    ["计划期投入后结余", money(summary.balance), "计划期经营净收益 − 初始投入"],
    ["计划期资本回报率", percent(summary.capitalRoi), "投入后结余 ÷ 初始投入；非年化"],
    ["计划期回本资金缺口", money(summary.gap), "亏损时含经营亏损；回本后为 0"],
    ["计划结束后仍需运营", formatPaybackDuration(summary.extraDays), "保持当前日净收益；计划内回本时为 0"],
    ["按计划回本所需日净收益", money(summary.targetDailyNet), "初始投入 ÷ 计划天数，需扣完经营费用"],
  ];
  return <section id={`${prefix}-investment-results`} aria-label="回本周期与资金回收" className="mt-4 rounded-xl border border-blue-200 bg-blue-50/60 p-4 sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold text-slate-950">回本周期与资金回收</h2><span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-blue-800">静态测算</span></div>
    <div id={`${prefix}-payback`} className="mt-3 break-words text-2xl font-bold tabular-nums text-blue-900">{duration}</div>
    <p id={`${prefix}-payback-hint`} className="mt-2 text-xs leading-6 text-slate-600">{summary.status === "available" && summary.paybackDays !== null ? `约 ${formatPaybackDuration(summary.paybackMonths, "个月")} / ${formatPaybackDuration(summary.paybackYears, "年")}；按完整天数需 ${Math.ceil(summary.paybackDays).toLocaleString("zh-CN")} 天。` : summary.status === "loss" ? "每日经营净收益为负，持续运行会扩大亏损，不能给出有效回本天数。" : summary.status === "breakEven" ? "收入刚好覆盖经营成本，日净收益为 0，无法收回初始投入。" : summary.status === "zeroInvestment" ? "一次性投入为 0，无需回收设备资金；仍需关注每日经营盈亏。" : "填写初始投入与收入参数后，回本天数、月数、年数及资金缺口会自动计算。"}</p>
    <div className="mt-4 rounded-lg bg-white/80 p-3"><div className="flex flex-wrap justify-between gap-2 text-xs text-slate-600"><span>{summary.days ?? "—"} 天计划内：<strong className="text-slate-900">{planLabel}</strong></span><span>预计回收投入 {percent(summary.recoveryPercent)}</span></div><div role="progressbar" aria-label="计划期预计回收投入比例" aria-valuemin={0} aria-valuemax={100} aria-valuenow={summary.recoveryPercent ?? undefined} className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-blue-600" style={{ width: `${summary.recoveryPercent ?? 0}%` }} /></div><p className="mt-2 text-xs leading-5 text-slate-500">这是计划期的预计资金回收比例，最高显示 100%，不是实际已回款进度。</p></div>
    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4">{metrics.map(([label, value, hint]) => <div key={label} className="min-w-0"><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 break-words text-lg font-semibold tabular-nums text-slate-950">{value}</dd><p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p></div>)}</dl>
    <div className="mt-5 border-t border-blue-100 pt-4"><h3 className="text-sm font-semibold text-slate-900">不同运营时长的回本对比</h3><table className="mt-2 w-full table-fixed text-left text-xs tabular-nums"><thead className="border-b border-blue-100 text-slate-500"><tr><th className="w-[24%] py-2 font-medium">运营时长</th><th className="py-2 font-medium">累计经营净收益</th><th className="py-2 text-right font-medium">投入后结余</th></tr></thead><tbody>{summary.timeline.map(row => <tr key={row.days} className={`border-b border-blue-100/70 ${row.days === summary.days ? "font-semibold text-blue-800" : "text-slate-600"}`}><th scope="row" className="break-words py-3 pr-2 font-medium">{row.days.toLocaleString("zh-CN")} 天{row.days === summary.days && <span className="block text-[10px] font-normal">当前计划</span>}</th><td className="break-words py-3 pr-2">{money(row.profit)}</td><td className="break-words py-3 text-right">{money(row.cash)}{row.recovered !== null && summary.capital > 0 && <span className="mt-0.5 block text-[10px] font-normal">{row.recovered ? "已覆盖初始投入" : "未覆盖初始投入"}</span>}</td></tr>)}</tbody></table></div>
    <p className="mt-3 text-xs leading-6 text-slate-500">回本周期 = 初始投入 ÷ 每日经营净收益。初始投入只在累计结余中扣除一次。月按 30 天、年按 365 天；收入与成本固定外推，不计设备残值、折旧、资金时间价值及未来行情变化。</p>
  </section>;
}
