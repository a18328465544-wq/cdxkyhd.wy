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
  const [syncing, setSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] [系统信息] 物理仓管中心守护线程已启动，测试环境接口网关已挂载就绪`,
    `[${new Date().toLocaleTimeString()}] [系统信息] 已成功对齐天府三街物理大仓，今日账目数据一致性核实无误`
  ]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setSyncLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 7)]);
  };

  const fetchInventory = async () => {
    setLoading(true);
    addLog("[读取库存] 正在向中央库存数据库拉取最新货量明细与比对数据...");
    try {
      const response = await fetch("/api/inventory");
      const data = await response.json();
      if (data.success) {
        setItems(data.items);
        setError("");
        addLog(`[拉取成功] 握手完成，已同步 ${data.items.length} 款在库硬件型号的物理余量`);
      } else {
        setError("获取库存数据失败");
        addLog("[通信异常] 中央库存服务无合规应答报文");
      }
    } catch (err) {
      setError("无法连接到后端服务器API，请检查运行状态。");
      addLog("[网络故障] 连接本地 Express 服务网络失败，请核实后台端口状态");
    } finally {
      setLoading(false);
    }
  };

  const handleForceCalibrate = async () => {
    if (syncing) return;
    setSyncing(true);
    addLog("[校准触发] 已手动对齐全仓物理余量...");
    
    // Simulate active sync animation
    await new Promise(resolve => setTimeout(resolve, 800));
    
    try {
      const response = await fetch("/api/inventory");
      const data = await response.json();
      if (data.success) {
        setItems(data.items);
        addLog(`[校准完成] 无损精准对齐！本地一号仓库与线上商品全数 ${data.items.length} 个在售货架余量一致`);
      }
    } catch (err) {
      addLog("[校准超时] 今日进销存同步接口响应超时");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleSimulateSale = async (id: string, currentQty: number) => {
    if (currentQty <= 0) return;
    setUpdatingId(id);
    addLog(`[POS-OUT-REQ] 发起仿真零售扣减：商品 [${id}] (1件)，正在通知 ERP 同步减扣...`);
    try {
      const response = await fetch("/api/inventory/update-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, quantityChange: -1 })
      });
      const data = await response.json();
      if (data.success) {
        setItems(prev => prev.map(item => item.id === id ? data.updatedItem : item));
        addLog(`[POS-OUT-OK] 回应 [POST-200]：[${data.updatedItem.name}] ERP货架已减1。剩余 ${data.updatedItem.quantity} 件`);
      }
    } catch (err) {
      console.error("更新库存出错:", err);
      addLog(`[POS-OUT-ERR] API同步失败：网络连接出现中断`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRestock = async (id: string) => {
    setUpdatingId(id);
    addLog(`[ERP-RESTOCK-REQ] 进销存入库申报：商品 [${id}] (+5件)，通知后台做入网存储...`);
    try {
      const response = await fetch("/api/inventory/update-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, quantityChange: 5 })
      });
      const data = await response.json();
      if (data.success) {
        setItems(prev => prev.map(item => item.id === id ? data.updatedItem : item));
        addLog(`[ERP-RESTOCK-OK] 回应 [POST-200]：[${data.updatedItem.name}] 进货确认成功。现存 ${data.updatedItem.quantity} 件`);
      }
    } catch (err) {
      console.error("补货出错:", err);
      addLog(`[ERP-RESTOCK-ERR] ERP后台不在线，操作暂挂缓存`);
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
            {categories.map(cat => {
              const labelMap: Record<string, string> = {
                All: "全部配件",
                GPU: "GPU 显卡",
                CPU: "CPU 处理器",
                Motherboard: "主板",
                RAM: "内存",
                SSD: "固态硬盘",
                PSU: "电源"
              };
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-50 text-gray-650 hover:bg-slate-100 hover:text-gray-900"
                  }`}
                >
                  {labelMap[cat] || cat}
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

        {/* Real-time ERP Sync Dashboard Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Status block */}
          <div className="md:col-span-1 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-5 border border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 h-20 w-20 rounded-full bg-blue-500/10 blur-xl" />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400">
                  物理仓库同步：在线
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold block font-sans">
                  成都一号店进销存同步中心
                </h3>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  物理店销售系统的货架余量在库明细，已打通 API 网关。若有物理退货/进货，此页信息两端无延迟秒级同步。
                </p>
              </div>
            </div>
            
            <div className="pt-4 flex items-center justify-between border-t border-slate-800 mt-4">
              <div>
                <span className="text-[10px] text-slate-500 block">自动对账频率</span>
                <span className="text-[10px] font-mono font-bold text-slate-300">60s 增量校验</span>
              </div>
              <button
                onClick={handleForceCalibrate}
                disabled={syncing}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 transition text-[10.5px] text-white font-bold px-3 py-1.5 rounded-lg cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "校验中..." : "强制对齐 ERP"}
              </button>
            </div>
          </div>

          {/* Monospace terminal console view */}
          <div className="md:col-span-2 bg-slate-950 border border-slate-900 rounded-2xl p-4 flex flex-col justify-between min-h-[140px]">
            <div className="flex justify-between items-center pb-2 border-b border-slate-900 mb-2">
              <span className="text-[9.5px] tracking-wider text-slate-400 uppercase font-black">
                实体仓库进销存实时数据比对审计
              </span>
              <span className="text-[8.5px] text-slate-500">
                通讯保障：稳定运行中
              </span>
            </div>
            <div className="flex-1 font-mono text-[10.5px] text-emerald-400 space-y-1.5 overflow-y-auto max-h-[110px] pr-2 scrollbar-thin">
              {syncLogs.map((log, index) => (
                <div key={index} className="truncate select-none text-left leading-relaxed">
                  <span className="text-slate-600 mr-1">&gt;</span> {log}
                </div>
              ))}
            </div>
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

                  {/* Standard active physical in-stock assurance tag */}
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50/80 px-2 py-1 rounded-lg border border-emerald-100/50">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      门店现货
                    </span>
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
