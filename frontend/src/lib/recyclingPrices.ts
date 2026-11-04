import type { GpuPrice } from '../types';

export const RECYCLING_SERIES = [
  { value: 'all', label: '全部' },
  { value: 'rtx50', label: 'RTX 50系' },
  { value: 'rtx40', label: 'RTX 40系' },
  { value: 'rtx30', label: 'RTX 30系' },
  { value: 'other', label: '其他系列' },
  { value: 'professional', label: '专业卡' },
] as const;
export type RecyclingSeries = typeof RECYCLING_SERIES[number]['value'];

export function recyclingModelName(name: string): string {
  return name.replace(/^NVIDIA\s+/i, '').replace(/\bRTX(?=\d)/gi, 'RTX ')
    .replace(/(\d)(Ti|SUPER|D)(?=\b|V2)/gi, '$1 $2').replace(/D\s*V2/gi, 'D V2').trim();
}

export function recyclingSeries(gpu: GpuPrice): RecyclingSeries {
  const name = gpu.name.toUpperCase().replace(/\s+/g, '');
  if (gpu.category === 'ai' || /QUADRO|TESLA|RTXA\d|RTXPRO|RTX\d{4}ADA|RTXADA\d|PRO\d{4}/.test(name)) return 'professional';
  if (/RTX50\d{2}/.test(name)) return 'rtx50';
  if (/RTX40\d{2}/.test(name)) return 'rtx40';
  if (/RTX30\d{2}/.test(name)) return 'rtx30';
  return 'other';
}

// Ignore spacing and punctuation, but preserve every model and memory suffix.
export function normalizeRecyclingSearch(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9\u4e00-\u9fff]/g, '');
}

export function recyclingVram(value: string): string | null {
  return /\d+(?:\.\d+)?\s*(?:GB|G|TB)\b/i.test(value) ? value.trim() : null;
}

export function filterRecyclingPrices(prices: GpuPrice[], series: RecyclingSeries, search: string): GpuPrice[] {
  const query = normalizeRecyclingSearch(search);
  return prices.filter(gpu => (series === 'all' || recyclingSeries(gpu) === series)
    && normalizeRecyclingSearch(`${gpu.name} ${recyclingVram(gpu.specs.vram) ?? ''}`).includes(query))
    .sort((a, b) => RECYCLING_SERIES.findIndex(item => item.value === recyclingSeries(a))
      - RECYCLING_SERIES.findIndex(item => item.value === recyclingSeries(b))
      || recyclingModelName(b.name).localeCompare(recyclingModelName(a.name), 'zh-CN', { numeric: true }));
}

export function recyclingColumnTitle(prices: GpuPrice[]): string {
  const labels = [...new Set(prices.map(gpu => RECYCLING_SERIES.find(item => item.value === recyclingSeries(gpu))!.label))];
  return labels.length > 2 ? `${labels.slice(0, 2).join(' / ')}等` : labels.join(' / ');
}
