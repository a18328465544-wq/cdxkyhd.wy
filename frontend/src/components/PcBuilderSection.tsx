import React, { useState, useEffect } from "react";
import { Cpu, Battery, Check, AlertCircle, Send, Trash2, CheckCircle2 } from "lucide-react";
import { apiFetch } from "../lib/api";
import { type PartSearchItem } from "../lib/partSearch";
import SearchablePartSelect from "./SearchablePartSelect";
import { Button, Input } from "./ui/controls";
import SectionHeader from "./ui/SectionHeader";

interface PartItem extends PartSearchItem {
  category: string;
  pinCode?: string;
  ramType?: string;
  wattage?: number;
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
      const data = await apiFetch<{ success: boolean; parts: PartItem[] }>("/api/pc-parts");
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
        const data = await apiFetch<BuildResults & { success: boolean }>("/api/pc-builder/build", {
          method: "POST",
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
      const data = await apiFetch<{ success: boolean; quoteId: string; message: string; error?: string }>("/api/pc-builder/quote", {
        method: "POST",
        body: JSON.stringify({
          buildData,
          userName,
          userPhone,
          userWechat
        })
      });
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
    <section className="bg-white py-16 sm:py-24" aria-labelledby="pc-builder-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          titleId="pc-builder-title"
          eyebrow="在线装机"
          title="按需选配，实时看预算"
          description="从处理器和显卡开始选，库存价格、整机功耗和兼容性会随方案一起更新。"
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:items-start">
          <div className="min-w-0 space-y-4 xl:col-span-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">选择配件</h3>
                <p className="mt-1 text-xs text-slate-500">先选择处理器和显卡开始配置</p>
              </div>
              <Button
                type="button"
                onClick={handleClearAll}
                size="sm"
              >
                <Trash2 className="h-3.5 w-3.5" /> 重置
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {categories.map(cat => {
                const categoryParts = parts.filter(p => p.category === cat.key);
                const selectedPart = parts.find(part => part.id === cat.state);
                const quantity = selectedPart?.quantity ?? 0;

                return (
                  <div key={cat.key} className="relative min-w-0 rounded-lg border border-slate-200 bg-white p-3.5 sm:p-4">
                    <label className="mb-2 block text-sm font-semibold text-slate-900">{cat.label}</label>
                    <SearchablePartSelect
                      parts={categoryParts}
                      value={cat.state}
                      placeholder={`搜索${cat.label}型号或规格`}
                      loading={loading}
                      onChange={cat.callback}
                    />

                    {selectedPart && (
                      <div className="mt-2.5 space-y-2 rounded-lg bg-slate-50 px-3 py-2.5">
                        <p className="break-words text-sm leading-5 text-slate-600">
                          <span className="font-semibold text-slate-700">规格：</span>{selectedPart.specs || "暂未提供"}
                        </p>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className={`rounded px-2 py-1 text-xs font-medium ${
                            quantity <= 0 ? "bg-rose-50 text-rose-700" : quantity <= 3 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                          }`}>
                            {quantity <= 0 ? "暂时缺货" : quantity <= 3 ? `库存紧张 · ${quantity} 件` : `现货 · ${quantity} 件`}
                          </span>
                          <span className="whitespace-nowrap text-base font-semibold tabular-nums text-slate-950">¥{selectedPart.price.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="min-w-0 space-y-4 xl:col-span-5 xl:sticky xl:top-24">
            <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5" aria-labelledby="build-summary-title">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 id="build-summary-title" className="text-base font-bold text-slate-900">预算与兼容性</h3>
                  <p className="mt-1 text-xs text-slate-500">根据当前选择实时估算</p>
                </div>
                <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${calculating ? "animate-pulse bg-blue-500" : "bg-emerald-500"}`} aria-label={calculating ? "正在计算" : "计算完成"} />
              </div>

              <div className="mt-5 border-b border-slate-100 pb-5">
                <span className="text-xs font-medium text-slate-500">当前方案预算</span>
                <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
                  <span className="text-base font-semibold text-slate-700">¥</span>
                  <span className="text-3xl font-bold tabular-nums text-slate-950 sm:text-4xl">{buildData ? buildData.totalPrice.toLocaleString() : "0"}</span>
                  <span className="text-xs text-slate-500">含装工理线</span>
                </div>
              </div>

              {buildData && buildData.totalWattageNeed > 0 && (
                <div className="space-y-2.5 border-b border-slate-100 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-slate-600">
                      <Battery className="h-4 w-4 text-blue-600" /> 预估满载功耗
                    </span>
                    <span className="font-bold tabular-nums text-slate-900">{buildData.totalWattageNeed} W</span>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full bg-slate-100"
                    role="meter"
                    aria-label="预估满载功耗"
                    aria-valuemin={0}
                    aria-valuemax={1200}
                    aria-valuenow={buildData.totalWattageNeed}
                  >
                    <div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${Math.min(100, (buildData.totalWattageNeed / 1200) * 100)}%` }} />
                  </div>
                  <p className="text-right text-xs text-slate-500">建议电源：{buildData.safetyWattageRecommended} W 及以上</p>
                </div>
              )}

              {buildData && (
                <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3.5">
                  <p className="text-sm font-semibold text-blue-900">AI 算力参考：{buildData.aiRating}</p>
                  <p className="mt-1.5 text-sm leading-5 text-blue-900/80">{buildData.aiRatingDesc}</p>
                </div>
              )}

              <div className="mt-4 space-y-3">
                <h4 className="text-sm font-bold text-slate-800">兼容性检查</h4>
                {calculating ? (
                    <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-600" role="status">正在核对接口、内存规格和电源功率…</p>
                ) : buildData && (buildData.warnings.length > 0 || buildData.successes.length > 0) ? (
                  <div className="space-y-2">
                    {buildData.warnings.map((warn, index) => (
                      <div key={index} className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm leading-5 text-rose-800">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{warn}</span>
                      </div>
                    ))}
                    {buildData.successes.map((success, index) => (
                      <div key={index} className="flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm leading-5 text-emerald-800">
                        <Check className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{success}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm leading-5 text-slate-600">
                    选择处理器、显卡和主板后，将显示接口及功耗检查结果。
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5" aria-labelledby="quote-form-title">
              <div className="mb-4">
                <h3 id="quote-form-title" className="text-base font-bold text-slate-900">获取装机报价</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">提交当前配置和联系方式，门店将与您确认库存及最终价格。</p>
              </div>

              {quoteResponse ? (
                <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-900">
                    <CheckCircle2 className="h-5 w-5 shrink-0" /> 方案已提交 · {quoteResponse.quoteId}
                  </div>
                  <p className="text-xs leading-5 text-emerald-800">{quoteResponse.message}</p>
                  <Button
                    type="button"
                    onClick={() => setQuoteResponse(null)}
                    className="w-full"
                  >
                    继续配置
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmitQuote} className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="min-w-0">
                      <label htmlFor="builder-name" className="mb-1.5 block text-xs font-medium text-slate-700">联系人 *</label>
                      <Input
                        id="builder-name"
                        type="text"
                        autoComplete="name"
                        required
                        placeholder="怎么称呼您"
                        value={userName}
                        onChange={event => setUserName(event.target.value)}
                      />
                    </div>
                    <div className="min-w-0">
                      <label htmlFor="builder-phone" className="mb-1.5 block text-xs font-medium text-slate-700">联系电话 *</label>
                      <Input
                        id="builder-phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        required
                        placeholder="请输入手机号"
                        value={userPhone}
                        onChange={event => setUserPhone(event.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="builder-wechat" className="mb-1.5 block text-xs font-medium text-slate-700">微信号（选填）</label>
                    <Input
                      id="builder-wechat"
                      type="text"
                      autoComplete="off"
                      placeholder="方便时可填写"
                      value={userWechat}
                      onChange={event => setUserWechat(event.target.value)}
                    />
                  </div>

                  {quoteError && (
                    <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-5 text-rose-800">{quoteError}</p>
                  )}

                  <Button
                    type="submit"
                    disabled={submittingQuote || !selectedCpuId || !selectedGpuId}
                    variant="primary"
                    size="lg"
                    loading={submittingQuote}
                    className="w-full"
                  >
                    <Send className="h-4 w-4 shrink-0" />
                    {!selectedCpuId || !selectedGpuId ? "请先选择处理器和显卡" : submittingQuote ? "正在提交方案…" : "提交配置并获取报价"}
                  </Button>
                </form>
              )}
            </section>
          </aside>
        </div>
      </div>
    </section>
  );
}
