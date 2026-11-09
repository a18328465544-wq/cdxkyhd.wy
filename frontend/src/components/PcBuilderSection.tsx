import React, { useState, useEffect } from "react";
import { ArrowRight, Battery, BriefcaseBusiness, Check, Cpu, Gamepad2, AlertCircle, Send, Trash2, CheckCircle2, ChevronDown, X } from "lucide-react";
import { apiFetch } from "../lib/api";
import { scrollToSectionTarget } from "../lib/navigation";
import { type PartSearchItem } from "../lib/partSearch";
import { BUILD_STARTERS, resolveBuildStarter, type BuildStarterId } from "../lib/buildStarters";
import SearchablePartSelect from "./SearchablePartSelect";
import { Button, Input, SegmentedControl } from "./ui/controls";

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
  const [catalogError, setCatalogError] = useState("");
  const [catalogRevision, setCatalogRevision] = useState(0);
  const [starterId, setStarterId] = useState<BuildStarterId>("gaming");
  const [pendingStarter, setPendingStarter] = useState<BuildStarterId | null>(null);
  const [starterNotice, setStarterNotice] = useState("");

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
  const [quoteOpen, setQuoteOpen] = useState(false);

  // Fetch Parts catalog
  const fetchParts = async (signal: AbortSignal) => {
    try {
      const data = await apiFetch<{ success: boolean; parts: PartItem[] }>("/api/pc-parts?view=picker", { signal });
      if (data.success && Array.isArray(data.parts) && !signal.aborted) {
        setParts(data.parts);
        setCatalogError("");
      } else if (!signal.aborted) {
        setCatalogError("配件目录暂不可用，请稍后重试。");
      }
    } catch (err) {
      if (!signal.aborted) setCatalogError("配件目录暂时无法读取，请稍后重试。");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    void fetchParts(controller.signal);
    return () => controller.abort();
  }, [catalogRevision]);

  // Recalculate build when selections modify
  useEffect(() => {
    if (loading) return;
    if (![selectedCpuId, selectedGpuId, selectedMbId, selectedRamId, selectedSsdId, selectedPsuId, selectedCoolerId, selectedCaseId].some(Boolean)) {
      setBuildData(null);
      setCalculating(false);
      return;
    }
    const controller = new AbortController();
    setCalculating(true);
    setBuildData(null);

    const calculateBuild = async () => {
      setCalculating(true);
      try {
        const data = await apiFetch<BuildResults & { success: boolean }>("/api/pc-builder/build", {
          method: "POST",
          signal: controller.signal,
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
        if (data.success && !controller.signal.aborted) {
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
        if (!controller.signal.aborted) console.error("计算整机账单参数出错:", err);
      } finally {
        if (!controller.signal.aborted) setCalculating(false);
      }
    };

    const timer = window.setTimeout(() => void calculateBuild(), 150);
    return () => { window.clearTimeout(timer); controller.abort(); };
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
    setPendingStarter(null);
    setStarterNotice("");
    setQuoteOpen(false);
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
    { key: "PSU", label: "电源", state: selectedPsuId, callback: setSelectedPsuId },
    { key: "Cooler", label: "散热组件", state: selectedCoolerId, callback: setSelectedCoolerId },
    { key: "Case", label: "机箱", state: selectedCaseId, callback: setSelectedCaseId }
  ];
  const selectedCount = categories.filter(category => category.state).length;
  const hasSelection = selectedCount > 0;
  const canRequestQuote = Boolean(selectedCpuId && selectedGpuId && buildData && !calculating);
  const starter = resolveBuildStarter(parts, starterId);
  const starterIcons = { gaming: Gamepad2, productivity: BriefcaseBusiness, ai: Cpu };
  const applyStarter = (id: BuildStarterId) => {
    const next = resolveBuildStarter(parts, id);
    if (!next.available) return;
    setSelectedCpuId(next.cpu!.id);
    setSelectedGpuId(next.gpu!.id);
    setBuildData(null);
    setQuoteOpen(false);
    setQuoteError("");
    setQuoteResponse(null);
    setPendingStarter(null);
    setStarterNotice(`已采用${BUILD_STARTERS.find(item => item.id === id)!.title}起步配置。仅包含处理器与显卡，非完整整机；其他配件、接口、散热和机箱空间仍需确认。`);
  };

  return (
    <section className="bg-white py-6 sm:py-8" aria-labelledby="pc-builder-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="page-heading"><div><h1 id="pc-builder-title" className="page-title">在线装机</h1><p className="page-description">按需选配，实时查看预算、功耗与兼容性。</p></div><span className="text-sm tabular-nums text-slate-600">已选 {selectedCount} / {categories.length} 项</span></header>

        <section aria-label="装机起步配置" className="mb-6 border-b border-slate-200 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">按用途开始</h2>
            <SegmentedControl label="装机用途" value={starterId} onChange={id => { setStarterId(id); setPendingStarter(null); }} className="build-starter-tabs" options={BUILD_STARTERS.map(profile => { const Icon = starterIcons[profile.id]; return { value: profile.id, label: <><Icon className="h-4 w-4 shrink-0" aria-hidden="true" />{profile.title}</> }; })} />
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 text-sm leading-6 text-slate-700">
              <p className="mb-1 text-xs text-slate-500">{BUILD_STARTERS.find(profile => profile.id === starterId)!.description} · 核心配件参考，非完整整机</p>
              {loading ? <p role="status">正在匹配门店配件…</p> : catalogError ? <p role="alert" className="text-amber-700">{catalogError}</p> : <dl className="grid grid-cols-[48px_minmax(0,1fr)] gap-x-2"><dt className="text-slate-500">处理器</dt><dd className="break-words font-medium">{starter.cpu?.name ?? "暂无匹配现货"}</dd><dt className="text-slate-500">显卡</dt><dd className="break-words font-medium">{starter.gpu?.name ?? "暂无匹配现货"}</dd></dl>}
            </div>
            {catalogError ? <Button size="sm" onClick={() => setCatalogRevision(value => value + 1)} className="self-start">重新读取配件</Button> : <Button size="sm" disabled={loading || !starter.available} onClick={() => { if (hasSelection) setPendingStarter(starterId); else applyStarter(starterId); }} className="self-start sm:self-center"><ArrowRight className="h-4 w-4" />使用起步配置</Button>}
          </div>
          {pendingStarter && <div role="group" aria-label="确认替换核心配件" className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-sm"><p className="mr-auto text-slate-700">将替换当前处理器和显卡，其他配件保留。</p><Button size="sm" variant="primary" onClick={() => applyStarter(pendingStarter)}>确认替换</Button><Button size="sm" onClick={() => setPendingStarter(null)}>取消</Button></div>}
          {starterNotice && <p role="status" className="mt-3 text-xs leading-5 text-blue-700">{starterNotice}</p>}
        </section>

        <div className="sticky top-16 z-20 mb-4 flex min-h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 py-2 backdrop-blur-sm sm:top-20 xl:hidden">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1"><span className="text-xs text-slate-600">当前预算</span><strong className="text-lg font-semibold tabular-nums text-slate-950" aria-live="polite">{hasSelection ? calculating ? '计算中…' : buildData ? `¥${buildData.totalPrice.toLocaleString()}` : '待计算' : '待选配'}</strong></div>
          <Button variant="ghost" size="sm" onClick={() => { const target = document.getElementById('build-summary'); if (target) scrollToSectionTarget(target, 152); }}><ChevronDown className="h-4 w-4" />查看预算</Button>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:items-start">
          <div className="min-w-0 space-y-4 xl:col-span-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">选择配件</h2>
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

            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {categories.map(cat => {
                const categoryParts = parts.filter(p => p.category === cat.key);
                const selectedPart = parts.find(part => part.id === cat.state);
                const quantity = selectedPart?.quantity ?? 0;

                return (
                  <div key={cat.key} className="grid min-w-0 gap-2 py-3.5 sm:grid-cols-[100px_minmax(0,1fr)] sm:gap-4">
                    <span className="text-sm font-medium text-slate-800 sm:pt-2.5">{cat.label}</span>
                    <div className="min-w-0">
                    <SearchablePartSelect
                      parts={categoryParts}
                      value={cat.state}
                      placeholder={`搜索${cat.label}型号或规格`}
                      loading={loading}
                      onChange={cat.callback}
                    />

                    {selectedPart && (
                      <div className="mt-2.5 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className={`rounded px-2 py-1 text-xs font-medium ${
                            quantity <= 0 ? "bg-rose-50 text-rose-700" : quantity <= 3 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                          }`}>
                            {quantity <= 0 ? "暂时缺货" : quantity <= 3 ? `库存紧张 · ${quantity} 件` : `现货 · ${quantity} 件`}
                          </span>
                          <span className="whitespace-nowrap text-base font-semibold tabular-nums text-slate-950">¥{selectedPart.price.toLocaleString()}</span>
                        </div>
                        <details className="group text-xs leading-5 text-slate-600"><summary className="flex min-h-8 cursor-pointer list-none items-center gap-1 [&::-webkit-details-marker]:hidden">配件规格<ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" /></summary><p className="break-words pb-1">{selectedPart.specs || "暂未提供"}</p></details>
                      </div>
                    )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="min-w-0 space-y-4 xl:col-span-5 xl:sticky xl:top-24">
            <section id="build-summary" className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5" aria-labelledby="build-summary-title">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 id="build-summary-title" className="text-base font-bold text-slate-900">预算与兼容性</h2>
                  <p className="mt-1 text-sm text-slate-600">{hasSelection ? '根据当前选择实时估算' : '选择配件后显示预算'}</p>
                </div>
                <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${!hasSelection ? 'bg-slate-300' : calculating ? "animate-pulse bg-blue-500" : "bg-emerald-500"}`} aria-label={!hasSelection ? '尚未配置' : calculating ? "正在计算" : "计算完成"} />
              </div>

              <div className="mt-5 border-b border-slate-100 pb-5">
                  <span className="text-xs font-medium text-slate-500">已选配件参考合计</span>
                <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
                  {hasSelection && <span className="text-base font-semibold text-slate-700">¥</span>}
                  <span className="text-3xl font-bold tabular-nums text-slate-950 sm:text-4xl">{hasSelection ? buildData ? buildData.totalPrice.toLocaleString() : '计算中' : '待选配'}</span>
                  {hasSelection && <span className="text-xs text-slate-600">{selectedCount} 项配件，非整机报价</span>}
                </div>
              </div>

              {hasSelection && buildData && buildData.totalWattageNeed > 0 && (
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

              {selectedGpuId && buildData && (
                <div className="mt-4 border-l-2 border-blue-500 pl-3">
                  <p className="text-sm font-semibold text-blue-900">AI 部署参考</p>
                  <p className="mt-1.5 text-sm leading-5 text-blue-900/80">需结合显存、模型规模、量化精度、上下文长度与软件支持评估；仅凭显卡型号不能保证模型可运行或出图速度。多卡显存不自动合并。</p>
                </div>
              )}

              <div className="mt-4 space-y-3">
                <h3 className="text-sm font-bold text-slate-800">兼容性检查</h3>
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

            <section className="border-t border-slate-200 pt-4" aria-labelledby="quote-form-title">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                <h2 id="quote-form-title" className="text-base font-bold text-slate-900">获取装机报价</h2>
                {quoteOpen && <p className="mt-1 text-sm leading-6 text-slate-600">门店将与您确认库存及最终价格。</p>}
                </div>
                {quoteOpen && !quoteResponse && <Button size="icon" variant="ghost" aria-label="收起报价表单" onClick={() => setQuoteOpen(false)}><X className="h-4 w-4" /></Button>}
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
              ) : quoteOpen ? (
                <form id="builder-quote-form" onSubmit={handleSubmitQuote} className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="min-w-0">
                      <label htmlFor="builder-name" className="mb-1.5 block text-xs font-medium text-slate-700">联系人 *</label>
                      <Input
                        id="builder-name"
                        type="text"
                        autoComplete="name"
                        autoFocus
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
                    disabled={submittingQuote || !canRequestQuote}
                    variant="primary"
                    size="lg"
                    loading={submittingQuote}
                    className="w-full"
                  >
                    <Send className="h-4 w-4 shrink-0" />
                    {!selectedCpuId || !selectedGpuId ? "请先选择处理器和显卡" : submittingQuote ? "正在提交方案…" : "提交配置并获取报价"}
                  </Button>
                </form>
              ) : <Button onClick={() => setQuoteOpen(true)} disabled={!canRequestQuote} variant="primary" size="lg" className="w-full" aria-expanded={false} aria-controls="builder-quote-form"><Send className="h-4 w-4" />{!selectedCpuId || !selectedGpuId ? '选择处理器和显卡后获取报价' : calculating ? '正在计算配置…' : '获取这套配置的报价'}</Button>}
            </section>
          </aside>
        </div>
      </div>
    </section>
  );
}
