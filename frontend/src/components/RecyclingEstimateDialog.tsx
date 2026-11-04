import { useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { MessageSquare, X } from 'lucide-react';
import type { GpuPrice } from '../types';
import { BRAND_OPTIONS, CONDITION_OPTIONS, estimatePayout, formatYuan, type BrandTier, type Condition } from '../lib/pricing';
import { recyclingModelName } from '../lib/recyclingPrices';
import { Button } from './ui/controls';

export default function RecyclingEstimateDialog({ model, gpu, onClose, onOpenContact }: {
  model: string;
  gpu?: GpuPrice;
  onClose: () => void;
  onOpenContact: () => void;
}) {
  const [condition, setCondition] = useState<Condition>('perfect');
  const [brand, setBrand] = useState<BrandTier>('mid');
  const estimate = estimatePayout(gpu, condition, brand);

  return <Dialog.Root open onOpenChange={open => { if (!open) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-50 bg-slate-950/30" />
      <Dialog.Viewport className="fixed inset-0 z-50 flex items-end justify-center sm:items-stretch sm:justify-end">
        <Dialog.Popup className="relative max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-t-lg border border-slate-200 bg-white p-5 shadow-xl outline-none sm:max-h-dvh sm:max-w-md sm:rounded-none sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Dialog.Title className="text-lg font-semibold text-slate-950">{recyclingModelName(model)} 回收估价</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm leading-6 text-slate-500">按门店回收参考价计算，最终按检测结果确认。</Dialog.Description>
            </div>
            <Dialog.Close render={<Button size="icon" variant="ghost" aria-label="关闭回收估价" title="关闭"><X className="h-5 w-5" /></Button>} />
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-700">成色</legend>
            <div className="grid grid-cols-2 gap-2">{CONDITION_OPTIONS.map(option => <Button key={option.value} variant="choice" aria-pressed={condition === option.value} onClick={() => setCondition(option.value)} className="min-h-16! flex-col items-start! gap-1! px-3! text-left!">
              <span className="text-sm font-medium">{option.label}</span><span className="text-xs leading-5 text-slate-500">{option.hint.split(' · ').map((part, index) => <span key={part} className="inline-block">{index > 0 ? ' · ' : ''}{part}</span>)}</span>
            </Button>)}</div>
          </fieldset>
          <fieldset className="mt-5">
            <legend className="mb-2 text-sm font-medium text-slate-700">品牌档次</legend>
            <div className="grid grid-cols-3 gap-2">{BRAND_OPTIONS.map(option => <Button key={option.value} variant="choice" aria-pressed={brand === option.value} onClick={() => setBrand(option.value)} title={option.hint} className="min-h-16! flex-col gap-1! px-2!">
              <span className="text-sm font-medium">{option.label}</span><span className="text-[11px] leading-4 text-slate-500">{option.hint}</span>
            </Button>)}</div>
          </fieldset>
          <div className="mt-6 border-y border-slate-200 py-5" aria-live="polite">
            <p className="text-sm text-slate-600">预估回收价</p>
            <p className="mt-2 break-words text-3xl font-bold tabular-nums text-slate-950">{estimate !== null ? <><span className="mr-1 text-base font-normal text-slate-500">约</span>{formatYuan(estimate)}</> : '微信询价'}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">{estimate !== null ? '此为估算金额，实际回收价需结合品牌、成色、保修与当面检测确认。' : '当前型号暂无有效参考报价，请微信确认。'}</p>
          </div>
          <Button variant="primary" onClick={onOpenContact} className="mt-5 w-full"><MessageSquare className="h-4 w-4" />微信确认估价</Button>
        </Dialog.Popup>
      </Dialog.Viewport>
    </Dialog.Portal>
  </Dialog.Root>;
}
