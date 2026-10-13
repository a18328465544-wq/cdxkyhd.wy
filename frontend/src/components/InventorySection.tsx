import React, { useState, useEffect } from "react";
import { Package, RefreshCw, AlertTriangle, ShieldCheck, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { apiFetch } from "../lib/api";
import { buildInventoryCategoryTabs, InventoryCategoryTab } from "../lib/inventoryCategories";
import { paginateItems } from "../lib/pagination";
import { Button, SearchInput, SegmentedControl } from "./ui/controls";
import SectionHeader from "./ui/SectionHeader";

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

export default function InventorySection({ onOpenContact }: { onOpenContact: () => void }) {
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

  const statusTone = (status: string) =>
    status === "已上架"
      ? "bg-blue-50 text-blue-700"
      : status === "已入库"
        ? "bg-emerald-50 text-emerald-700"
        : "bg-slate-100 text-slate-600";

  return (
    <section className="border-t border-slate-200 bg-slate-50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="现货库存"
          title="店里有货，随时来看"
          description="库存与门店系统同步。标注有货的商品可以到店自提，也可以当天顺丰发出。"
        />

        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <SegmentedControl
            label="库存类目"
            className="w-full md:w-auto md:max-w-[60%]"
            options={categoryTabs.map(cat => ({ value: cat.key, label: cat.label }))}
            value={selectedCategory}
            onChange={setSelectedCategory}
          />
          <div className="flex w-full items-center gap-2 md:w-80">
            <div className="min-w-0 flex-1">
              <SearchInput
                aria-label="搜索库存"
                placeholder="搜索型号或规格"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={fetchInventory} title="刷新库存" aria-label="刷新库存" size="icon">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
            </Button>
          </div>
        </div>

        {loading && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-sm text-slate-500">正在读取门店库存…</span>
          </div>
        ) : error ? (
          <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200">
            <AlertTriangle className="mx-auto h-7 w-7 text-amber-500" />
            <p className="mt-3 text-base font-medium text-slate-900">库存暂时没加载出来</p>
            <p className="mt-1 text-sm text-slate-500">{error}</p>
            <Button onClick={fetchInventory} size="sm" className="mt-5">重新加载</Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-2xl bg-white px-6 py-16 text-center ring-1 ring-slate-200">
            <Package className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-base font-medium text-slate-900">这个分类暂时没有符合条件的商品</p>
            <p className="mt-1 text-sm text-slate-500">
              可以<button type="button" onClick={onOpenContact} className="mx-1 font-medium text-blue-700 hover:underline">微信问问</button>到货或调货情况。
            </p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {pagination.pageItems.map(item => (
                <article
                  key={item.id}
                  className="flex flex-col rounded-2xl bg-white ring-1 ring-slate-200 transition hover:shadow-[0_16px_40px_-20px_rgba(15,23,42,0.3)] hover:ring-slate-300"
                >
                  <div className="flex-1 p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-slate-500">{item.categoryLabel || item.category}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusTone(item.status)}`}>
                        {item.status}
                      </span>
                    </div>

                    <h3 className="mt-3 min-h-14 text-lg font-semibold leading-7 text-slate-950 line-clamp-2">
                      {item.name}
                    </h3>
                    {item.specs && (
                      <p className="mt-1 text-sm leading-6 text-slate-500 line-clamp-2">{item.specs}</p>
                    )}

                    <ul className="mt-4 flex flex-wrap gap-1.5 text-xs font-medium">
                      <li className="rounded-md bg-blue-50 px-2 py-1 text-blue-700">成色 {item.condition}</li>
                      {typeof item.fullBox === "boolean" && (
                        <li className="rounded-md bg-slate-100 px-2 py-1 text-slate-600">{item.fullBox ? "箱说齐全" : "箱说不齐"}</li>
                      )}
                      {typeof item.inWarranty === "boolean" && (
                        <li className="rounded-md bg-slate-100 px-2 py-1 text-slate-600">{item.inWarranty ? "在保" : "已过保"}</li>
                      )}
                      {typeof item.repaired === "boolean" && (
                        <li className={`rounded-md px-2 py-1 ${item.repaired ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                          {item.repaired ? "有维修史" : "无维修史"}
                        </li>
                      )}
                      {item.gpuRisk && (
                        <li className="rounded-md bg-rose-50 px-2 py-1 text-rose-700">需当面确认</li>
                      )}
                    </ul>
                  </div>

                  <div className="flex items-end justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:px-6">
                    <div className="min-w-0">
                      <span className="block text-xs text-slate-500">到店自提价</span>
                      <span className="mt-1 block font-display text-2xl font-bold tabular-nums tracking-tight text-slate-950">
                        ¥{item.price.toLocaleString("zh-CN")}
                      </span>
                      {item.warehouseLocation && (
                        <span className="mt-1 block truncate text-xs text-slate-400">库位 {item.warehouseLocation}</span>
                      )}
                    </div>
                    <Button size="sm" onClick={onOpenContact} className="shrink-0">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                      咨询这台
                    </Button>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-8 flex flex-col items-center justify-between gap-3 text-sm text-slate-500 sm:flex-row">
              <span>共 {filteredItems.length} 件，当前 {pageStart}–{pageEnd}</span>
              {pagination.totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                    disabled={pagination.currentPage === 1}
                    size="icon"
                    aria-label="上一页"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="min-w-16 text-center font-medium tabular-nums text-slate-700">
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
              )}
            </div>
          </div>
        )}

        <p className="mt-10 flex items-start gap-2 border-t border-slate-200 pt-6 text-sm leading-6 text-slate-500">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          在售二手显卡均经过 Furmark 烤机与 3DMark 压力测试，门店开具收据并提供质保。
        </p>
      </div>
    </section>
  );
}
