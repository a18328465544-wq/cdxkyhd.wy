// Pure rental cost and income model. No network dependencies.
  const units = { "GH/s": 0.001, "TH/s": 1, "PH/s": 1000 };
  const bases = ["day", "hour", "total"];

  function calculate(input) {
    const errors = [];
    function read(field, label, options) {
      options = options || {};
      const raw = input[field];
      if (raw === undefined || raw === null || String(raw).trim() === "") {
        if (options.optional) return options.fallback === undefined ? null : options.fallback;
        errors.push({ field: field, kind: "missing", message: "请填写" + label });
        return null;
      }
      const value = Number(raw);
      if (!Number.isFinite(value) || value < 0 || (options.positive && value === 0) || (options.max !== undefined && value > options.max)) {
        const range = options.max !== undefined ? "0–" + options.max : (options.positive ? "大于 0 的有限数值" : "大于或等于 0 的有限数值");
        errors.push({ field: field, kind: "invalid", message: label + "须为" + range });
        return null;
      }
      return value;
    }
    function choice(field, allowed) {
      if (!allowed.includes(input[field])) errors.push({ field: field, kind: "invalid", message: "请选择有效的计量或计费方式" });
    }
    const mode = input.mode === undefined ? "rent" : input.mode;
    if (!["rent", "owned"].includes(mode)) errors.push({ field: "mode", kind: "invalid", message: "请选择有效测算方式" });
    choice("unit", Object.keys(units));
    if (mode === "rent") choice("rentBasis", bases);
    choice("revenueBasis", bases);
    choice("feeBase", ["rent", "income"]);
    const hashrate = read("hashrate", "算力规模", { positive: true });
    const hours = read("hours", "租赁时长", { positive: true });
    const rentRate = mode === "owned" ? 0 : read("rentRate", "租赁报价");
    const revenueRate = read("revenueRate", "预估收入", { optional: true });
    const accepted = revenueRate === null ? 100 : read("accepted", "有效交付率", { max: 100 });
    const serviceFee = read("serviceFee", "服务费率", { max: 100 });
    const otherCost = read("otherCost", "其他费用", { optional: true, fallback: 0 });
    const initialInvestment = read("initialInvestment", "初始投入", { optional: true });
    const projectionDays = read("projectionDays", "计划运营天数", { optional: true, fallback: 365, positive: true });
    const feeBase = mode === "owned" ? "income" : input.feeBase;
    let powerWatts = 0;
    let electricityRate = 0;
    if (input.powerIncluded !== true) {
      choice("powerMode", ["total", "perUnit"]);
      powerWatts = read("powerWatts", "功耗");
      electricityRate = read("electricityRate", "电价");
    }
    if (errors.length) return { valid: false, errors: errors };
    const hashHours = hashrate * hours;
    const factor = function (basis) { return basis === "total" ? 1 : (basis === "hour" ? hashHours : hashHours / 24); };
    const rentFactor = factor(input.rentBasis);
    const baseRent = mode === "owned" ? 0 : rentRate * rentFactor;
    const rawRevenue = revenueRate === null ? null : revenueRate * factor(input.revenueBasis);
    const gross = rawRevenue === null ? null : rawRevenue * (accepted / 100);
    const energy = input.powerIncluded === true ? 0 : powerWatts * (input.powerMode === "perUnit" ? hashrate : 1) / 1000 * hours;
    const powerCost = energy * electricityRate;
    const feeRate = serviceFee / 100;
    const serviceCost = feeRate === 0 ? 0 : (feeBase === "rent" ? baseRent * feeRate : (gross === null ? null : gross * feeRate));
    const totalCost = serviceCost === null ? null : baseRent + serviceCost + powerCost + otherCost;
    const subtract = function (a, b) {
      const result = a - b;
      return Math.abs(result) <= Number.EPSILON * Math.max(Math.abs(a), Math.abs(b)) * 4 ? 0 : result;
    };
    const net = gross === null || totalCost === null ? null : subtract(gross, totalCost);
    const roi = net === null || totalCost === 0 ? null : net / totalCost * 100;
    const availableForRent = gross === null ? null : subtract(gross, powerCost + otherCost + (feeBase === "income" ? gross * feeRate : 0));
    const maxRentRate = mode === "owned" || availableForRent === null || availableForRent < 0 ? null : availableForRent / rentFactor / (feeBase === "rent" ? 1 + feeRate : 1);
    const periodDays = hours / 24;
    const dailyNet = net === null ? null : net / periodDays;
    const dailyCost = totalCost === null ? null : totalCost / periodDays;
    const monthlyNet = dailyNet === null ? null : dailyNet * 30;
    const yearlyNet = dailyNet === null ? null : dailyNet * 365;
    const projectedOperatingNet = dailyNet === null ? null : dailyNet * projectionDays;
    const projectedCashBalance = projectedOperatingNet === null || initialInvestment === null ? null : subtract(projectedOperatingNet, initialInvestment);
    const investmentRoi = projectedCashBalance === null || initialInvestment === 0 ? null : projectedCashBalance / initialInvestment * 100;
    const paybackStatus = initialInvestment === null ? "missingInvestment" : dailyNet === null ? "missingIncome" : initialInvestment === 0 ? "zeroInvestment" : dailyNet <= 0 ? "notProfitable" : "available";
    const paybackDays = paybackStatus === "zeroInvestment" ? 0 : paybackStatus === "available" ? initialInvestment / dailyNet : null;
    const paybackWithinPlan = projectedCashBalance === null ? null : projectedCashBalance >= 0;
    const values = [hashHours, rentFactor, baseRent, rawRevenue, gross, energy, powerCost, serviceCost, totalCost, net, roi, availableForRent, maxRentRate, initialInvestment, projectionDays, dailyNet, dailyCost, monthlyNet, yearlyNet, projectedOperatingNet, projectedCashBalance, investmentRoi, paybackDays];
    if (hashHours <= 0 || rentFactor <= 0 || values.some(function (value) { return value !== null && !Number.isFinite(value); })) {
      return { valid: false, errors: [{ field: "hashrate", kind: "invalid", message: "数值超出可计算范围，请调整算力、租期或报价" }] };
    }
    return {
      valid: true, errors: [], hashrate: hashrate, hours: hours, hashHours: hashHours,
      deliveredHashHours: hashHours * (accepted / 100), baseRent: baseRent,
      rawRevenue: rawRevenue, gross: gross, serviceCost: serviceCost, energy: energy,
      powerCost: powerCost, otherCost: otherCost, totalCost: totalCost, net: net,
      roi: roi, maxRentRate: maxRentRate, mode: mode, feeBase: feeBase,
      initialInvestment: initialInvestment, projectionDays: projectionDays,
      dailyNet: dailyNet, dailyCost: dailyCost, monthlyNet: monthlyNet, yearlyNet: yearlyNet,
      projectedOperatingNet: projectedOperatingNet, projectedCashBalance: projectedCashBalance,
      investmentRoi: investmentRoi, paybackStatus: paybackStatus, paybackDays: paybackDays,
      paybackWithinPlan: paybackWithinPlan,
      breakEvenStatus: mode === "owned" ? "notApplicable" : gross === null ? "unknown" : (availableForRent < 0 ? "impossible" : "available")
    };
  }

  function convertUnit(input, nextUnit) {
    if (!units[input.unit] || !units[nextUnit]) throw new Error("未知算力单位");
    const ratio = units[nextUnit] / units[input.unit];
    const result = Object.assign({}, input, { unit: nextUnit });
    function scale(field, multiplier) {
      const value = input[field];
      if (value === undefined || value === null || String(value).trim() === "") return;
      const number = Number(value);
      const converted = number * multiplier;
      if (!Number.isFinite(number) || number < 0 || !Number.isFinite(converted) || (number > 0 && converted === 0)) throw new Error("请先修正数值，再切换算力单位");
      result[field] = String(Number(converted.toPrecision(14)));
    }
    scale("hashrate", 1 / ratio);
    if (input.mode !== "owned" && input.rentBasis !== "total") scale("rentRate", ratio);
    if (input.revenueBasis !== "total") scale("revenueRate", ratio);
    if (input.powerMode === "perUnit") scale("powerWatts", ratio);
    return result;
  }

  function convertBasis(input, field, nextBasis) {
    if (!["rentBasis", "revenueBasis"].includes(field) || !bases.includes(nextBasis) || !bases.includes(input[field])) throw new Error("未知计费方式");
    const rateField = field === "rentBasis" ? "rentRate" : "revenueRate";
    const result = Object.assign({}, input, { [field]: nextBasis });
    if (input[rateField] === undefined || String(input[rateField]).trim() === "") return result;
    const hashHours = Number(input.hashrate) * Number(input.hours);
    const rate = Number(input[rateField]);
    if (!Number.isFinite(hashHours) || hashHours <= 0 || !Number.isFinite(rate) || rate < 0) throw new Error("请先填写有效的算力、租期和报价，再切换计费方式");
    const factor = function (basis) { return basis === "total" ? 1 : (basis === "hour" ? hashHours : hashHours / 24); };
    const converted = rate * factor(input[field]) / factor(nextBasis);
    if (!Number.isFinite(converted) || (rate > 0 && converted === 0)) throw new Error("换算数值超出可计算范围");
    result[rateField] = String(Number(converted.toPrecision(14)));
    return result;
  }


export { calculate, convertUnit, convertBasis };
