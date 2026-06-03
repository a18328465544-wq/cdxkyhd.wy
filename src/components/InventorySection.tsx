import React, { useState, useEffect } from "react";
import { Package, RefreshCw, Cpu, Check, AlertTriangle, Eye, ShieldCheck, Database, Search } from "lucide-react";
import { motion } from "motion/react";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  condition: string;
  specs: string;
  status: string;
}

export default function InventorySection() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/inventory");
      const data = await response.json();
      if (data.success) {
        setItems(data.items);
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

  const handleSimulateSale = async (id: string, currentQty: number) => {
    if (currentQty <= 0) return;
    setUpdatingId(id);
    try {
      const response = await fetch("/api/inventory/update-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, quantityChange: -1 })
      });
      const data = await response.json();
      if (data.success) {
        setItems(prev => prev.map(item => item.id === id ? data.updatedItem : item));
      }
    } catch (err) {
      console.error("更新库存出错:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRestock = async (id: string) => {
    setUpdatingId(id);
    try {
      const response = await fetch("/api/inventory/update-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, quantityChange: 5 })
      });
      const data = await response.json();
      if (data.success) {
        setItems(prev => prev.map(item => item.id === id ? data.updatedItem : item));
      }
    } catch (err) {
      console.error("补货出错:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const categories = ["All", "GPU", "CPU", "Motherboard", "RAM", "SSD", "PSU"];

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.specs.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section id="inventory" className="py-20 bg-slate-50 border-b border-slate-100 relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.15] -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Module Title Accent */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 sm:mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
            <Database className="h-3 w-3" /> Live Inventory · 实时仓储库存
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
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-50 text-gray-650 hover:bg-slate-100 hover:text-gray-900"
                }`}
              >
                {cat === "All" ? "全部配件" : cat}
              </button>
            ))}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all duration-300 hover:shadow-md flex flex-col justify-between ${
                  item.quantity === 0
                    ? "border-slate-150 bg-slate-50/50 opacity-75"
                    : item.quantity <= 3
                    ? "border-amber-200 hover:border-amber-400"
                    : "border-slate-100 hover:border-blue-300"
                }`}
              >
                {/* Visual Top Area */}
                <div className="p-5 space-y-3.5">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-[9px] bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded border border-slate-200/50">
                      {item.category}
                    </span>

                    {/* Quantity Badge status */}
                    {item.quantity === 0 ? (
                      <span className="rounded bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 border border-gray-200">
                        已售罄 缺货中
                      </span>
                    ) : item.quantity <= 3 ? (
                      <span className="rounded bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 border border-amber-200 animate-pulse">
                        库存紧急 (仅余 {item.quantity} 件)
                      </span>
                    ) : (
                      <span className="rounded bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 border border-blue-100">
                        充足现货 ({item.quantity} 件)
                      </span>
                    )}
                  </div>

                  {/* Component Title details */}
                  <div className="space-y-1">
                    <h3 className="font-bold text-gray-900 tracking-tight text-sm line-clamp-2 md:h-10">
                      {item.name}
                    </h3>
                    <p className="font-mono text-[10px] text-gray-400 line-clamp-1">
                      货存编码: {item.id} · 成色: {item.condition}
                    </p>
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

                  {/* Interactive POS Simulation utility widgets */}
                  <div className="flex items-center gap-1.5">
                    {item.quantity > 0 && (
                      <button
                        onClick={() => handleSimulateSale(item.id, item.quantity)}
                        disabled={updatingId !== null}
                        title="模拟门店成交（POS出库-1）"
                        className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-slate-900 text-white hover:bg-slate-850 active:scale-95 disabled:opacity-50 transition cursor-pointer"
                      >
                        模拟出库
                      </button>
                    )}
                    <button
                      onClick={() => handleRestock(item.id)}
                      disabled={updatingId !== null}
                      title="模拟进货（POS入库+5）"
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold border border-gray-200 bg-white text-gray-700 hover:bg-slate-50 active:scale-95 disabled:opacity-50 transition cursor-pointer"
                    >
                      补货
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
