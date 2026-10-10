export type GpuSnBrandId = "asus" | "msi" | "gigabyte" | "colorful" | "galax" | "zotac" | "gainward" | "maxsun" | "sapphire" | "powercolor" | "xfx" | "nvidia" | "dataland" | "inno3d" | "manli" | "pny" | "evga" | "palit" | "leadtek" | "asl" | "onda";
export type GpuSnConfidence = "high" | "medium" | "low";
export type GpuSnParseStatus = "parsed" | "partial" | "invalid" | "unsupported";
export type GpuSnSource = {title: string; url?: string; evidence: "official" | "community" | "reference" | "user-provided"};
export type GpuSnDateResult = {
  status: GpuSnParseStatus;
  brandId: GpuSnBrandId;
  brandName: string;
  sn: string;
  productModel?: string;
  year: number | null;
  month: number | null;
  week: number | null;
  dateRange: {start: string; end: string} | null;
  elapsedDays: number | null;
  confidence: GpuSnConfidence;
  confidenceScore: number;
  ruleId: string;
  ruleSummary: string;
  explanation: string;
  sources: GpuSnSource[];
  officialUrl: string;
  officialConfirmed: false;
};
export type GpuSnServiceInfo = {hotline?: string; hours?: string; personalSend: string; note: string; sourceUrl: string; checkedAt: string};
export type GpuSnRule = {id: GpuSnBrandId; name: string; officialUrl: string; example: string; rule: string; ruleIds?: string[]; source: string; sourceUrl: string; description: string; serviceInfo?: GpuSnServiceInfo};

export const GPU_SN_BRANDS: Array<{id: GpuSnBrandId; name: string}> = [
  {id: "nvidia", name: "NVIDIA 英伟达"}, {id: "asus", name: "华硕 ASUS"}, {id: "gigabyte", name: "技嘉 GIGABYTE"},
  {id: "msi", name: "微星 MSI"}, {id: "colorful", name: "七彩虹 Colorful"}, {id: "galax", name: "影驰 GALAX"},
  {id: "zotac", name: "索泰 ZOTAC"}, {id: "gainward", name: "耕升 Gainward"}, {id: "maxsun", name: "铭瑄 MAXSUN"},
  {id: "sapphire", name: "蓝宝石 Sapphire"}, {id: "powercolor", name: "撼讯 PowerColor"}, {id: "xfx", name: "讯景 XFX"},
  {id: "dataland", name: "迪兰 DATALAND"}, {id: "inno3d", name: "映众 INNO3D"}, {id: "manli", name: "万丽 MANLI"},
  {id: "pny", name: "PNY"}, {id: "evga", name: "EVGA"}, {id: "palit", name: "同德 PALIT"},
  {id: "leadtek", name: "丽台 LEADTEK"}, {id: "asl", name: "翔升 ASL"}, {id: "onda", name: "昂达 ONDA"},
];

const REFERENCE_URL = "https://cpuranklist.com/gpu-sn.php";
const USER_RULE_SOURCE: GpuSnSource = {title: "用户提供的 SN 规则库", evidence: "user-provided"};
const REFERENCE_SERVICE = (hotline: string, personalSend: string, note: string): GpuSnServiceInfo => ({
  hotline, personalSend, note: `参考站页面整理的信息；${note}`, sourceUrl: REFERENCE_URL, checkedAt: "2026-10-09",
});
const GENERIC_SERVICE = (url: string): GpuSnServiceInfo => ({
  personalSend: "以品牌官方政策为准", note: "本模块未核实该品牌的送保方式，请以品牌官方说明为准。", sourceUrl: url, checkedAt: "2026-10-09",
});

