import React, { useState, useEffect } from "react";
import { Package, RefreshCw, AlertTriangle, ShieldCheck, ChevronDown, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { apiFetch } from "../lib/api";
import { buildInventoryCategoryTabs, InventoryCategoryTab } from "../lib/inventoryCategories";
import { Button, SearchInput, Select, SegmentedControl } from "./ui/controls";
import SectionHeader from "./ui/SectionHeader";
import type { ConversionEvent } from "../lib/conversionAnalytics";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  condition: string;
  categoryLabel?: string;
  fullBox?: boolean;
  inWarranty?: boolean;
  repaired?: boolean;
  gpuRisk?: boolean;
  warehouseLocation?: string;
  specs?: string;
  status: string;
  pinCode?: string;
  ramType?: string;
}

function InventoryDetails({ item: preview }: { item: InventoryItem }) {
  const { id } = preview;
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open || item) return;
    const controller = new AbortController();
    void apiFetch<{ items: InventoryItem[] }>(`/api/inventory?detailId=${encodeURIComponent(id)}`, { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) { setItem(data.items[0] ?? null); setError(data.items.length ? "" : "商品已不在当前库存，请刷新。"); } })
      .catch(() => { if (!controller.signal.aborted) setError("详情暂时无法读取，请关闭后重试。"); });
    return () => controller.abort();
  }, [id, open, item]);
  return <details className="group border-t border-slate-100 px-4 sm:px-5" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between text-xs font-medium text-slate-600 sm:min-h-10 [&::-webkit-details-marker]:hidden">商品详情<ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" /></summary>
    <dl className="space-y-1 pb-2 text-xs leading-5 text-slate-600">
      <div className="flex gap-2"><dt>箱说</dt><dd>{typeof preview.fullBox === "boolean" ? preview.fullBox ? "齐全" : "不齐" : "待确认"}</dd><dt>维修</dt><dd>{typeof preview.repaired === "boolean" ? preview.repaired ? "有维修史" : "无维修史" : "待确认"}</dd></div>
      {(preview.pinCode || preview.ramType) && <div className="flex gap-2"><dt>接口 / 内存</dt><dd>{[preview.pinCode, preview.ramType].filter(Boolean).join(" · ")}</dd></div>}
    </dl>
    {item ? <dl className="space-y-2 pb-4 text-sm leading-6 text-slate-600">
      <div><dt className="font-medium text-slate-800">规格信息</dt><dd className="break-words">{item.specs || '暂未提供'}</dd></div>
      {item.warehouseLocation && <div className="flex flex-wrap gap-x-3"><dt className="font-medium text-slate-800">库位</dt><dd>{item.warehouseLocation}</dd></div>}
      <div className="flex flex-wrap gap-x-3"><dt className="font-medium text-slate-800">商品编号</dt><dd>{item.id}</dd></div>
    </dl> : <p role="status" className="pb-4 text-sm text-slate-600">{error || "正在读取详情…"}</p>}
  </details>;
}

