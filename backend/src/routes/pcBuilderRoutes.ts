import type { Express } from "express";
import type { InventoryItem } from "../types/catalog.js";

interface PcBuilderRouteDependencies {
  getInventory(): InventoryItem[];
  erpConnected: boolean;
  fetchErpParts(query: Record<string, string | string[] | undefined>): Promise<InventoryItem[]>;
  replaceInventory(items: InventoryItem[]): void;
}

export function registerPcBuilderRoutes(app: Express, dependencies: PcBuilderRouteDependencies) {
  app.get("/api/pc-parts", async (req, res) => {
    if (dependencies.erpConnected) {
      try {
        const parts = await dependencies.fetchErpParts(req.query as Record<string, string | string[] | undefined>);
        if (parts.length > 0) dependencies.replaceInventory(parts);
        return res.json({
          success: true,
          source: "erp-open-api",
          mode: "stocked-single-items",
          categories: ["CPU", "GPU", "Motherboard", "RAM", "SSD", "PSU", "Cooler", "Case"],
          parts,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "ERP 装机配件接口请求失败";
        return res.status(502).json({ success: false, error: message });
      }
    }

    return res.json({
      success: true,
      categories: ["CPU", "GPU", "Motherboard", "RAM", "SSD", "PSU", "Cooler", "Case"],
      parts: dependencies.getInventory(),
    });
  });

  app.post("/api/pc-builder/build", (req, res) => {
    const { cpuId, gpuId, mbId, ramId, ssdId, psuId, coolerId, caseId } = req.body;
    const inventory = dependencies.getInventory();
    const partsMap = {
      cpu: inventory.find((item) => item.id === cpuId),
      gpu: inventory.find((item) => item.id === gpuId),
      mb: inventory.find((item) => item.id === mbId),
      ram: inventory.find((item) => item.id === ramId),
      ssd: inventory.find((item) => item.id === ssdId),
      psu: inventory.find((item) => item.id === psuId),
      cooler: inventory.find((item) => item.id === coolerId),
      case: inventory.find((item) => item.id === caseId),
    };

    const warnings: string[] = [];
    const successes: string[] = [];
    let totalPrice = 0;
    let totalWattageNeed = 0;
    let actualPowerSupply = 0;
    let selectedCount = 0;
    let outOfStockCount = 0;

    Object.entries(partsMap).forEach(([, part]) => {
      if (!part) return;
      selectedCount++;
      totalPrice += part.price;
      totalWattageNeed += part.category === "CPU" || part.category === "GPU" ? part.wattage || 100 : 25;

      if (part.quantity <= 0) {
        outOfStockCount++;
        warnings.push(`❌ 缺货警报: 您选配的 ${part.category === "CPU" ? "处理器" : part.category === "GPU" ? "显卡" : part.category === "Motherboard" ? "主板" : part.category === "RAM" ? "内存" : part.category === "SSD" ? "固态硬盘" : part.category === "PSU" ? "电源" : part.category === "Cooler" ? "散热" : "机箱"} [${part.name}] 武侯实体总仓目前显示缺货中，我们将优先调度周边转网，建议更改为其它现货！`);
      } else if (part.quantity <= 3) {
        warnings.push(`⚠️ 货源紧张: 所选的 [${part.name}] 今日库存极度紧张，当前仅存 ${part.quantity} 件，建议尽快提报锁定！`);
      }
    });

    if (selectedCount > 0 && outOfStockCount === 0) {
      successes.push(`✅ 货源充足: 已调配核验武侯大仓，所选 ${selectedCount} 款软硬件组件目前均有全新现货充足，可闪电装配发货！`);
    }

    if (partsMap.cpu && partsMap.mb) {
      if (partsMap.cpu.pinCode !== partsMap.mb.pinCode) {
        warnings.push(`⚠️ 兼容警告: 所选CPU [${partsMap.cpu.name}] 使用 ${partsMap.cpu.pinCode} 接口，但主板规格为 ${partsMap.mb.pinCode}。针脚针距不配，无法插入安装！`);
      } else {
        successes.push(`✅ CPU 与主板物理插槽相互吻合 (${partsMap.cpu.pinCode})`);
      }
    }

    if (partsMap.ram && partsMap.mb) {
      if (partsMap.mb.ramType && partsMap.ram.ramType && partsMap.mb.ramType !== partsMap.ram.ramType) {
        warnings.push(`⚠️ 兼容警告: 所选主板适配 ${partsMap.mb.ramType} 内存，而您选配了 ${partsMap.ram.ramType}。卡槽及运行电压不相容！`);
      } else {
        successes.push(`✅ 内存代数与主板完美相融 (${partsMap.ram.ramType || "DDR5"})`);
      }
    }

    if (partsMap.psu) {
      actualPowerSupply = partsMap.psu.wattage || 0;
      const marginWattage = Math.round(totalWattageNeed * 1.25);
      if (actualPowerSupply < totalWattageNeed) {
        warnings.push(`❌ 电源警告: 选配电源额定功率仅为 ${actualPowerSupply}W，整机极限拉载预计需要 ${totalWattageNeed}W。通电极易触发过流断电保护！`);
      } else if (actualPowerSupply < marginWattage) {
        warnings.push(`⚠️ 负载提醒: 电源功率为 ${actualPowerSupply}W，虽理论能带动最大额定 ${totalWattageNeed}W，但未预留 25% 安全余量 (推荐配备 ${marginWattage}W 以上电源)`);
      } else {
        successes.push(`✅ 电源供应富裕，完美应对满载跑分拉负荷 (${actualPowerSupply}W)`);
      }
    }

    let aiRating = "入门级 AI 生成能力";
    let aiRatingDesc = "可进行中轻量 Stable Diffusion 批量出图或运行 8B 以下中小型语言模型。";
    if (partsMap.gpu) {
      const gpuName = partsMap.gpu.name;
      if (gpuName.includes("5090") || gpuName.includes("A6000")) {
        aiRating = "企业旗舰级算力怪兽";
        aiRatingDesc = "具备极致的 32GB/48GB 巨量显存。完美支持全参数 Llama 3 70B 高速推理、Lora 脚本以及大型多模态工程微调需求！";
      } else if (gpuName.includes("4090") || gpuName.includes("A5000")) {
        aiRating = "先进级 AI 推理生产力";
        aiRatingDesc = "超大 24G 满血显存。ComfyUI 极限高分辨率放大流程及 PyTorch 常见学习工程首选搭配。";
      } else if (gpuName.includes("4080") || gpuName.includes("3090")) {
        aiRating = "专业级本地算力工作站";
        aiRatingDesc = "可无损流畅运作常规大语言模型，Stable Diffusion 单图耗时仅需 seconds 级。";
      }
    }

    return res.json({
      success: true,
      totalPrice,
      totalWattageNeed,
      safetyWattageRecommended: Math.round(totalWattageNeed * 1.25),
      warnings,
      successes,
      aiRating,
      aiRatingDesc,
      selectedSummary: {
        cpu: partsMap.cpu?.name || "未选配",
        gpu: partsMap.gpu?.name || "未选配",
        mb: partsMap.mb?.name || "未选配",
        ram: partsMap.ram?.name || "未选配",
        ssd: partsMap.ssd?.name || "未选配",
        psu: partsMap.psu?.name || "未选配",
        cooler: partsMap.cooler?.name || "未选配",
        case: partsMap.case?.name || "未选配",
      },
    });
  });

  app.post("/api/pc-builder/quote", (req, res) => {
    const { buildData, userName, userPhone, userWechat } = req.body;
    if (!userName || !userPhone) {
      return res.status(400).json({ success: false, error: "请填写联系人姓名与电话号码，方便客服上门送货及质保！" });
    }
    const quoteId = `CD-GPU-${Date.now().toString().slice(-6)}`;
    return res.json({
      success: true,
      quoteId,
      message: "🎉 您的在线定制装机方案已提报至后台一号仓库！客服专家团队已锁定您的选配方案，将在3分钟内电话或微信联系您落实最终加装折扣与送件测试服务！",
      summary: {
        quoteId,
        userName,
        userPhone,
        userWechat: userWechat || "未填写",
        priceEstimate: buildData ? buildData.totalPrice : 0,
        submittedAt: new Date().toLocaleString(),
      },
    });
  });
}