const RULES_BY_BRAND: Record<GpuSnBrandId, GpuSnRule> = {
  nvidia: {id: "nvidia", name: "NVIDIA 公版", officialUrl: "https://www.nvidia.cn/geforce/support/", example: "完整板卡 SN", rule: "unknown", source: "用户规则库：日期编码未知", sourceUrl: "https://www.nvidia.cn/geforce/support/", description: "目前只识别品牌，不按芯片封装码或参考站单一样例推算板卡生产日期；官方单卡 SN 日期规则待确认。", serviceInfo: REFERENCE_SERVICE("以官网为准", "未知", "芯片封装日期码不等同于显卡板卡 SN。")},
  asus: {id: "asus", name: "华硕 ASUS", officialUrl: "https://www.asus.com.cn/support/", example: "N1xxxxxxxxxxxx / LBxxxxxxxxxxxx / 9CC0AC186xxx", rule: "partial", ruleIds: ["ASUS_SN_CUSTOM", "ASUS_SN_LEGACY", "ASUS_REFERENCE_NUMERIC", "ASUS_REFERENCE_EXCEPTION"], source: "ASUS_SN_CUSTOM 用户提供规则；旧格式兼容参考站样例", sourceUrl: REFERENCE_URL, description: "ASUS_SN_CUSTOM：第 1 位年份码 N/P/Q/R/S/T/U/V/W=2018–2026，第 2 位月份码 1–9/A–C。兼容旧年份码 H/J/K/L/M（仅在新表未定义该码时使用）、参考站旧数字码和已记录样例。重叠年份码以 ASUS_SN_CUSTOM 为准。", serviceInfo: REFERENCE_SERVICE("400-620-6655", "支持", "具体型号与服务范围以 ASUS 官方政策为准。")},
  gigabyte: {id: "gigabyte", name: "技嘉 GIGABYTE", officialUrl: "https://www.gigabyte.cn/Support/Consumer", example: "SN2342xxxxxxxx", rule: "partial", source: "用户规则库、技嘉官方历史样例与参考站样例", sourceUrl: "https://service.gigabyte.tw/Home/Content/74", description: "识别 SNYYWW 或开头 YYWW 周码，按 ISO 周计算；已验证 2021、2023、2025 年样例。不因显卡型号或年份设置额外拦截。", serviceInfo: REFERENCE_SERVICE("分地区，以官网为准", "支持", "服务方式因地区可能不同。")},
  msi: {id: "msi", name: "微星 MSI", officialUrl: "https://www.msi.cn/support", example: "SD2103007640", rule: "partial", source: "用户规则库、MSI 官方 SB 示例与参考站 SD 样例", sourceUrl: "https://br.msi.com/page/warranty-demo", description: "从 SN 中识别 SDYYMM；兼容 MSI 官方历史条码中的 SBYYMM。年月按字段直接校验。", serviceInfo: REFERENCE_SERVICE("以官网为准", "支持", "具体报修方式以 MSI 官网为准。")},
  colorful: {id: "colorful", name: "七彩虹 Colorful", officialUrl: "https://www.colorful.cn/service/shwd", example: "GGBN1K3xxxxx", rule: "partial", source: "用户规则库与参考站黑盒样例", sourceUrl: REFERENCE_URL, description: "第 6 位年份码 K/L/M/N/P/R/S=2020–2026，第 7 位月份 1–9/A–C。参考站示例 GY6AC7XXXX 的年份位不在此旧规则映射内，按待验证格式处理。", serviceInfo: REFERENCE_SERVICE("400-678-5866", "支持", "适用产品及送修范围以 Colorful 官方政策为准。")},
  galax: {id: "galax", name: "影驰 GALAX", officialUrl: "https://www.szgalaxy.com/service/snSearch", example: "21Axxxxxxxx", rule: "partial", source: "用户规则库与参考站样例", sourceUrl: REFERENCE_URL, description: "SN 前两位为 20YY 年份，第三位 1–9/A–C 为月份；参考站验证到 2025 年样例。", serviceInfo: REFERENCE_SERVICE("400-700-3933", "支持", "送修范围以 GALAX 官方说明为准。")},
  zotac: {id: "zotac", name: "索泰 ZOTAC", officialUrl: "https://www.zotac.com/cn/support", example: "N2245xxxxxx", rule: "partial", source: "用户规则库与参考站样例", sourceUrl: REFERENCE_URL, description: "识别 N+YYWW 生产周码，按 ISO 周计算；参考站样例可解析至 2025 年。", serviceInfo: REFERENCE_SERVICE("以官网为准", "支持", "境内外版本服务政策以 ZOTAC 官方为准。")},
  gainward: {id: "gainward", name: "耕升 Gainward", officialUrl: "https://www.szgainward.cn/service", example: "22Cxxxxxxxx", rule: "partial", source: "用户规则库与参考站样例", sourceUrl: REFERENCE_URL, description: "SN 前两位为 20YY 年份，第三位 1–9/A–C 为月份；参考站样例可解析至 2025 年。", serviceInfo: REFERENCE_SERVICE("400-700-3939", "支持", "具体型号保修范围以 Gainward 官方为准。")},
  maxsun: {id: "maxsun", name: "铭瑄 MAXSUN", officialUrl: "https://www.maxsun.com.cn/xiaoshou/lianbao/", example: "S2312xxxxxx", rule: "partial", source: "用户规则库与参考站样例", sourceUrl: REFERENCE_URL, description: "在 SN 中识别 S+YYWW 周码，按 ISO 周计算；参考站样例可解析至 2025 年。", serviceInfo: REFERENCE_SERVICE("400-696-0606", "支持", "具体网点和寄送要求以 MAXSUN 官方为准。")},
  sapphire: {id: "sapphire", name: "蓝宝石 Sapphire", officialUrl: "https://www.sapphiretech.com/zh-cn/cs_consumer", example: "A2135xxxx", rule: "partial", source: "用户规则库与参考站样例", sourceUrl: REFERENCE_URL, description: "识别首字母+YYWW 周码，按 ISO 周计算；参考站 A+YYWW 样例可解析至 2025 年。", serviceInfo: REFERENCE_SERVICE("以官网为准", "支持", "具体产品系列和地区服务以 Sapphire 官方为准。")},
  powercolor: {id: "powercolor", name: "撼讯 PowerColor", officialUrl: "https://www.powercolor.com/cn/rma24.htm", example: "LG2509XXXXX", rule: "partial", source: "参考站样例", sourceUrl: REFERENCE_URL, description: "识别 LG+YYMM 年月字段；已通过参考站 2021、2022、2024、2025 年样例，不按产品型号拦截。", serviceInfo: REFERENCE_SERVICE("以官网为准", "支持", "无购买凭证时的日期认定以 PowerColor 官方条款为准。")},
  xfx: {id: "xfx", name: "讯景 XFX", officialUrl: "https://www.xfx.com.cn/warranty/", example: "完整 XFX SN", rule: "unknown", source: "用户规则库：日期编码未知", sourceUrl: "https://www.xfx.com.cn/warranty/", description: "讯景存在多代 SN 编码体系，目前只识别品牌，不将旧年份码扩展为生产年月。", serviceInfo: REFERENCE_SERVICE("以官网为准", "未知", "送保范围与渠道政策以 XFX 官方为准。")},
  dataland: {id: "dataland", name: "迪兰 DATALAND", officialUrl: "https://www.dataland.com.cn/", example: "DLZ2140xxxx", rule: "partial", source: "用户提供的初版规则库", sourceUrl: "https://www.dataland.com.cn/", description: "识别 DLZ+YYWW 周码，按 ISO 周数校验并计算日期范围。", serviceInfo: GENERIC_SERVICE("https://www.dataland.com.cn/")},
  inno3d: {id: "inno3d", name: "映众 INNO3D", officialUrl: "https://www.inno3d.com/", example: "32-771-2108xxxx", rule: "partial", source: "用户提供的初版规则库", sourceUrl: "https://www.inno3d.com/", description: "在由非数字字符分隔的独立 YYMM 数字段中识别生产年月；若 SN 有多个候选字段则不猜测。", serviceInfo: GENERIC_SERVICE("https://www.inno3d.com/")},
  manli: {id: "manli", name: "万丽 MANLI", officialUrl: "https://www.manli.com/", example: "23 位完整 SN", rule: "unknown", source: "用户规则库：日期编码未知", sourceUrl: "https://www.manli.com/", description: "先校验 23 位序列号并识别品牌；日期编码未知，不推算生产年月或周数。", serviceInfo: GENERIC_SERVICE("https://www.manli.com/")},
  pny: {id: "pny", name: "PNY", officialUrl: "https://www.pny.com/support", example: "完整 PNY SN", rule: "unknown", source: "用户规则库：日期编码未知", sourceUrl: "https://www.pny.com/support", description: "可识别品牌并提供官方支持入口；尚无可验证的 SN 日期解码规则。", serviceInfo: GENERIC_SERVICE("https://www.pny.com/support")},
  evga: {id: "evga", name: "EVGA", officialUrl: "https://www.evga.com/support/", example: "完整 EVGA SN", rule: "unknown", source: "用户规则库：日期编码未知", sourceUrl: "https://www.evga.com/support/", description: "Part Number 与 Serial Number 分开管理；目前不从序列号推算生产日期。", serviceInfo: GENERIC_SERVICE("https://www.evga.com/support/")},
  palit: {id: "palit", name: "同德 PALIT", officialUrl: "https://www.palit.com/", example: "完整 PALIT SN", rule: "unknown", source: "用户规则库：日期编码未知", sourceUrl: "https://www.palit.com/", description: "暂不把集团关系或其他品牌的 YY+月份规则套用到 PALIT SN。", serviceInfo: GENERIC_SERVICE("https://www.palit.com/")},
  leadtek: {id: "leadtek", name: "丽台 LEADTEK", officialUrl: "https://www.leadtek.com/", example: "完整 LEADTEK SN", rule: "unknown", source: "用户规则库：日期编码未知", sourceUrl: "https://www.leadtek.com/", description: "尚无可验证的显卡 SN 日期解码规则；提供品牌识别与官方入口。", serviceInfo: GENERIC_SERVICE("https://www.leadtek.com/")},
  asl: {id: "asl", name: "翔升 ASL", officialUrl: "https://www.asl.com.cn/", example: "完整 ASL SN", rule: "unknown", source: "用户规则库：日期编码未知", sourceUrl: "https://www.asl.com.cn/", description: "尚无可验证的显卡 SN 日期解码规则；提供品牌识别与官方入口。", serviceInfo: GENERIC_SERVICE("https://www.asl.com.cn/")},
  onda: {id: "onda", name: "昂达 ONDA", officialUrl: "https://www.onda.cn/", example: "完整 ONDA SN", rule: "unknown", source: "用户规则库：日期编码未知", sourceUrl: "https://www.onda.cn/", description: "尚无可验证的显卡 SN 日期解码规则；提供品牌识别与官方入口。", serviceInfo: GENERIC_SERVICE("https://www.onda.cn/")},
};

