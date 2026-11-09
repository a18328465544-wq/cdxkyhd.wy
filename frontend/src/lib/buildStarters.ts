import type { PartSearchItem } from "./partSearch";

export interface StarterPart extends PartSearchItem {
  category: string;
  status?: string;
}

export const BUILD_STARTERS = [
  { id: "gaming", title: "游戏装机", description: "主流游戏 · 1080p / 2K" },
  { id: "productivity", title: "生产力", description: "剪辑 · 设计 · 渲染" },
  { id: "ai", title: "本地 AI", description: "本地推理 · AI 绘图" },
] as const;

export type BuildStarterId = typeof BUILD_STARTERS[number]["id"];

const CPU_PREFERENCES: Record<BuildStarterId, RegExp[]> = {
  gaming: [/\b(?:9800|7800|7600)X3D\b/i, /\b(?:14600|13600)(?:K|KF)?\b/i, /\b(?:12400|13400)(?:F)?\b/i],
  productivity: [/\b(?:14900|13900|14700|13700)(?:K|KF)?\b/i, /\b(?:9950|7950|9900|7900)X?\b/i, /\b(?:14600|13600)(?:K|KF)?\b/i],
  ai: [/\b(?:14600|13600)(?:K|KF)?\b/i, /\b(?:14700|13700|12900)(?:K|KF)?\b/i, /\b(?:7900|7950)X?\b/i],
};
const GPU_PREFERENCES: Record<BuildStarterId, RegExp[]> = {
  gaming: [/RTX\s*5060\b(?!\s*Ti)/i, /RTX\s*4060\b(?!\s*Ti)/i, /RTX\s*3060\s*Ti\b/i, /RTX\s*3060\b/i],
  productivity: [/RTX\s*5070\s*Ti\b/i, /RTX\s*4070\s*Ti\b/i, /RTX\s*4080\b/i, /RTX\s*3090\b(?!\s*Ti)/i],
  ai: [/RTX\s*3090\b(?!\s*Ti)/i, /RTX\s*4090\b/i, /RTX\s*5090\b/i, /RTX\s*A6000\b/i],
};

function choosePart<T extends StarterPart>(parts: T[], category: string, preferences: RegExp[]) {
  const available = parts.filter(part => part.category === category && (part.quantity ?? 0) > 0 && (!part.status || ["已入库", "已上架"].includes(part.status)) && Number.isFinite(part.price) && part.price > 0);
  for (const preference of preferences) {
    const candidates = available.filter(part => preference.test(part.name));
    candidates.sort((a, b) => a.price - b.price || a.id.localeCompare(b.id));
    if (candidates[0]) return candidates[0];
  }
  return undefined;
}

// Seed only the core pair. Unknown sockets, RAM generations and chassis clearance
// must not turn into an automatically "compatible" eight-part build.
export function resolveBuildStarter<T extends StarterPart>(parts: T[], id: BuildStarterId) {
  const cpu = choosePart(parts, "CPU", CPU_PREFERENCES[id]);
  const gpu = choosePart(parts, "GPU", GPU_PREFERENCES[id]);
  return { cpu, gpu, available: Boolean(cpu && gpu) };
}
