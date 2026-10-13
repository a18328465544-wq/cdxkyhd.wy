import React, { useState } from "react";
import { Terminal, Send, Copy, Check, Info, Code, Play, RefreshCw, Key, Shield } from "lucide-react";
import { apiFetch } from "../lib/api";

export default function DeveloperApiSection() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<"get-inventory" | "update-stock" | "get-prices" | "update-price" | "test-pc-builder">("get-inventory");
  const [responseJson, setResponseJson] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const endpointConfig = {
    "get-inventory": {
      method: "GET",
      url: "/api/inventory?inStock=true",
      desc: "获取门店实时在库显卡及其硬件配置的现货货量明细",
      curl: "curl -X GET 'https://cdgpu.cn/api/inventory?inStock=true'",
      payload: null
    },
    "update-stock": {
      method: "POST",
      url: "/api/inventory/update-stock",
      desc: "【高权接口】按 SN 发起 ERP 扫码入库、出库或移库流转",
      curl: `curl -X POST 'https://cdgpu.cn/api/inventory/update-stock' \\
-H 'Content-Type: application/json' \\
-d '{"sn": "SN4090EXAMPLE", "mode": "出库", "handler": "网站API"}'`,
      payload: { sn: "SN4090EXAMPLE", mode: "出库", handler: "网站API" }
    },
    "get-prices": {
      method: "GET",
      url: "/api/prices",
      desc: "抓取回收一号店当前的每日官方公开报价和行情波动走势",
      curl: "curl -X GET 'https://cdgpu.cn/api/prices'",
      payload: null
    },
    "update-price": {
      method: "POST",
      url: "/api/prices/update-price",
      desc: "【高权接口】按 ERP 商品 ID 同步预计出货价，网页展示库存售价时使用",
      curl: `curl -X POST 'https://cdgpu.cn/api/prices/update-price' \\
-H 'Content-Type: application/json' \\
-d '{"productId": "SP-001", "estSellPrice": 18880, "priceSource": "外部行情API"}'`,
      payload: { productId: "SP-001", estSellPrice: 18880, priceSource: "外部行情API" }
    },
    "test-pc-builder": {
      method: "POST",
      url: "/api/pc-builder/build",
      desc: "整机算力微调验证：检查各配件间物理规格、接口插槽及供电额定功率的物理兼容情况",
      curl: `curl -X POST 'https://cdgpu.cn/api/pc-builder/build' \\
-H 'Content-Type: application/json' \\
-d '{"cpuId": "cpu-01", "gpuId": "gpu-02", "mbId": "mb-01"}'`,
      payload: { cpuId: "cpu-01", gpuId: "gpu-02", mbId: "mb-01" }
    }
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(endpointConfig[selectedEndpoint].curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecuteRequest = async () => {
    setLoading(true);
    setResponseJson("// 正在建立HTTP连接，向一号店网关节点推送并解析响应报文...");
    const config = endpointConfig[selectedEndpoint];
    try {
      let options: RequestInit = {
        method: config.method,
        headers: { "Content-Type": "application/json" }
      };
      
      if (config.payload) {
        options.body = JSON.stringify(config.payload);
      }

      const data = await apiFetch<unknown>(config.url, options);
      setResponseJson(JSON.stringify(data, null, 2));
    } catch (err) {
      setResponseJson(JSON.stringify({
        success: false,
        error: "网络连接失败",
        message: "无法接入本机Express端点服务，请在开发工具中确认启动和端口配置。"
      }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="api-hub" className="py-20 bg-white border-b border-slate-200 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Titles */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 sm:mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
            <Terminal className="h-3.5 w-3.5" /> 开放级 API 云对接中心
          </span>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight sm:text-4xl">
            提供标准可对接 RESTful 接口
          </h2>
          <p className="text-slate-500 text-sm max-w-2xl mx-auto leading-relaxed">
            支持成都市区仓储联锁、微信群报价机器人、以及第三方ERP库存管理系统无缝打通。可通过下方沙箱组件测试每一个路由输出JSON明细。
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left: Endpoint Selector and description */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="space-y-4">
              <span className="text-xs tracking-widest text-slate-400 uppercase font-black block">
                开放式 API 网关目录
              </span>

              {/* API Buttons */}
              <div className="space-y-2.5">
                {(Object.keys(endpointConfig) as Array<keyof typeof endpointConfig>).map((key) => {
                  const active = selectedEndpoint === key;
                  const item = endpointConfig[key];
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedEndpoint(key);
                        setResponseJson("");
                      }}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                        active
                          ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10"
                          : "bg-white text-slate-800 border-slate-200 hover:border-blue-300"
                      }`}
                    >
                      <span className={`font-mono font-black text-xs uppercase px-2 py-0.5 rounded ${
                        active ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-700"
                      }`}>
                        {item.method}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="font-mono text-xs font-bold block truncate">
                          {item.url}
                        </span>
                        <span className={`text-xs block mt-0.5 ${active ? "text-blue-150" : "text-slate-400"}`}>
                          {item.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* General integration guideline card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-3 text-xs leading-normal">
              <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-slate-900 block font-sans">
                  网页 API 网关测试说明
                </span>
                <p className="text-slate-500">
                  前端、小程序和第三方页面统一请求本站 /api，由网站后端携带 ERP Open API Token 转发到进销存系统；生产 Token 只保存在服务端环境变量中。
                </p>
              </div>
            </div>
          </div>

          {/* Right: Code Sandbox Panel */}
          <div className="lg:col-span-7 bg-slate-950 rounded-3xl border border-slate-850 p-6 flex flex-col justify-between min-h-[460px] relative overflow-hidden">
            <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-blue-500/5 blur-3xl" />
            
            <div className="space-y-5 relative z-10 flex-1 flex flex-col">
              
              {/* Box Top Header buttons */}
              <div className="flex justify-between items-center bg-slate-900 rounded-xl px-4 py-3 border border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="h-3 w-3 bg-rose-500 rounded-full" />
                    <span className="h-3 w-3 bg-amber-500 rounded-full" />
                    <span className="h-3 w-3 bg-emerald-500 rounded-full" />
                  </div>
                  <span className="text-xs text-slate-400 ml-2">终端控制台沙箱</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCurl}
                    className="flex items-center gap-1 hover:bg-slate-800 text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-black font-mono transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        CURL 格式
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleExecuteRequest}
                    disabled={loading}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-[10.5px] font-black transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Play className="h-3.5 w-3.5 fill-current" />
                    )}
                    安全执行 Request
                  </button>
                </div>
              </div>

              {/* CURL viewer block */}
              <div className="space-y-1.5">
                <span className="text-xs text-slate-450 uppercase font-black font-mono block">CURL 请求模型预览</span>
                <pre className="p-3 bg-slate-900 rounded-xl text-xs font-mono text-slate-300 leading-normal border border-slate-850 overflow-x-auto whitespace-pre">
                  {endpointConfig[selectedEndpoint].curl}
                </pre>
              </div>

              {/* LIVE Response output JSON viewer */}
              <div className="flex-1 flex flex-col space-y-1.5 text-left">
                <span className="text-xs text-slate-450 uppercase font-black font-mono block">JSON 格式响应报文 (`Response`)</span>
                <pre className="flex-1 p-4 bg-slate-900 rounded-xl text-xs font-mono text-emerald-400 leading-normal border border-slate-850 overflow-y-auto whitespace-pre h-48 max-h-64">
                  {responseJson || `// 请在上方点击 [安全执行 Request] 即可抓取真实 Express 物理后台返回的 JSON 序列化对账属性... \n// 模拟返回格式:\n{\n  "success": true,\n  "shop": "成都显卡一号店"\n}`}
                </pre>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