export const GPU_SN_RULES: GpuSnRule[] = GPU_SN_BRANDS.map(({id}) => RULES_BY_BRAND[id]);

const SOURCES_BY_BRAND: Record<GpuSnBrandId, GpuSnSource[]> = Object.fromEntries(
  GPU_SN_BRANDS.map(({id}) => {
    const rule = RULES_BY_BRAND[id];
    const sources: GpuSnSource[] = [USER_RULE_SOURCE];
    if (rule.sourceUrl === REFERENCE_URL) sources.push({title: "参考站样例和黑盒查询结果", url: REFERENCE_URL, evidence: "reference"});
    else sources.push({title: `${rule.name} 官方支持入口（非日期规则说明）`, url: rule.officialUrl, evidence: "official"});
    if (id === "colorful") sources.push({title: "Colorful 官方售后入口", url: rule.officialUrl, evidence: "official"});
    if (id === "gigabyte") sources.push({title: "技嘉官方序列号说明", url: "https://service.gigabyte.tw/Home/Content/74", evidence: "official"});
    if (id === "msi") sources.push({title: "MSI 官方保修条码示例", url: "https://br.msi.com/page/warranty-demo", evidence: "official"});
    if (id === "nvidia") sources.push({title: "NVIDIA 封装标记说明（芯片日期码不等同板卡 SN）", url: "https://www.nvidia.com/content/dam/cpmassets/folder2/NPN-09746-001_v01.pdf", evidence: "official"});
    return [id, sources];
  }),
) as Record<GpuSnBrandId, GpuSnSource[]>;

