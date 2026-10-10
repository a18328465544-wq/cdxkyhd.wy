import React, { useState, useEffect } from "react";
import { Package, RefreshCw, AlertTriangle, ShieldCheck, Database, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { apiFetch } from "../lib/api";
import { buildInventoryCategoryTabs, InventoryCategoryTab } from "../lib/inventoryCategories";
import { paginateItems } from "../lib/pagination";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  condition: string;
  categoryLabel?: string;
  fullBox?: boolean;
  inWarranty?: boolean;
  repaired?: boolean;
  gpuRisk?: boolean;
  warehouseLocation?: string;
  specs: string;
  status: string;
}

export default function InventorySection() {
  const PAGE_SIZE = 9;
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categoryTabs, setCategoryTabs] = useState<InventoryCategoryTab[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ success: boolean; categories?: Array<string | InventoryCategoryTab>; items: InventoryItem[] }>("/api/inventory");
      if (data.success) {
        setItems(data.items);
        const nextTabs = buildInventoryCategoryTabs(data.categories, data.items);
        setCategoryTabs(nextTabs);
        setSelectedCategory(current => nextTabs.some(tab => tab.key === current) ? current : nextTabs[0]?.key ?? "");
        setError("");
      } else {
        setError("获取库存数据失败");
      }
    } catch (err) {
      setError("无法连接到后端服务器API，请检查运行状态。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const filteredItems: InventoryItem[] = items.filter(item => {
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.specs.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  const pagination = paginateItems<InventoryItem>(filteredItems, currentPage, PAGE_SIZE);
  const pageStart = filteredItems.length === 0 ? 0 : (pagination.currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(filteredItems.length, pagination.currentPage * PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    setCurrentPage(prev => paginateItems<InventoryItem>(filteredItems, prev, PAGE_SIZE).currentPage);
  }, [filteredItems.length]);

  return (
    <section className="py-20 bg-slate-50 border-b border-slate-100 relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.15] -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Module Title Accent */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 sm:mb-16">
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
            <Database className="h-3 w-3" /> 实时仓储库存
          </span>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight sm:text-4xl">
            门店真实货架现货直观查阅
          </h2>
          <p className="text-gray-500 text-sm max-w-2xl mx-auto leading-relaxed">
            数据每分钟直接对接成都一号店物理销售POS与硬件仓库，确保标注【有货】即可到店直提或当天顺丰速发。拒绝虚假引流、空挂货架！
          </p>
        </div>

        {/* Filters and Search panel bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
            {categoryTabs.map(cat => {
              return (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === cat.key
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-50 text-gray-650 hover:bg-slate-100 hover:text-gray-900"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search box and refresh button */}
          <div className="flex items-center gap-3 w-full md:w-80 justify-end">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索型号、架构或规格..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 bg-slate-50/50"
              />
            </div>
            <button
              onClick={fetchInventory}
              title="刷新数据"
              className="p-1.5 rounded-xl border border-gray-200 bg-white hover:bg-slate-50 transition active:scale-95 text-gray-600 flex items-center justify-center cursor-pointer"
            >
              <RefreshCw className={`h-4.5 w-4.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
            </button>
          </div>
        </div>

        {/* Loading and Error states */}
        {loading && items.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
            <span className="text-xs text-gray-450 font-medium">全力拉取最新数据库库存，请稍候...</span>
          </div>
        ) : error ? (
          <div className="py-12 text-center bg-red-50/50 border border-red-100 rounded-3xl p-6 max-w-lg mx-auto">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-xs font-semibold text-red-800">{error}</p>
            <button
              onClick={fetchInventory}
              className="mt-3 text-xs bg-red-100 hover:bg-red-200 font-bold text-red-800 px-4 py-2 rounded-xl transition"
            >
              重新连接
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 text-center bg-white border border-slate-100 rounded-3xl p-6">
            <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-xs font-semibold">该类目下暂无对应筛选条件的现货库存</p>
            <p className="text-gray-400 text-[10px] mt-1">您可以直接联系客服，我们可在一小时内全城极速调货！</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
              <span>
                共 {filteredItems.length} 款库存，当前显示 {pageStart}-{pageEnd}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                  disabled={pagination.currentPage === 1}
                  className="h-9 w-9 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition"
                  aria-label="上一页"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="min-w-20 text-center font-mono font-bold text-slate-700">
                  {pagination.currentPage} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(page => Math.min(pagination.totalPages, page + 1))}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="h-9 w-9 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition"
                  aria-label="下一页"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pagination.pageItems.map(item => (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border transition-all duration-300 hover:shadow-md flex flex-col justify-between ${
                    item.gpuRisk
                      ? "border-rose-200 hover:border-rose-300"
                      : "border-slate-100 hover:border-blue-300"
                  }`}
                >
                  {/* Visual Top Area */}
                  <div className="p-5 space-y-3.5">
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-[9px] bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded border border-slate-200/50">
                        {item.categoryLabel || item.category}
                      </span>

                      <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${
                        item.status === "已上架"
                          ? "border-blue-100 bg-blue-50 text-blue-700"
                          : item.status === "已入库"
                            ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-100 text-slate-600"
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    {/* Component Title details */}
                    <div className="space-y-1">
                      <h3 className="font-bold text-gray-900 tracking-tight text-sm line-clamp-2 md:h-10">
                        {item.name}
                      </h3>
                      <p className="font-mono text-[10px] text-gray-400 line-clamp-1">
                        货存编码: {item.id}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] font-bold">
                        <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-blue-700">
                          成色: {item.condition}
                        </span>
                        {typeof item.fullBox === "boolean" && (
                          <span className={`rounded-md border px-2 py-1 ${
                            item.fullBox
                              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-100 text-slate-600"
                          }`}>
                            {item.fullBox ? "箱说齐全" : "箱说不齐"}
                          </span>
                        )}
                        {typeof item.inWarranty === "boolean" && (
                          <span className="rounded-md border border-violet-100 bg-violet-50 px-2 py-1 text-violet-700">
                            保修: {item.inWarranty ? "在保" : "已过保"}
                          </span>
                        )}
                        {typeof item.repaired === "boolean" && (
                          <span className={`rounded-md border px-2 py-1 ${
                            item.repaired
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-slate-200 bg-slate-50 text-slate-600"
                          }`}>
                            维修: {item.repaired ? "有维修史" : "无维修史"}
                          </span>
                        )}
                        {typeof item.gpuRisk === "boolean" && (
                          <span className={`rounded-md border px-2 py-1 ${
                            item.gpuRisk
                              ? "border-rose-200 bg-rose-50 text-rose-700"
                              : "border-slate-200 bg-slate-50 text-slate-600"
                          }`}>
                            风险: {item.gpuRisk ? "高风险" : "正常"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Component Specs box */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-[11px] text-gray-500 leading-normal font-mono">
                      {item.specs}
                    </div>
                  </div>

                  {/* Bottom Pricing & Action Section */}
                  <div className="px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 rounded-b-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 block line-height-none">到店秒自提价</span>
                      <span className="font-mono text-base font-black text-gray-900 leading-none">
                        ¥ {item.price.toLocaleString()}
                      </span>
                    </div>

                    {item.warehouseLocation && (
                      <span className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-600">
                        库位: {item.warehouseLocation}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Status indicator bottom disclaimer */}
        <div className="mt-12 p-4.5 rounded-2xl bg-white border border-slate-200 max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-4 shadow-xs text-xs">
          <div className="h-10 w-10 shrink-0 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-0.5 text-center sm:text-left">
            <span className="font-bold text-gray-900 block font-sans">
              实体门店双重质保 · 包全检无隐忧
            </span>
            <p className="text-gray-500 leading-relaxed">
              本店属于成都正式工商登记实名店铺，销售所有二手或全新显卡、整机硬件，享受门店开具的收据/税票契约质保，老卡均经过专业的 Furmark 高温烤机、3DMark 压力测试。后续支持 API 或平台直接对账，交易安全可追溯。
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
