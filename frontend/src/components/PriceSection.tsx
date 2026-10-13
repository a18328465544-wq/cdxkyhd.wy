import React, { useState, useMemo, useEffect } from 'react';
import { TrendingDown, TrendingUp, Minus, HelpCircle, AlertCircle, Sparkles, MessageSquare, Calculator } from 'lucide-react';
import { GPU_PRICES_DATA } from '../data';
import { GpuPrice } from '../types';
import { apiFetch } from '../lib/api';
import { Button, SearchInput, SegmentedControl, Select } from './ui/controls';

interface PriceSectionProps {
  onOpenContact: () => void;
}

export default function PriceSection({ onOpenContact }: PriceSectionProps) {
  const [gpuPrices, setGpuPrices] = useState<GpuPrice[]>(GPU_PRICES_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'gaming' | 'ai'>('all');

  // Fetch real-time market pricing from Express ERP endpoints
  useEffect(() => {
    apiFetch<{ success: boolean; prices: GpuPrice[] }>('/api/prices')
      .then((data) => {
        if (data && data.success && Array.isArray(data.prices)) {
          setGpuPrices(data.prices);
        }
      })
      .catch((err) => {
        console.warn('API /api/prices is loading or offline, defaulting to static cache:', err);
      });
  }, []);

  // Interactive Estimator state codes
  const [selectedGpuName, setSelectedGpuName] = useState(GPU_PRICES_DATA[1].name); // RTX 4090 as default
  const [condition, setCondition] = useState<'perfect' | 'good' | 'average' | 'poor'>('perfect');
  const [brandTier, setBrandTier] = useState<'high' | 'mid' | 'basic'>('mid');

  // Filter prices data based on search and selected category
  const filteredPrices = useMemo(() => {
    return gpuPrices.filter((gpu) => {
      const matchesSearch = gpu.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategory === 'all' ||
        (activeCategory === 'gaming' && (gpu.category === 'gaming' || gpu.category === 'both')) ||
        (activeCategory === 'ai' && (gpu.category === 'ai' || gpu.category === 'both'));
      return matchesSearch && matchesCategory;
    });
  }, [gpuPrices, searchQuery, activeCategory]);

  // Dynamic estimate calculator logic
  const estimatedValue = useMemo(() => {
    const matchedGpu = gpuPrices.find((g) => g.name === selectedGpuName);
    if (!matchedGpu) return '微信详询';

    // Extract core base price. Replace 'x' with '0' to handle both 'xxx' and 'xx' prefixes seamlessly (e.g., "82xx" -> 8200)
    let basePriceNum = 0;
    const baseStr = matchedGpu.basePrice;
    
    const cleanStr = baseStr.toLowerCase().replace(/x/g, '0');
    basePriceNum = parseFloat(cleanStr);

    if (isNaN(basePriceNum)) return '微信详询';

    // Condition multiplier
    let conditionMultiplier = 1.0;
    if (condition === 'good') conditionMultiplier = 0.95;
    if (condition === 'average') conditionMultiplier = 0.88;
    if (condition === 'poor') conditionMultiplier = 0.78;

    // Brand premium adder
    let brandPremium = 0;
    if (brandTier === 'high') brandPremium = 250;
    if (brandTier === 'mid') brandPremium = 100;
    if (brandTier === 'basic') brandPremium = -150;

    const rawCalculated = Math.round(basePriceNum * conditionMultiplier + brandPremium);
    
    // Safety check limit
    if (rawCalculated < 100) return '微信详询';

    // Return with a formatted look
    return `约 ${rawCalculated.toLocaleString()} 元`;
  }, [gpuPrices, selectedGpuName, condition, brandTier]);

  return (
    <section className="mx-auto max-w-7xl border-b border-slate-200 px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      
      {/* Title Header Section */}
      <div className="mx-auto mb-9 max-w-3xl space-y-3 text-center sm:mb-11">
        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full inline-block">
          价格公开透明
        </span>
        <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
          今日显卡回收参考价
        </h2>
        <p className="text-sm leading-6 text-slate-600 sm:text-base">
          行情每天都在变，以下价格为成都实体店今日参考出价。价格更透明，实际交易价格以显卡具体品牌、成色、保修与当面烤机测试结果为准。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Column: List Of Gpu Price reference */}
        <div className="space-y-5 lg:col-span-7">
          <div className="flex flex-col items-center justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row">
            
            {/* Category selection */}
            <SegmentedControl
              label="显卡类型"
              className="w-full sm:w-auto"
              options={[{ value: 'all', label: '全部大类' }, { value: 'gaming', label: '游戏娱乐卡' }, { value: 'ai', label: 'AI计算卡' }]}
              value={activeCategory}
              onChange={value => { setActiveCategory(value); setSearchQuery(''); }}
            />

            {/* Quick search input */}
            <div className="w-full sm:w-64">
              <SearchInput
                aria-label="搜索显卡行情"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索 RTX 4090, A6000..."
              />
            </div>

          </div>

          {/* GPU references lists layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredPrices.length > 0 ? (
              filteredPrices.map((gpu, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col justify-between rounded-lg border bg-white p-4 transition-colors duration-200 hover:border-blue-300 ${
                    gpu.popular ? 'border-blue-300' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      {gpu.category === 'ai' ? (
                        <span className="rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 border border-indigo-100">
                          AI计算卡
                        </span>
                      ) : gpu.category === 'gaming' ? (
                        <span className="rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 border border-blue-100">
                          游戏显卡
                        </span>
                      ) : (
                        <span className="rounded-md bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 border border-slate-200">
                          双栖旗舰
                        </span>
                      )}

                      {/* Status indicator trend */}
                      <span className="flex items-center gap-0.5 text-[10px] font-medium text-gray-400">
                        {gpu.trend === 'up' ? (
                          <span className="flex items-center text-emerald-600">
                            <TrendingUp className="h-3 w-3 mr-0.5" /> 上浮
                          </span>
                        ) : gpu.trend === 'down' ? (
                          <span className="flex items-center text-rose-500">
                            <TrendingDown className="h-3 w-3 mr-0.5" /> 下行
                          </span>
                        ) : (
                          <span className="flex items-center text-slate-500">
                            <Minus className="h-3 w-3 mr-0.5" /> 稳定
                          </span>
                        )}
                      </span>
                    </div>

                    <h3 className="font-bold text-gray-900 text-sm tracking-tight sm:text-base">
                      {gpu.name}
                    </h3>

                    {/* Specifications parameters detail */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 rounded bg-slate-50 px-2.5 py-2 text-xs text-slate-600">
                      <div>显存: {gpu.specs.vram}</div>
                      <div>功耗: {gpu.specs.tdp}</div>
                    </div>
                  </div>

                  {/* Pricing footer container */}
                  <div className="flex items-baseline justify-between mt-4 pt-3 border-t border-gray-100">
                    <span className="text-xs font-medium text-slate-500">今日参考回收价</span>
                    <span className="text-xl font-bold tabular-nums text-slate-950">
                      {gpu.basePrice.includes('xxx') ? (
                        <>
                          <span className="text-xs">¥</span> {gpu.basePrice.replace('xxx', '')}
                          <span className="text-xs font-semibold text-rose-500/80">xxx 起</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xs">¥</span> {parseFloat(gpu.basePrice).toLocaleString()}
                        </>
                      )}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-slate-50 rounded-2xl py-12 text-center text-gray-400 text-xs">
                没有找到匹配的显卡种类。您可以一键微信直接详询最新机型回购。
              </div>
            )}
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <div>
              <strong>温馨提示：</strong>
              若由于不可抗力造成国内外算力限制政策突变，显卡市场往往产生日内波动。请尽快联系微信锁定当前极佳回报价！
            </div>
          </div>

        </div>

        {/* Right Column: Mini Interactive Estimator Panel */}
        <div className="h-fit rounded-lg border border-slate-200 bg-white p-5 sm:p-6 lg:col-span-5">
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
                <Calculator className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-950">显卡估价参考</h3>
                <p className="mt-1 text-xs text-slate-500">根据型号和成色查看参考区间</p>
              </div>
            </div>

            {/* Selector model */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                选择你的显卡型号
              </label>
              <Select
                value={selectedGpuName}
                onValueChange={setSelectedGpuName}
                options={gpuPrices.map(gpu => ({ value: gpu.name, label: gpu.name }))}
                aria-label="选择显卡型号"
              />
            </div>

            {/* Selector condition */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                显卡目前成色
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setCondition('perfect')}
                  variant="choice"
                  aria-pressed={condition === 'perfect'}
                  className="min-h-12 px-2 py-2 text-xs"
                >
                  国行在保 / 盒说无拆微尘
                </Button>
                <Button
                  onClick={() => setCondition('good')}
                  variant="choice"
                  aria-pressed={condition === 'good'}
                  className="min-h-12 px-2 py-2 text-xs"
                >
                  无拆无修过保 / 仅微尘
                </Button>
                <Button
                  onClick={() => setCondition('average')}
                  variant="choice"
                  aria-pressed={condition === 'average'}
                  className="min-h-12 px-2 py-2 text-xs"
                >
                  正常使用 / 轻微氧化红标
                </Button>
                <Button
                  onClick={() => setCondition('poor')}
                  variant="choice"
                  aria-pressed={condition === 'poor'}
                  className="min-h-12 px-2 py-2 text-xs"
                >
                  微板弯 / 有拆修 / 核心偏暗
                </Button>
              </div>
            </div>

            {/* Brand tier */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                显卡品牌档次
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'high', label: '华硕ROG / 顶级旗舰' },
                  { key: 'mid', label: '七彩虹 / 影驰 / 主流' },
                  { key: 'basic', label: '丐版双扇 / 杂牌 / 拆机卡' }
                ].map((item, i) => (
                  <Button
                    key={i}
                    onClick={() => setBrandTier(item.key as any)}
                    variant="choice"
                    aria-pressed={brandTier === item.key}
                    className="min-h-12 px-2 py-2 text-xs"
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Calculated box result */}
            <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
              <span className="block text-xs font-medium text-slate-500">
                智能估算出价范围
              </span>
              <div className="py-2 text-2xl font-bold tabular-nums text-emerald-700 sm:text-3xl">
                {estimatedValue}
              </div>
              <span className="block text-xs leading-5 text-slate-500">
                说明：此报价根据成都武侯实体店行情库生成，若无大出入即为实拿价。
              </span>
            </div>

            {/* Quick action WeChat */}
            <Button
              id="calculator-wechat-btn"
              onClick={onOpenContact}
              variant="primary"
              size="lg"
              className="w-full"
            >
              <MessageSquare className="h-4 w-4" />
              一键联系客服估价
            </Button>

          </div>
        </div>

      </div>

    </section>
  );
}