type ParseInput = {brandId: GpuSnBrandId; sn: string; productModel?: string; ruleId?: string};
type ParsedFields = {
  status: GpuSnParseStatus;
  year?: number | null;
  month?: number | null;
  week?: number | null;
  dateRange?: {start: string; end: string} | null;
  elapsedDays?: number | null;
  confidence?: GpuSnConfidence;
  confidenceScore?: number;
  explanation: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function normalizedSn(sn: string) {
  return sn.trim().toUpperCase().replace(/\s+/g, "");
}

function snCompact(sn: string) {
  return normalizedSn(sn).replace(/[^A-Z0-9]/g, "");
}

function yearFromTwoDigits(value: string, now: Date): number | null {
  const candidate = 2000 + Number(value);
  return candidate <= now.getUTCFullYear() ? candidate : null;
}

function isFutureYearCode(value: string, now: Date): boolean {
  return Number(value) > now.getUTCFullYear() % 100;
}

function monthFromCode(value: string): number | null {
  if (/^[1-9]$/.test(value)) return Number(value);
  if (/^[A-C]$/.test(value)) return value.charCodeAt(0) - 55;
  return null;
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function daysSinceEstimate(start: Date, end: Date, now: Date): number | null {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const midpoint = Math.floor((start.getTime() + end.getTime()) / 2);
  return midpoint > today ? null : Math.floor((today - midpoint) / DAY_MS);
}

function monthRange(year: number, month: number, now: Date): {start: string; end: string; elapsedDays: number | null} | null {
  if (month < 1 || month > 12) return null;
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (start.getTime() > today) return null;
  return {start: toIsoDate(start), end: toIsoDate(end), elapsedDays: daysSinceEstimate(start, end, now)};
}

function isoWeekRange(year: number, week: number, now: Date): {start: string; end: string; elapsedDays: number | null} | null {
  if (week < 1 || week > 53) return null;
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const mondayOffset = (jan4.getUTCDay() + 6) % 7;
  const start = new Date(jan4.getTime() - mondayOffset * DAY_MS + (week - 1) * 7 * DAY_MS);
  const thursday = new Date(start.getTime() + 3 * DAY_MS);
  if (thursday.getUTCFullYear() !== year) return null;
  const end = new Date(start.getTime() + 6 * DAY_MS);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (start.getTime() > today) return null;
  return {start: toIsoDate(start), end: toIsoDate(end), elapsedDays: daysSinceEstimate(start, end, now)};
}

function resultFor(input: ParseInput, fields: ParsedFields): GpuSnDateResult {
  const brand = RULES_BY_BRAND[input.brandId];
  return {
    status: fields.status,
    brandId: input.brandId,
    brandName: brand.name,
    sn: normalizedSn(input.sn),
    ...(input.productModel ? {productModel: input.productModel.trim()} : {}),
    year: fields.year ?? null,
    month: fields.month ?? null,
    week: fields.week ?? null,
    dateRange: fields.dateRange ?? null,
    elapsedDays: fields.elapsedDays ?? null,
    confidence: fields.confidence || (fields.status === "parsed" ? "medium" : "low"),
    confidenceScore: fields.confidenceScore ?? (fields.status === "parsed" ? 70 : 30),
    ruleId: input.ruleId || input.brandId + "." + brand.rule,
    ruleSummary: brand.description,
    explanation: fields.explanation,
    sources: SOURCES_BY_BRAND[input.brandId],
    officialUrl: brand.officialUrl,
    officialConfirmed: false,
  };
}

function pending(input: ParseInput, explanation?: string): GpuSnDateResult {
  return resultFor(input, {
    status: "unsupported",
    explanation: explanation || "目前没有足够可靠的公开规则解码这个序列号，请使用品牌官方售后入口核实。",
  });
}

function invalid(input: ParseInput, explanation: string): GpuSnDateResult {
  return resultFor(input, {status: "invalid", explanation});
}

function dateFromMonth(input: ParseInput, year: number | null, month: number, now: Date, confidence: GpuSnConfidence, confidenceScore: number): GpuSnDateResult {
  if (month < 1 || month > 12) return invalid(input, "序列号中的月份字段无效，月份必须在 1 到 12 之间。" );
  if (year === null) {
    return resultFor(input, {
      status: "partial", month, confidence: "low", confidenceScore: 25,
      explanation: "已识别月份字段，但两位年份无法确定世纪；为避免把生产日期猜成某一年，只返回月份。",
    });
  }
  const range = monthRange(year, month, now);
  if (!range) return invalid(input, "该生产月份位于未来，或不是有效的年月编码。请核对 SN 和显卡型号。" );
  return resultFor(input, {
    status: "parsed", year, month, dateRange: {start: range.start, end: range.end}, elapsedDays: range.elapsedDays,
    confidence, confidenceScore, explanation: "根据该品牌已记录的年月字段推算生产月份；日期范围不是厂商对单卡的官方确认。",
  });
}

function dateFromWeek(input: ParseInput, year: number | null, week: number, now: Date, confidence: GpuSnConfidence, confidenceScore: number): GpuSnDateResult {
  if (week < 1 || week > 53) return invalid(input, "生产周数无效；ISO 周数必须在 1 到 53 之间。" );
  if (year === null) {
    return resultFor(input, {
      status: "partial", week, confidence: "low", confidenceScore: 25,
      explanation: "已识别生产周字段，但年份世纪无法可靠确定，因此不生成日期范围。",
    });
  }
  const range = isoWeekRange(year, week, now);
  if (!range) return invalid(input, "该年份不存在这个 ISO 生产周，或对应生产周位于未来。请核对 SN 和显卡型号。" );
  return resultFor(input, {
    status: "parsed", year, week, dateRange: {start: range.start, end: range.end}, elapsedDays: range.elapsedDays,
    confidence, confidenceScore, explanation: "根据序列号中的年份和生产周按 ISO 周换算日期范围；这不是厂商对单卡的官方确认。",
  });
}

const ASUS_CUSTOM_YEAR_CODES: Record<string, number> = {N: 2018, P: 2019, Q: 2020, R: 2021, S: 2022, T: 2023, U: 2024, V: 2025, W: 2026};
const ASUS_LEGACY_YEAR_CODES: Record<string, number> = {H: 2017, J: 2018, K: 2019, L: 2020, M: 2021};
const COLORFUL_YEAR_CODES: Record<string, number> = {K: 2020, L: 2021, M: 2022, N: 2023, P: 2024, R: 2025, S: 2026};

function parseAsus(input: ParseInput, compact: string, now: Date): GpuSnDateResult {
  // This single SN is a separately observed exception on the reference site.
  if (compact === "MC12345678") {
    input.ruleId = "ASUS_REFERENCE_EXCEPTION";
    return dateFromMonth(input, 2022, 12, now, "low", 30);
  }

  const customYear = ASUS_CUSTOM_YEAR_CODES[compact[0]];
  if (customYear !== undefined) {
    input.ruleId = "ASUS_SN_CUSTOM";
    const month = monthFromCode(compact[1]);
    if (month === null) return invalid(input, "ASUS_SN_CUSTOM 第 2 位月份代码无效，应为 1–9 或 A–C。" );
    return dateFromMonth(input, customYear, month, now, "low", 48);
  }

  const legacyYear = ASUS_LEGACY_YEAR_CODES[compact[0]];
  if (legacyYear !== undefined) {
    input.ruleId = "ASUS_SN_LEGACY";
    const month = monthFromCode(compact[1]);
    if (month === null) return invalid(input, "ASUS 兼容年份码格式第 2 位月份代码无效，应为 1–9 或 A–C。" );
    return dateFromMonth(input, legacyYear, month, now, "low", 42);
  }

  // Keep the reference site's older numeric-first format: first digit is year,
  // sixth character is month (for example 9CC0AC186xxx -> 2009-12).
  if (/^\d/.test(compact) && compact.length >= 6) {
    input.ruleId = "ASUS_REFERENCE_NUMERIC";
    const month = monthFromCode(compact[5]);
    if (month === null) return invalid(input, "ASUS 旧数字格式第 6 位月份代码无效，应为 1–9 或 A–C。" );
    return dateFromMonth(input, 2000 + Number(compact[0]), month, now, "low", 32);
  }
  return pending(input, "该 ASUS 序列号不匹配已记录的新字母码或旧数字码格式；请通过官方入口核实。" );
}

function parseMsi(input: ParseInput, compact: string, now: Date): GpuSnDateResult {
  const match = compact.match(/S([BD])(\d{2})(\d{2})/);
  if (!match) {
    if (/S[BD]/.test(compact)) return invalid(input, "MSI 序列号中的日期字段应为 SBYYMM 或 SDYYMM。" );
    return pending(input, "未找到已知的 MSI SDYYMM 或官方历史 SBYYMM 日期字段。" );
  }
  const yearCode = match[2];
  const year = yearFromTwoDigits(yearCode, now);
  const month = Number(match[3]);
  if (month < 1 || month > 12) return invalid(input, "MSI 日期字段中的月份无效，月份必须在 01 到 12 之间。" );
  if (year === null && isFutureYearCode(yearCode, now)) return invalid(input, "MSI 日期字段指向未来年份，无法作为已生产显卡日期。" );
  if (year === null) return resultFor(input, {status: "partial", month, confidence: "low", confidenceScore: 25, explanation: "已识别 MSI 月份，但两位年份无法可靠确定；不猜测年份。"});
  return dateFromMonth(input, year, month, now, match[1] === "B" ? "medium" : "low", match[1] === "B" ? 72 : 48);
}

function parseWeekCapture(input: ParseInput, yearCode: string, weekCode: string, now: Date, brandName: string, confidence: GpuSnConfidence = "low"): GpuSnDateResult {
  const week = Number(weekCode);
  if (week < 1 || week > 53) return invalid(input, `${brandName} SN 中的生产周无效，周数必须在 01 到 53 之间。`);
  if (isFutureYearCode(yearCode, now)) return invalid(input, `${brandName} SN 日期字段指向未来年份。`);
  const year = yearFromTwoDigits(yearCode, now);
  return dateFromWeek(input, year, week, now, confidence, confidence === "medium" ? 65 : 45);
}

function parseGigabyte(input: ParseInput, compact: string, now: Date): GpuSnDateResult {
  const match = compact.match(/SN(\d{2})(\d{2})/) || compact.match(/^(\d{2})(\d{2})/);
  if (!match) return pending(input, "未找到技嘉已知的 SN+YYWW 或 YYWW 日期字段。" );
  return parseWeekCapture(input, match[1], match[2], now, "技嘉", "medium");
}

function parseColorful(input: ParseInput, compact: string, now: Date): GpuSnDateResult {
  if (compact.length < 7) return invalid(input, "七彩虹 SN 长度不足，无法读取第 6、7 位日期字段。" );
  const year = COLORFUL_YEAR_CODES[compact[5]];
  if (year === undefined) return pending(input, `七彩虹第 6 位年份码“${compact[5]}”不在已提供的 K/L/M/N/P/R/S 映射中，可能属于其他批次格式。`);
  const month = monthFromCode(compact[6]);
  if (month === null) return invalid(input, "七彩虹第 7 位月份代码无效，应为 1–9 或 A–C。" );
  return dateFromMonth(input, year, month, now, "low", 45);
}

function parseLegacyMonthBrand(input: ParseInput, compact: string, now: Date): GpuSnDateResult {
  const match = compact.match(/^(\d{2})([0-9A-Z])/);
  if (!match) return pending(input, "未匹配到该品牌已提供的前两位年份+第 3 位月份格式。" );
  const yearCode = match[1];
  if (isFutureYearCode(yearCode, now)) return invalid(input, "该序列号的年份字段指向未来。" );
  const month = monthFromCode(match[2]);
  if (month === null) return invalid(input, "月份代码无效，应为 1–9 或 A–C。" );
  return dateFromMonth(input, 2000 + Number(yearCode), month, now, "low", 45);
}

function parseWeekBrand(input: ParseInput, compact: string, now: Date, prefixPattern: RegExp, brandName: string): GpuSnDateResult {
  const match = compact.match(prefixPattern);
  if (!match) return pending(input, `未匹配到${brandName}已提供的生产周编码字段。`);
  return parseWeekCapture(input, match[1], match[2], now, brandName);
}

function parseMaxsun(input: ParseInput, compact: string, now: Date): GpuSnDateResult {
  return parseWeekBrand(input, compact, now, /S(\d{2})(\d{2})/, "铭瑄");
}

function parseSapphire(input: ParseInput, compact: string, now: Date): GpuSnDateResult {
  return parseWeekBrand(input, compact, now, /^[A-Z](\d{2})(\d{2})/, "蓝宝石");
}

function parseDataland(input: ParseInput, compact: string, now: Date): GpuSnDateResult {
  return parseWeekBrand(input, compact, now, /DLZ(\d{2})(\d{2})/, "迪兰");
}

function parseInno3d(input: ParseInput, normalized: string, now: Date): GpuSnDateResult {
  const matches = [...normalized.matchAll(/(?:^|[^0-9])(\d{2})(\d{2})(?=$|[^0-9])/g)];
  if (matches.length === 0) return pending(input, "未找到由非数字字符分隔的独立 YYMM 日期字段。" );
  if (matches.length > 1) return pending(input, "SN 中存在多个可能的 YYMM 数字段，无法确认哪一组是日期，未生成推算结果。" );
  const match = matches[0];
  const yearCode = match[1];
  const month = Number(match[2]);
  if (month < 1 || month > 12) return invalid(input, "INNO3D 独立 YYMM 字段中的月份无效，必须在 01 到 12 之间。" );
  if (isFutureYearCode(yearCode, now)) return invalid(input, "INNO3D YYMM 字段指向未来年份。" );
  return dateFromMonth(input, yearFromTwoDigits(yearCode, now), month, now, "low", 38);
}

function parsePowerColor(input: ParseInput, compact: string, now: Date): GpuSnDateResult {
  const match = compact.match(/^LG(\d{2})(\d{2})/);
  if (!match) return pending(input, "未匹配到撼讯已验证的 LG+YYMM 日期字段。" );
  const yearCode = match[1];
  const month = Number(match[2]);
  if (month < 1 || month > 12) return invalid(input, "PowerColor 日期字段中的月份无效。" );
  if (isFutureYearCode(yearCode, now)) return invalid(input, "PowerColor SN 日期字段指向未来年份。" );
  return dateFromMonth(input, yearFromTwoDigits(yearCode, now), month, now, "low", 45);
}

function parseUnknownBrand(input: ParseInput, compact: string): GpuSnDateResult {
  if (input.brandId === "manli" && compact.length !== 23) return invalid(input, "MANLI 该规则库只识别 23 位 SN；请核对是否录入完整序列号。" );
  const name = RULES_BY_BRAND[input.brandId].name;
  return pending(input, `${name} 品牌已识别，但当前规则库没有可验证的生产日期解码方式；请使用官方支持入口核实。`);
}

export function parseGpuSnDate(input: ParseInput, now = new Date()): GpuSnDateResult {
  const sn = normalizedSn(input.sn);
  const compact = snCompact(input.sn);
  const normalizedInput = {...input, sn};
  if (compact.length < 4 || !/^[A-Z0-9-]+$/.test(sn)) return invalid(normalizedInput, "SN 格式无效，请核对标签上的序列号并确认没有漏输字符。" );
  switch (input.brandId) {
    case "asus": return parseAsus(normalizedInput, compact, now);
    case "msi": return parseMsi(normalizedInput, compact, now);
    case "gigabyte": return parseGigabyte(normalizedInput, compact, now);
    case "colorful": return parseColorful(normalizedInput, compact, now);
    case "galax": return parseLegacyMonthBrand(normalizedInput, compact, now);
    case "gainward": return parseLegacyMonthBrand(normalizedInput, compact, now);
    case "maxsun": return parseMaxsun(normalizedInput, compact, now);
    case "sapphire": return parseSapphire(normalizedInput, compact, now);
    case "dataland": return parseDataland(normalizedInput, compact, now);
    case "inno3d": return parseInno3d(normalizedInput, sn, now);
    case "zotac": return parseWeekBrand(normalizedInput, compact, now, /^N(\d{2})(\d{2})/, "索泰");
    case "powercolor": return parsePowerColor(normalizedInput, compact, now);
    case "nvidia":
    case "xfx":
    case "manli":
    case "pny":
    case "evga":
    case "palit":
    case "leadtek":
    case "asl":
    case "onda": return parseUnknownBrand(normalizedInput, compact);
  }
}
