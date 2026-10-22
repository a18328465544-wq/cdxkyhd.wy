const finite = (value: number | null) => value !== null && Number.isFinite(value) ? value : null;
const subtract = (a: number, b: number) => Math.abs(a - b) <= Number.EPSILON * Math.max(Math.abs(a), Math.abs(b)) * 4 ? 0 : a - b;

/** Static forecast from operating net income; capital is deducted once per horizon. */
export function summarizePayback(investment: number | null, dailyNet: number | null, planDays: number) {
  const capital = investment !== null && Number.isFinite(investment) && investment >= 0 ? investment : null;
  const net = finite(dailyNet);
  const days = Number.isFinite(planDays) && planDays > 0 ? planDays : null;
  const status = capital === null ? "missingInvestment" : capital === 0 ? "zeroInvestment" : net === null ? "missingIncome" : net === 0 ? "breakEven" : net < 0 ? "loss" : "available";
  const paybackDays = status === "available" ? finite(capital / net) : status === "zeroInvestment" ? 0 : null;
  const planNet = days !== null && net !== null ? finite(net * days) : null;
  const balance = capital !== null && planNet !== null ? finite(subtract(planNet, capital)) : null;
  const recoveryPercent = capital > 0 && planNet !== null ? Math.max(0, Math.min(100, planNet >= capital ? 100 : planNet / capital * 100)) : null;
  const timeline = [...new Set([30, 90, 180, 365, ...(days !== null ? [days] : [])])].sort((a, b) => a - b).map(day => {
    const profit = net === null ? null : finite(net * day);
    const cash = capital === null || profit === null ? null : finite(subtract(profit, capital));
    return { days: day, profit, cash, recovered: cash === null ? null : cash >= 0 };
  });
  return {
    capital, dailyNet: net, days, status, paybackDays,
    paybackMonths: paybackDays === null ? null : paybackDays / 30,
    paybackYears: paybackDays === null ? null : paybackDays / 365,
    monthlyNet: net === null ? null : finite(net * 30), yearlyNet: net === null ? null : finite(net * 365),
    planNet, balance, recoveryPercent, timeline,
    capitalRoi: capital > 0 && balance !== null ? finite(balance / capital * 100) : null,
    gap: balance === null ? null : Math.max(0, -balance),
    targetDailyNet: capital === null || days === null ? null : finite(capital / days),
    extraDays: paybackDays === null || days === null ? null : Math.max(0, subtract(paybackDays, days)),
  };
}

export function formatPaybackDuration(days: number | null | undefined, unit = "天") {
  if (days == null || !Number.isFinite(days)) return "—";
  if (days > 0 && days < 0.01) return `<0.01 ${unit}`;
  return `${days.toLocaleString("zh-CN", { maximumFractionDigits: 2 })} ${unit}`;
}
