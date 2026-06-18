import React, { useState, useEffect } from "react";
import { Cpu, ShieldCheck, Battery, Activity, FileText, Check, AlertCircle, ShoppingBag, Send, ChevronRight, ArrowUpDown, Trash2, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";

interface PartItem {
  id: string;
  name: string;
  category: string;
  price: number;
  condition: string;
  specs: string;
  pinCode?: string;
  ramType?: string;
  wattage?: number;
  quantity?: number;
  status?: string;
}

interface BuildResults {
  totalPrice: number;
  totalWattageNeed: number;
  safetyWattageRecommended: number;
  warnings: string[];
  successes: string[];
  aiRating: string;
  aiRatingDesc: string;
}

export default function PcBuilderSection() {
  const [parts, setParts] = useState<PartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Parts IDs state
  const [selectedCpuId, setSelectedCpuId] = useState("");
  const [selectedGpuId, setSelectedGpuId] = useState("");
  const [selectedMbId, setSelectedMbId] = useState("");
  const [selectedRamId, setSelectedRamId] = useState("");
  const [selectedSsdId, setSelectedSsdId] = useState("");
  const [selectedPsuId, setSelectedPsuId] = useState("");
  const [selectedCoolerId, setSelectedCoolerId] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState("");

  // Build specifications results
  const [buildData, setBuildData] = useState<BuildResults | null>(null);
  const [calculating, setCalculating] = useState(false);

  // Contact quote form states
  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userWechat, setUserWechat] = useState("");
  
  const [quoteResponse, setQuoteResponse] = useState<{ quoteId: string; message: string } | null>(null);
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState("");

  // Fetch Parts catalog
  const fetchParts = async () => {
    try {
      const resp = await fetch("/api/pc-parts");
      const data = await resp.json();
      if (data.success) {
        setParts(data.parts);
      }
    } catch (err) {
      console.error("加载配件数据失败:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParts();
  }, []);

  // Recalculate build when selections modify
  useEffect(() => {
    if (loading) return;

    const calculateBuild = async () => {
      setCalculating(true);
      try {
        const resp = await fetch("/api/pc-builder/build", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cpuId: selectedCpuId || undefined,
            gpuId: selectedGpuId || undefined,
            mbId: selectedMbId || undefined,
            ramId: selectedRamId || undefined,
            ssdId: selectedSsdId || undefined,
            psuId: selectedPsuId || undefined,
            coolerId: selectedCoolerId || undefined,
            caseId: selectedCaseId || undefined
          })
        });
        const data = await resp.json();
        if (data.success) {
          setBuildData({
            totalPrice: data.totalPrice,
            totalWattageNeed: data.totalWattageNeed,
            safetyWattageRecommended: data.safetyWattageRecommended,
            warnings: data.warnings,
            successes: data.successes,
            aiRating: data.aiRating,
            aiRatingDesc: data.aiRatingDesc
          });
        }
      } catch (err) {
        console.error("计算整机账单参数出错:", err);
      } finally {
        setCalculating(false);
      }
    };

    calculateBuild();
  }, [
    selectedCpuId, 
    selectedGpuId, 
    selectedMbId, 
    selectedRamId, 
    selectedSsdId, 
    selectedPsuId, 
    selectedCoolerId, 
    selectedCaseId, 
    loading
  ]);

  // Submit Quote logic
  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userPhone) {
      setQuoteError("请填写联系姓名与有效的移动电话！");
      return;
    }
    setSubmittingQuote(true);
    setQuoteError("");
    try {
      const response = await fetch("/api/pc-builder/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buildData,
          userName,
          userPhone,
          userWechat
        })
      });
      const data = await response.json();
      if (data.success) {
        setQuoteResponse({
          quoteId: data.quoteId,
          message: data.message
        });
        // Reset selections
        handleClearAll();
      } else {
        setQuoteError(data.error || "提报装机方案失败，请稍后重试。");
      }
    } catch (err) {
      setQuoteError("提交失败，无法连接到装机服务端网关。");
    } finally {
      setSubmittingQuote(false);
    }
  };

  const handleClearAll = () => {
    setSelectedCpuId("");
    setSelectedGpuId("");
    setSelectedMbId("");
    setSelectedRamId("");
    setSelectedSsdId("");
    setSelectedPsuId("");
    setSelectedCoolerId("");
    setSelectedCaseId("");
  };

  const categories = [
    { key: "CPU", label: "核心处理器", state: selectedCpuId, callback: setSelectedCpuId },
    { key: "GPU", label: "图形显卡", state: selectedGpuId, callback: setSelectedGpuId },
    { key: "Motherboard", label: "适配主板", state: selectedMbId, callback: setSelectedMbId },
    { key: "RAM", label: "系统内存", state: selectedRamId, callback: setSelectedRamId },
    { key: "SSD", label: "固态硬盘", state: selectedSsdId, callback: setSelectedSsdId },
    { key: "PSU", label: "金牌电源", state: selectedPsuId, callback: setSelectedPsuId },
    { key: "Cooler", label: "散热组件", state: selectedCoolerId, callback: setSelectedCoolerId },
    { key: "Case", label: "科技机箱", state: selectedCaseId, callback: setSelectedCaseId }
  ];

  return (
    <section id="pc-builder" className="py-20 bg-slate-900 text-white relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />

      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-10 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Module Header Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 sm:mb-20">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 px-3.5 py-1.5 text-xs font-bold text-blue-400">
            <Cpu className="h-3.5 w-3.5 animate-spin" /> 在线智能选配装机系统
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            定制专属 AI 工作站与至强主机
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            实时比对物理库存，一键组合CPU、超大显卡显存算力、散热风道！智能后端搭载芯片匹配兼容逻辑检测，规避接口、内存插槽和瓦数安全隐忧。
          </p>
        </div>

        {/* Builder Interactive Main Frame */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left selectors Panel */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">
                自主组装定制硬件选配
              </span>
              <button
                onClick={handleClearAll}
                className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 border border-slate-700/60 bg-slate-800/40 px-2.5 py-1 rounded-lg transition cursor-pointer"
              >
                <Trash2 className="h-3 w-3" /> 重置所有
              </button>
            </div>

            <div className="space-y-4">
              {categories.map((cat, index) => {
                const categoryParts = parts.filter(p => p.category === cat.key);
                return (
                  <div key={index} className="bg-slate-950/65 rounded-2xl border border-slate-800/80 p-4 shadow-sm relative group hover:border-slate-700/60 transition">
                    <label className="block text-xs font-bold text-slate-300 mb-2 font-mono">
                      {cat.label}
                    </label>

                    <div className="flex gap-3">
                      <select
                        value={cat.state}
                        onChange={(e) => cat.callback(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2.5 text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">-- 点击选择 {cat.key} 型号 --</option>
                        {categoryParts.map(part => {
                          const qty = part.quantity ?? 0;
                          const stockText = qty <= 0 
                            ? "缺货" 
                            : qty <= 3 
                              ? `仅剩 ${qty} 件` 
                              : `在库充足`;
                          return (
                            <option key={part.id} value={part.id}>
                              {part.name} - ({part.condition}) | ¥{part.price.toLocaleString()} ({stockText})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Show quick selected part characteristics */}
                    {cat.state && (() => {
                      const selectedPart = parts.find(p => p.id === cat.state);
                      if (!selectedPart) return null;
                      const isOutOfStock = (selectedPart.quantity ?? 0) <= 0;
                      const isLowStock = (selectedPart.quantity ?? 0) > 0 && (selectedPart.quantity ?? 0) <= 3;
                      return (
                        <div className="mt-2 text-[10.5px] p-2 bg-slate-900/40 rounded-lg border border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-slate-400 font-sans text-left">
                            <strong>在库规格:</strong> {selectedPart.specs}
                          </span>
                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            {isOutOfStock ? (
                              <span className="text-[10px] bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold px-2 py-0.5 rounded-md shrink-0">
                                暂时缺货
                              </span>
                            ) : isLowStock ? (
                              <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded-md shrink-0">
                                货源紧张 (剩{selectedPart.quantity}件)
                              </span>
                            ) : (
                              <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-md shrink-0">
                                现货 (在库 {selectedPart.quantity} 件)
                              </span>
                            )}
                            <span className="text-slate-200 font-mono font-bold">
                              ¥{selectedPart.price.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Parameters summary Panel */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Visual Budget & parameters gauge card */}
            <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-3xl border border-slate-850 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-blue-500/5 blur-3xl" />
              
              <div className="space-y-6 relative z-15">
                <span className="text-[10px] tracking-widest text-blue-400 uppercase font-black block">
                  整机实时分析与功耗对齐诊断看板
                </span>

                {/* Big Price Tag */}
                <div className="space-y-1">
                  <span className="text-slate-400 text-xs block">整机预算估价</span>
                  <div className="flex items-baseline gap-1 animate-pulse-slow">
                    <span className="text-xl font-bold text-gray-200 font-sans">¥</span>
                    <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                      {buildData ? buildData.totalPrice.toLocaleString() : "0"}
                    </span>
                    <span className="text-[11px] text-slate-400 ml-1.5 font-normal">
                      元 (含装工理线)
                    </span>
                  </div>
                </div>

                {/* Wattage Calculation Bar */}
                {buildData && buildData.totalWattageNeed > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-850">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Battery className="h-4 w-4 text-blue-400" /> 整机满载预估功耗
                      </span>
                      <span className="font-mono text-white font-bold">
                        {buildData.totalWattageNeed} W
                      </span>
                    </div>
                    {/* Safety margin bar metric */}
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, (buildData.totalWattageNeed / 1200) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 block text-right font-mono">
                      (安全推荐搭配电源功率: {buildData.safetyWattageRecommended}W 以上)
                    </span>
                  </div>
                )}

                {/* AI Workstation rating criteria */}
                {buildData && (
                  <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                      <span className="text-xs font-black text-blue-300 uppercase">
                        AI算力性能级别: {buildData.aiRating}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-400 leading-relaxed font-sans">
                      {buildData.aiRatingDesc}
                    </p>
                  </div>
                )}

                {/* Intel compatibility engine output diagnostics */}
                <div className="space-y-3 pt-2 border-t border-slate-850">
                  <span className="text-[10px] text-slate-400 uppercase font-black block">
                    设备接口及核心电压规格自检诊断系统
                  </span>

                  {calculating ? (
                    <span className="text-[10px] font-mono text-slate-400 block animate-pulse">正在交叉比对各物理插拔引脚针脚...</span>
                  ) : buildData && (buildData.warnings.length > 0 || buildData.successes.length > 0) ? (
                    <div className="space-y-2 font-sans">
                      {buildData.warnings.map((warn, wIdx) => (
                        <div key={wIdx} className="flex gap-2 text-xs font-semibold text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                          <span>{warn}</span>
                        </div>
                      ))}
                      {buildData.successes.map((succ, sIdx) => (
                        <div key={sIdx} className="flex gap-2 text-[11px] font-medium text-blue-300 bg-blue-500/5 p-2 rounded-xl">
                          <Check className="h-4 w-4 text-blue-400 shrink-0" />
                          <span>{succ}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs italic block">请在左侧自选相应CPU、显卡和主板，即可开启接口及额定功耗自动检测。</span>
                  )}
                </div>
              </div>

            </div>

            {/* Custom submit Quotation Form */}
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-850 text-slate-300 space-y-4">
              <span className="text-xs font-bold text-gray-200 block border-b border-slate-850 pb-2">
                📦 提交定制方案至仓库获取报价 / 上门
              </span>

              {quoteResponse ? (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 space-y-3 font-sans">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 mx-auto">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div className="text-center space-y-1">
                    <span className="text-xs font-bold text-white block">方案提交成功！单号：{quoteResponse.quoteId}</span>
                    <p className="text-[11px] text-slate-300 leading-normal">{quoteResponse.message}</p>
                  </div>
                  <button
                    onClick={() => setQuoteResponse(null)}
                    className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 py-1.5 rounded-xl font-bold text-xs text-white transition animate-pulse"
                  >
                    再配置一套
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitQuote} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">联系人姓名 *</label>
                      <input
                        type="text"
                        required
                        placeholder="张老师"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 font-sans"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">移动端手机 *</label>
                      <input
                        type="tel"
                        required
                        placeholder="183xxxx5544"
                        value={userPhone}
                        onChange={(e) => setUserPhone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 font-sans"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">微信号 (优先极速秒回加好友报价)</label>
                    <input
                      type="text"
                      placeholder="CD-GPU-No1"
                      value={userWechat}
                      onChange={(e) => setUserWechat(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 font-sans"
                    />
                  </div>

                  {quoteError && (
                    <span className="text-[11px] text-rose-400 font-medium block text-center bg-rose-500/10 p-2 rounded-lg">{quoteError}</span>
                  )}

                  <button
                    type="submit"
                    disabled={submittingQuote || !selectedCpuId || !selectedGpuId}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-3 font-bold text-xs shadow-lg transition active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                    {!selectedCpuId || !selectedGpuId ? "请先自选CPU与算力显卡" : submittingQuote ? "正在提报整机至一号仓库..." : "确定方案 · 提交一键报价"}
                  </button>
                </form>
              )}
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