export default function InventorySection({ onOpenContact }: { onOpenContact: (event?: ConversionEvent) => void }) {
  const PAGE_SIZE = 9;
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("GPU");
  const [categoryTabs, setCategoryTabs] = useState<InventoryCategoryTab[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [revision, setRevision] = useState(0);
  const fetchInventory = () => setRevision(value => value + 1);
  const changeCategory = (category: string) => { setSelectedCategory(category); setCurrentPage(1); };

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setItems([]);
    const timer = window.setTimeout(async () => {
      try {
        const query = new URLSearchParams({ view: "list", page: String(currentPage), pageSize: String(PAGE_SIZE), category: selectedCategory, search: searchQuery });
        const data = await apiFetch<{ success: boolean; categories?: Array<string | InventoryCategoryTab>; items: InventoryItem[]; totalCount: number; page: number; totalPages: number }>(`/api/inventory?${query}`, { signal: controller.signal });
        if (controller.signal.aborted) return;
        if (data.success) {
          setItems(data.items);
          const nextTabs = buildInventoryCategoryTabs(data.categories, data.items);
          setCategoryTabs(nextTabs);
          setTotalCount(data.totalCount);
          setTotalPages(data.totalPages);
          setCurrentPage(data.page);
          setError("");
        } else {
          setError("获取库存数据失败");
        }
      } catch {
        if (!controller.signal.aborted) setError("库存暂时无法读取，请稍后重试。");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [currentPage, selectedCategory, searchQuery, revision]);
  const pageStart = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(totalCount, currentPage * PAGE_SIZE);

  const statusTone = (status: string) =>
    status === "已上架"
      ? "bg-blue-50 text-blue-700"
      : status === "已入库"
        ? "bg-emerald-50 text-emerald-700"
        : "bg-slate-100 text-slate-600";

  return (
    <section className="border-t border-slate-200 bg-slate-50 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="现货库存"
          title="店里有货，随时来看"
          description="库存与门店系统同步。标注有货的商品可以到店自提，也可以当天顺丰发出。"
        />

        <div className="mb-6 flex flex-col gap-3">
          <div className="sm:hidden">
            <Select aria-label="选择库存类目" options={categoryTabs.map(cat => ({ value: cat.key, label: cat.label }))} value={selectedCategory} onValueChange={changeCategory} />
          </div>
          <div className="hidden min-h-11 sm:block">
          <SegmentedControl
            label="库存类目"
            className="inventory-categories"
            options={categoryTabs.map(cat => ({ value: cat.key, label: cat.label }))}
            value={selectedCategory}
            onChange={changeCategory}
          />
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-3">
          <span className="hidden text-sm text-slate-600 sm:block">{categoryTabs.find(cat => cat.key === selectedCategory)?.label ?? (selectedCategory === "GPU" ? "GPU 显卡" : selectedCategory)} · {loading ? "读取中" : `${totalCount} 件`}</span>
          <div className="flex w-full items-center gap-2 sm:w-80">
            <div className="min-w-0 flex-1">
              <SearchInput
                aria-label="搜索库存"
                placeholder="搜索型号或规格"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <Button onClick={fetchInventory} title="刷新库存" aria-label="刷新库存" size="icon">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
            </Button>
          </div>
          </div>
        </div>

        {loading && items.length === 0 ? (
          <div aria-busy="true" aria-label="正在读取门店库存">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
              {Array.from({ length: PAGE_SIZE }, (_, index) => <div key={index} className="h-[208px] rounded-lg border border-slate-200 bg-white p-4 sm:h-[302px] sm:p-5"><div className="h-3 w-24 animate-pulse rounded bg-slate-100" /><div className="mt-2 h-10 w-4/5 animate-pulse rounded bg-slate-100" /><div className="mt-2 h-5 w-3/5 animate-pulse rounded bg-slate-100" /><div className="mt-3 h-9 w-28 animate-pulse rounded bg-slate-100" /></div>)}
            </div>
            <div className="mt-8 h-10" aria-hidden="true" />
            <span role="status" className="sr-only">正在读取门店库存…</span>
          </div>
        ) : error ? (
          <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200">
            <AlertTriangle className="mx-auto h-7 w-7 text-amber-500" />
            <p className="mt-3 text-base font-medium text-slate-900">库存暂时没加载出来</p>
            <p className="mt-1 text-sm text-slate-500">{error}</p>
            <Button onClick={fetchInventory} size="sm" className="mt-5">重新加载</Button>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl bg-white px-6 py-16 text-center ring-1 ring-slate-200">
            <Package className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-base font-medium text-slate-900">这个分类暂时没有符合条件的商品</p>
            <p className="mt-1 text-sm text-slate-500">
              可以<button type="button" onClick={() => onOpenContact("product_inquiry")} className="mx-1 font-medium text-blue-700 hover:underline">微信问问</button>到货或调货情况。
            </p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map(item => (
                <article
                  key={item.id}
                  className="inventory-card flex min-h-[208px] flex-col rounded-lg border border-slate-200 bg-white transition-colors hover:border-slate-300 sm:min-h-[302px]"
                >
                  <div className="flex-1 p-4 pb-3 sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-500 sm:text-sm">{item.categoryLabel || item.category}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusTone(item.status)}`}>
                        {item.status}
                      </span>
                    </div>

                    <h3 className="mt-2 min-h-10 break-words text-base font-semibold leading-5 text-slate-950 sm:mt-3 sm:min-h-14 sm:text-lg sm:leading-7">
                      {item.name}
                    </h3>
                    {(item.pinCode || item.ramType) && <p className="mt-1 hidden text-sm text-slate-600 sm:block">{[item.pinCode, item.ramType].filter(Boolean).join(' · ')}</p>}

                    <ul className="mt-2 flex flex-wrap gap-1.5 text-xs font-medium sm:mt-3">
                      <li className="rounded bg-blue-50 px-2 py-0.5 text-blue-700 sm:py-1">成色 {item.condition}</li>
                      {typeof item.fullBox === "boolean" && (
                        <li className="hidden rounded-md bg-slate-100 px-2 py-1 text-slate-600 sm:list-item">{item.fullBox ? "箱说齐全" : "箱说不齐"}</li>
                      )}
                      {typeof item.inWarranty === "boolean" && (
                        <li className="rounded bg-slate-100 px-2 py-0.5 text-slate-600 sm:py-1">{item.inWarranty ? "在保" : "已过保"}</li>
                      )}
                      {typeof item.repaired === "boolean" && (
                        <li className={`rounded px-2 py-0.5 sm:py-1 ${item.repaired ? "bg-amber-50 text-amber-700" : "hidden bg-slate-100 text-slate-600 sm:list-item"}`}>
                          {item.repaired ? "有维修史" : "无维修史"}
                        </li>
                      )}
                      {item.gpuRisk && (
                        <li className="rounded-md bg-rose-50 px-2 py-1 text-rose-700">需当面确认</li>
                      )}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-1.5 sm:px-5 sm:py-4">
                    <span className="text-xs text-slate-600 sm:text-sm">微信询价</span>
                    <Button size="sm" onClick={() => onOpenContact("product_inquiry")} className="shrink-0">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                      咨询商品
                    </Button>
                  </div>
                  <InventoryDetails item={item} />
                </article>
              ))}
            </div>

            <div className="mt-8 flex flex-col items-center justify-between gap-3 text-sm text-slate-500 sm:flex-row">
              <span>共 {totalCount} 件，当前 {pageStart}–{pageEnd}</span>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                    disabled={loading || currentPage === 1}
                    size="icon"
                    aria-label="上一页"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="min-w-16 text-center font-medium tabular-nums text-slate-700">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                    disabled={loading || currentPage === totalPages}
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
