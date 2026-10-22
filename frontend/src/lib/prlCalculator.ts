export const prlDefaults = {
  mode: "hashrate", cards: "1", hashrate: "", yieldRate: "", actualCoins: "",
  hours: "24", accepted: "100", poolFee: "0", minerFee: "0",
  cardWatts: "", hostWatts: "0", standbyWatts: "0", electricity: "",
  price: "", sellFee: "0", otherDaily: "0", investment: "", days: "365",
};
export type PrlInputs = typeof prlDefaults;
export type PrlKey = keyof PrlInputs;
export type PrlError = { field: PrlKey; message: string };

/** Yields are supplied by the user; the UI may supply a fresh market price. No quote is embedded. */
export function calculatePrl(input: PrlInputs) {
  const errors: PrlError[] = [];
  function read(field: PrlKey, label: string, options: { min?: number; max?: number; optional?: boolean; fallback?: number; integer?: boolean } = {}): number | null {
    const raw = input[field].trim();
    if (!raw && options.optional) return options.fallback ?? null;
    const value = Number(raw);
    if (!raw || !Number.isFinite(value) || value < (options.min ?? 0) || value > (options.max ?? Number.MAX_VALUE) || (options.integer && !Number.isInteger(value))) {
      errors.push({ field, message: `${label}：${!raw ? "请填写" : "请输入范围内的有效数字"}` });
      return null;
    }
    return value;
  }
  const actual = input.mode === "actual";
  if (!actual && input.mode !== "hashrate") errors.push({ field: "mode", message: "请选择产出计算方式" });
  const cards = read("cards", "显卡数量", { min: 1, integer: true });
  const hours = read("hours", "每日运行时长", { max: 24 });
  const cardWatts = read("cardWatts", "单卡功耗");
  const hostWatts = read("hostWatts", "配套功耗", { optional: true, fallback: 0 });
  const standbyWatts = read("standbyWatts", "停挖时整机功耗", { optional: true, fallback: 0 });
  const electricity = read("electricity", "电价");
  const otherDaily = read("otherDaily", "每日其他费用", { optional: true, fallback: 0 });
  const price = read("price", "PRL 折算单价", { optional: true });
  const sellFee = read("sellFee", "折算费用率", { max: 100 });
  const investment = read("investment", "初始投入", { optional: true });
  const days = read("days", "计划天数", { min: Number.MIN_VALUE, optional: true, fallback: 365 });
  let totalHashrate: number | null = null;
  let rawCoins: number | null = null;
  let minerCoins = 0;
  let poolCoins = 0;
  let coins: number | null = null;
  if (actual) {
    coins = read("actualCoins", "实际日到账产量");
  } else {
    const hashrate = read("hashrate", "单卡算力", { min: Number.MIN_VALUE });
    const yieldRate = read("yieldRate", "单位算力日产出");
    const accepted = read("accepted", "有效算力比例", { max: 100 });
    const poolFee = read("poolFee", "矿池费率", { max: 100 });
    const minerFee = read("minerFee", "软件抽水", { max: 100 });
    totalHashrate = cards * hashrate;
    rawCoins = totalHashrate * yieldRate * hours / 24 * accepted / 100;
    minerCoins = rawCoins * minerFee / 100;
    poolCoins = (rawCoins - minerCoins) * poolFee / 100;
    coins = rawCoins - minerCoins - poolCoins;
  }
  if (errors.length) return { valid: false as const, errors, data: null };

  const runningWatts = cards * cardWatts + hostWatts;
  const energy = (runningWatts * hours + standbyWatts * (24 - hours)) / 1000;
  const powerCost = energy * electricity;
  const dailyCost = powerCost + otherDaily;
  const gross = price === null ? null : coins * price;
  const exchangeCost = gross === null ? null : gross * sellFee / 100;
  const dailyRevenue = gross === null ? null : gross - exchangeCost;
  const difference = (a: number, b: number) => Math.abs(a - b) <= Number.EPSILON * Math.max(Math.abs(a), Math.abs(b)) * 4 ? 0 : a - b;
  const dailyNet = dailyRevenue === null ? null : difference(dailyRevenue, dailyCost);
  const planNet = dailyNet === null ? null : dailyNet * days;
  const balance = planNet === null || investment === null ? null : difference(planNet, investment);
  const paybackDays = investment === null || dailyNet === null || dailyNet <= 0 || investment === 0 ? null : investment / dailyNet;
  const paybackStatus = investment === null ? "missingInvestment" : investment === 0 ? "zeroInvestment" : dailyNet === null ? "missingPrice" : dailyNet <= 0 ? "notProfitable" : "available";
  const realizableCoins = coins * (1 - sellFee / 100);
  const breakEvenPrice = realizableCoins > 0 ? dailyCost / realizableCoins : null;
  const electricityBudget = dailyRevenue === null ? null : difference(dailyRevenue, otherDaily);
  const breakEvenElectricity = energy > 0 && electricityBudget !== null && electricityBudget >= 0 ? electricityBudget / energy : null;
  const data = {
    totalHashrate, rawCoins, minerCoins, poolCoins, coins, runningWatts, energy, powerCost,
    dailyCost, gross, exchangeCost, dailyRevenue, dailyNet, monthlyNet: dailyNet === null ? null : dailyNet * 30,
    yearlyNet: dailyNet === null ? null : dailyNet * 365, days, planCoins: coins * days, planNet,
    investment, balance, capitalRoi: investment > 0 && balance !== null ? balance / investment * 100 : null,
    paybackDays, paybackStatus, withinPlan: balance === null ? null : balance >= 0,
    breakEvenPrice, breakEvenElectricity,
  };
  if (Object.values(data).some(value => typeof value === "number" && !Number.isFinite(value))) {
    return { valid: false as const, errors: [{ field: "cards" as PrlKey, message: "计算结果超出范围，请缩小输入数值" }], data: null };
  }
  return { valid: true as const, errors, data };
}
