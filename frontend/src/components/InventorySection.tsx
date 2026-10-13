import React, { useState, useEffect } from "react";
import { Package, RefreshCw, AlertTriangle, ShieldCheck, Database, ChevronLeft, ChevronRight } from "lucide-react";
import { apiFetch } from "../lib/api";
import { buildInventoryCategoryTabs, InventoryCategoryTab } from "../lib/inventoryCategories";
import { paginateItems } from "../lib/pagination";
import { Button, SearchInput, SegmentedControl } from "./ui/controls";

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
    <section className="border-b border-slate-200 bg-slate-50 py-12 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Module Title Accent */}
        <div className="mx-auto mb-9 max-w-3xl space-y-3 text-center sm:mb-11">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            <Database className="h-3 w-3" /> 实时仓储库存
          </span>
          <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            门店真实货架现货直观查阅
          </h2>
          <p className="mx-auto max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            数据每分钟直接对接成都一号店物理销售POS与硬件仓库，确保标注【有货】即可到店直提或当天顺丰速发。拒绝虚假引流、空挂货架！
          </p>
        </div>

        {/* Filters and Search panel bar */}
        <div className="mb-6 flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">

          {/* Category Filter Tabs */}
          <SegmentedControl
            label="库存类目"
            className="w-full md:flex-1"
            options={categoryTabs.map(cat => ({ value: cat.key, label: cat.label }))}
            value={selectedCategory}
            onChange={setSelectedCategory}
          />

          {/* Search box and refresh button */}
          <div className="flex w-full items-center gap-2 md:w-80">
            <div className="min-w-0 flex-1">
              <SearchInput
                aria-label="搜索库存"
                placeholder="搜索型号、架构或规格..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              onClick={fetchInventory}
              title="刷新数据"
              aria-label="刷新数据"
              size="icon"
            >
              <RefreshCw className={`h-4.5 w-4.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Loading and Error states */}
        {loading && items.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
            <span className="text-xs text-gray-450 font-medium">全力拉取最新数据库库存，请稍候...</span>
          </div>
        ) : error ? (
          <div className="mx-auto max-w-lg rounded-lg border border-rose-200 bg-rose-50 p-6 py-10 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-xs font-semibold text-red-800">{error}</p>
            <Button
              onClick={fetchInventory}
              size="sm"
              className="mt-3"
            >
              重新连接
            </Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white px-6 py-16 text-center">
            <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">该类目下暂无符合筛选条件的现货</p>
              <p className="mt-2 text-sm text-slate-500">您可以联系门店咨询到货或调货情况。</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <span>
                共 {filteredItems.length} 款库存，当前显示 {pageStart}-{pageEnd}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                  disabled={pagination.currentPage === 1}
                  size="icon"
                  aria-label="上一页"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-20 text-center font-medium tabular-nums text-slate-700">
                  {pagination.currentPage} / {pagination.totalPages}
                </span>
                <Button
                  onClick={() => setCurrentPage(page => Math.min(pagination.totalPages, page + 1))}
                  disabled={pagination.currentPage === pagination.totalPages}
                  size="icon"
                  aria-label="下一页"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {pagination.pageItems.map(item => (
                <div
                  key={item.id}
                  className={`flex flex-col justify-between rounded-lg border bg-white transition-colors duration-200 ${
                    item.gpuRisk
                      ? "border-rose-200 hover:border-rose-300"
                      : "border-slate-200 hover:border-blue-300"
                  }`}
                >
                  {/* Visual Top Area */}
                  <div className="space-y-3.5 p-4">
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded border border-slate-200/50">
                        {item.categoryLabel || item.category}
                      </span>

                      <span className={`rounded border px-2 py-0.5 text-[11px] font-bold ${
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
                      <h3 className="min-h-11 text-base font-semibold leading-6 text-slate-950 line-clamp-2">
                        {item.name}
                      </h3>
                      <p className="truncate text-xs text-slate-500">
                        货存编码: {item.id}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs font-bold">
                        <span className="rounded border border-blue-100 bg-blue-50 px-2 py-1 text-blue-800">
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
                          <span className="rounded border border-slate-200 bg-slate-100 px-2 py-1 text-slate-700">
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
                    <div className="rounded border border-slate-100 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                      {item.specs}
                    </div>
                  </div>

                  {/* Bottom Pricing & Action Section */}
                  <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-4 py-3">
                    <div>
                      <span className="mb-1 block text-xs text-slate-500">到店自提价</span>
                      <span className="text-xl font-bold tabular-nums leading-none text-slate-950">
                        ¥ {item.price.toLocaleString()}
                      </span>
                    </div>

                    {item.warehouseLocation && (
                      <span className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600">
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
        <div className="mx-auto mt-8 flex max-w-4xl flex-col items-start gap-3 border-t border-slate-200 pt-5 text-sm sm:flex-row sm:items-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-0.5 text-center sm:text-left">
            <span className="block font-semibold text-slate-900">
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
