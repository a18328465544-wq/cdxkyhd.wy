import React, { useState, useMemo, useEffect } from 'react';
import { Search, TrendingDown, TrendingUp, Minus, HelpCircle, AlertCircle, Sparkles, MessageSquare, Calculator } from 'lucide-react';
import { GPU_PRICES_DATA } from '../data';
import { GpuPrice } from '../types';

interface PriceSectionProps {
  onOpenContact: () => void;
}

export default function PriceSection({ onOpenContact }: PriceSectionProps) {
  const [gpuPrices, setGpuPrices] = useState<GpuPrice[]>(GPU_PRICES_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'gaming' | 'ai'>('all');

  // Fetch real-time market pricing from Express ERP endpoints
  useEffect(() => {
    fetch('/api/prices')
      .then((res) => res.json())
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
    <section
      id="pricing"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 border-b border-slate-100"
    >
      
      {/* Title Header Section */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 sm:mb-16">
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full inline-block">
          Market Quotes · 价格公开透明
        </span>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight sm:text-4xl">
          今日显卡回收参考价
        </h2>
        <p className="text-base sm:text-lg text-gray-500 leading-relaxed">
          行情每天都在变，以下价格为成都实体店今日参考出价。价格更透明，实际交易价格以显卡具体品牌、成色、保修与当面烤机测试结果为准。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Column: List Of Gpu Price reference */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs">
            
            {/* Category selection */}
            <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 shrink-0">
              <button
                onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  activeCategory === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-gray-600 hover:bg-slate-50'
                }`}
              >
                全部大类
              </button>
              <button
                onClick={() => { setActiveCategory('gaming'); setSearchQuery(''); }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  activeCategory === 'gaming'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-gray-600 hover:bg-slate-50'
                }`}
              >
                游戏娱乐卡
              </button>
              <button
                onClick={() => { setActiveCategory('ai'); setSearchQuery(''); }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  activeCategory === 'ai'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-gray-600 hover:bg-slate-50'
                }`}
              >
                AI计算卡
              </button>
            </div>

            {/* Quick search input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索 RTX 4090, A6000..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 bg-slate-50/50"
              />
            </div>

          </div>

          {/* GPU references lists layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredPrices.length > 0 ? (
              filteredPrices.map((gpu, idx) => (
                <div
                  key={idx}
                  className={`bg-white rounded-2xl p-5 border shadow-xs transition-transform duration-300 hover:scale-101 flex flex-col justify-between ${
                    gpu.popular ? 'border-blue-500/40 ring-1 ring-blue-500/10' : 'border-slate-100'
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
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 py-1 px-2 bg-slate-50 rounded-lg text-[10px] font-mono text-gray-500">
                      <div>显存: {gpu.specs.vram}</div>
                      <div>功耗: {gpu.specs.tdp}</div>
                    </div>
                  </div>

                  {/* Pricing footer container */}
                  <div className="flex items-baseline justify-between mt-4 pt-3 border-t border-gray-100">
                    <span className="text-xs text-slate-400 font-semibold">今日最高回购价</span>
                    <span className="text-xl font-black text-rose-600 font-mono tracking-tight">
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

          <div className="flex items-start gap-2 rounded-xl bg-orange-50/70 p-3 text-xs text-orange-700 border border-orange-100/50">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-orange-500" />
            <div>
              <strong>温馨提示：</strong>
              若由于不可抗力造成国内外算力限制政策突变，显卡市场往往产生日内波动。请尽快联系微信锁定当前极佳回报价！
            </div>
          </div>

        </div>

        {/* Right Column: Mini Interactive Estimator Panel */}
        <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          
          {/* Aesthetic graphics overlays */}
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-blue-500/5 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-indigo-500/5 blur-2xl" />

          <div className="relative space-y-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <Calculator className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white tracking-tight">显卡估价自助计算器</h3>
                <p className="text-[10px] text-gray-400">输入真实配置及细节，即时预览折旧回收价</p>
              </div>
            </div>

            {/* Selector model */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300 block">
                选择你的显卡型号
              </label>
              <select
                value={selectedGpuName}
                onChange={(e) => setSelectedGpuName(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                {gpuPrices.map((gpu, i) => (
                  <option key={i} value={gpu.name} className="bg-slate-950">
                    {gpu.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector condition */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300 block">
                显卡目前成色
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCondition('perfect')}
                  className={`px-3 py-2 text-[10px] sm:text-xs font-bold rounded-xl border text-center transition-all ${
                    condition === 'perfect'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                      : 'border-slate-800 bg-slate-900/40 text-gray-400 hover:bg-slate-800/50'
                  }`}
                >
                  国行在保 / 盒说无拆微尘
                </button>
                <button
                  onClick={() => setCondition('good')}
                  className={`px-3 py-2 text-[10px] sm:text-xs font-bold rounded-xl border text-center transition-all ${
                    condition === 'good'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                      : 'border-slate-800 bg-slate-900/40 text-gray-400 hover:bg-slate-800/50'
                  }`}
                >
                  无拆无修过保 / 仅微尘
                </button>
                <button
                  onClick={() => setCondition('average')}
                  className={`px-3 py-2 text-[10px] sm:text-xs font-bold rounded-xl border text-center transition-all ${
                    condition === 'average'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                      : 'border-slate-800 bg-slate-900/40 text-gray-400 hover:bg-slate-800/50'
                  }`}
                >
                  正常使用 / 轻微氧化红标
                </button>
                <button
                  onClick={() => setCondition('poor')}
                  className={`px-3 py-2 text-[10px] sm:text-xs font-bold rounded-xl border text-center transition-all ${
                    condition === 'poor'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                      : 'border-slate-800 bg-slate-900/40 text-gray-400 hover:bg-slate-800/50'
                  }`}
                >
                  微板弯 / 有拆修 / 核心偏暗
                </button>
              </div>
            </div>

            {/* Brand tier */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300 block">
                显卡品牌档次
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'high', label: '华硕ROG / 顶级旗舰' },
                  { key: 'mid', label: '七彩虹 / 影驰 / 主流' },
                  { key: 'basic', label: '丐版双扇 / 杂牌 / 拆机卡' }
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setBrandTier(item.key as any)}
                    className={`p-2 text-[9px] sm:text-[10px] font-bold rounded-lg border text-center transition-all ${
                      brandTier === item.key
                        ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                        : 'border-slate-800 bg-slate-900/40 text-gray-400 hover:bg-slate-800/50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Calculated box result */}
            <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800 text-center space-y-1">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-semibold">
                智能估算出价范围
              </span>
              <div className="text-2xl sm:text-3xl font-black text-rose-500 font-mono tracking-tight py-2 animate-pulse-slow">
                {estimatedValue}
              </div>
              <span className="text-[9px] text-gray-500 block leading-normal">
                说明：此报价根据成都武侯实体店行情库生成，若无大出入即为实拿价。
              </span>
            </div>

            {/* Quick action WeChat */}
            <button
              id="calculator-wechat-btn"
              onClick={onOpenContact}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 px-4 shadow-lg transition active:scale-98 cursor-pointer"
            >
              <MessageSquare className="h-4 w-4" />
              一键联系客服估价
            </button>

          </div>
        </div>

      </div>

    </section>
  );
}
