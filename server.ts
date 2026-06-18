import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

// ----------------------------------------------------
// Type Definitions for Inventory and PC Builder
// ----------------------------------------------------
export interface InventoryItem {
  id: string;
  name: string;
  category: "GPU" | "CPU" | "Motherboard" | "RAM" | "SSD" | "PSU" | "Case" | "Cooler" | "Accessories";
  price: number; // RMB
  quantity: number;
  condition: "全新" | "99新" | "95新" | "90新";
  specs: string;
  status: "有货" | "库存紧张" | "缺货";
  pinCode?: string; // e.g. LGA1700 or AM5 for motherboard/CPU compatibility
  ramType?: "DDR4" | "DDR5" | "ECC DDR5"; // RAM compatibility
  wattage?: number; // Power draw for components or supply output for PSU
}

// ----------------------------------------------------
// Mock Data (Real-time DB mockup in memory)
// ----------------------------------------------------
const INITIAL_INVENTORY: InventoryItem[] = [
  // GPUs
  { id: "gpu-01", name: "微星 RTX 5090 SUPRIM X 32G", category: "GPU", price: 29500, quantity: 2, condition: "全新", specs: "32GB GDDR7 | 显存带宽高达 1.8 TB/s", status: "库存紧张", wattage: 600 },
  { id: "gpu-02", name: "影驰 RTX 4090 金属大师 24G", category: "GPU", price: 18800, quantity: 5, condition: "全新", specs: "24GB GDDR6X | 经典全金属无光 shroud", status: "有货", wattage: 450 },
  { id: "gpu-03", name: "七彩虹 RTX 4090 Vulcan OC 24G", category: "GPU", price: 19500, quantity: 3, condition: "99新", specs: "附带原盒及旋转磁吸小副屏(极品成色)", status: "有货", wattage: 450 },
  { id: "gpu-04", name: "华硕 ROG STRIX RTX 4080 SUPER 16G", category: "GPU", price: 9200, quantity: 8, condition: "全新", specs: "16GB GDDR6X | 神光同步顶级非公", status: "有货", wattage: 320 },
  { id: "gpu-05", name: "影驰 RTX 3090 24G 骁将", category: "GPU", price: 6100, quantity: 12, condition: "95新", specs: "24GB 大显存 | 深度学习入门必选(包无矿无啸叫)", status: "有货", wattage: 350 },
  { id: "gpu-06", name: "NVIDIA RTX A6000 48G 专业计算卡", category: "GPU", price: 25500, quantity: 4, condition: "99新", specs: "48GB GDDR6 显存 | 单Slot 鼓风机静音散热", status: "有货", wattage: 300 },
  { id: "gpu-07", name: "NVIDIA RTX A5000 24G 专业计算卡", category: "GPU", price: 15200, quantity: 6, condition: "95新", specs: "24GB GDDR6 | 深度学习中大型训练极稳", status: "有货", wattage: 230 },
  
  // CPUs
  { id: "cpu-01", name: "Intel 酷睿 i9-14900K 盒装", category: "CPU", price: 4199, quantity: 7, condition: "全新", specs: "24核32线程 | 睿频达 6.0GHz", status: "有货", pinCode: "LGA1700", wattage: 253 },
  { id: "cpu-02", name: "AMD 锐龙 7 7800X3D 散片", category: "CPU", price: 2799, quantity: 4, condition: "全新", specs: "8核16线程 | 3D V-Cache 游戏神器", status: "库存紧张", pinCode: "AM5", wattage: 120 },
  { id: "cpu-03", name: "Intel 酷睿 i7-14700K 散片", category: "CPU", price: 2599, quantity: 15, condition: "全新", specs: "20核28线程 | 主流游戏生产力高性价比", status: "有货", pinCode: "LGA1700", wattage: 125 },
  { id: "cpu-04", name: "AMD 锐龙 9 7950X 盒装", category: "CPU", price: 3499, quantity: 6, condition: "全新", specs: "16核32线程 | 算力多开/大模型微调首选", status: "有货", pinCode: "AM5", wattage: 170 },

  // Motherboards
  { id: "mb-01", name: "华硕 ROG MAXIMUS Z790 HERO", category: "Motherboard", price: 4599, quantity: 3, condition: "全新", specs: "LGA1700 | 豪华20+1供电排布，支持 DDR5", status: "有货", pinCode: "LGA1700", ramType: "DDR5" },
  { id: "mb-02", name: "微星 MAG B760M MORTAR WIFI II", category: "Motherboard", price: 1099, quantity: 20, condition: "全新", specs: "LGA1700 | 经典迫击炮，支持高频 DDR5", status: "有货", pinCode: "LGA1700", ramType: "DDR5" },
  { id: "mb-03", name: "华硕 ROG STRIX X670E-A GAMING WIFI", category: "Motherboard", price: 2799, quantity: 5, condition: "全新", specs: "AM5 插槽 | 银白机能吹雪系列，DDR5", status: "有货", pinCode: "AM5", ramType: "DDR5" },
  { id: "mb-04", name: "微星 MAG B650M MORTAR WIFI", category: "Motherboard", price: 1199, quantity: 18, condition: "全新", specs: "AM5 插槽 | 扎实超频用料，DDR5 专属", status: "有货", pinCode: "AM5", ramType: "DDR5" },

  // RAMs
  { id: "ram-01", name: "芝奇 幻锋戟 RGB DDR5 6000MHz 64G(32Gx2)", category: "RAM", price: 1549, quantity: 12, condition: "全新", specs: "高性能 C30 低时序颗粒 | 独有科技感导光条", status: "有货", ramType: "DDR5" },
  { id: "ram-02", name: "美商海盗船 复仇者 DDR5 5600MHz 32G(16Gx2)", category: "RAM", price: 749, quantity: 25, condition: "全新", specs: "静音无光曜石黑 | 精选长跑稳定性极佳", status: "有货", ramType: "DDR5" },
  { id: "ram-03", name: "三星 ECC REG DDR5 4800MHz 128GB 大单条", category: "RAM", price: 3400, quantity: 8, condition: "全新", specs: "服务器专属 ECC 纠错注册内存 | AI大型训练不崩", status: "有货", ramType: "ECC DDR5" },

  // SSD
  { id: "ssd-01", name: "三星 990 Pro 2TB M.2 NVMe (带散热片)", category: "SSD", price: 1399, quantity: 30, condition: "全新", specs: "至强 PCIe 4.0 旗舰 | 连续读取 7450 MB/s", status: "有货" },
  { id: "ssd-02", name: "致态 TiPlus7100 2TB NVMe M.2", category: "SSD", price: 899, quantity: 45, condition: "全新", specs: "长江存储原厂颗粒 | 高纯度无缓寿命神盘", status: "有货" },

  // PSUs
  { id: "psu-01", name: "美商海盗船 RM1000x Shift 1000W 金牌", category: "PSU", price: 1349, quantity: 10, condition: "全新", specs: "金牌全模组 | 侧面模组线口装机极便 / PCIe 5.0 compatible", status: "有货", wattage: 1000 },
  { id: "psu-02", name: "鑫谷 昆仑 KL-1250G ATX3.0 1250W 纯白", category: "PSU", price: 1199, quantity: 6, condition: "全新", specs: "金牌全模组压制5090 | 标配原装原生 600W 12VHPWR 线材", status: "有货", wattage: 1250 },
  { id: "psu-03", name: "长城 巨龙 GW-2000 2000W 服务器金牌分流", category: "PSU", price: 1999, quantity: 4, condition: "99新", specs: "矿潮已过原厂重封 | 完美承载4路A4000或2路4090算力负荷", status: "有货", wattage: 2000 },

  // Coolers
  { id: "cooler-01", name: "瓦尔基里 VK V360 黑色一体式水冷", category: "Cooler", price: 699, quantity: 8, condition: "全新", specs: "配备智能液晶监测屏 | 超快双陶瓷轴承排热", status: "有货" },
  { id: "cooler-02", name: "猫头鹰 NH-D15 Chromax.black 旗舰双塔双扇", category: "Cooler", price: 899, quantity: 5, condition: "全新", specs: "顶级风冷 | 长跑极致静音保障，零断漏水风险", status: "有货" },

  // Cases
  { id: "case-01", name: "联力 O11 Dynamic EVO 玻璃全海景房", category: "Case", price: 999, quantity: 12, condition: "全新", specs: "左面/前面极致折角无侧柱 | 支持双卡显存长显卡竖装", status: "有货" },
  { id: "case-02", name: "华硕 ROG Hyperion 创世神全塔旗舰机箱", category: "Case", price: 2999, quantity: 2, condition: "全新", specs: "X型铝合金外骨骼 | 双电源位超大仓布局，大模型堆料战机", status: "库存紧张" }
];

// Let's duplicate list in RAM for state persistence during process execution
let currentInventory = [...INITIAL_INVENTORY];

export interface GpuPrice {
  name: string;
  category: 'gaming' | 'ai' | 'both';
  basePrice: string; // e.g., "18xxx" or "18,500 - 19,500"
  trend: 'up' | 'down' | 'stable';
  popular?: boolean;
  specs: {
    vram: string; // e.g., "24GB GDDR6X"
    tdp: string; // e.g., "450W"
    cuda?: string; // CUDA cores count
  };
}

const INITIAL_PRICES: GpuPrice[] = [
  {
    name: 'NVIDIA RTX 5090',
    category: 'both',
    basePrice: '28xxx',
    trend: 'stable',
    popular: true,
    specs: { vram: '32GB GDDR7', tdp: '600W', cuda: '21760' }
  },
  {
    name: 'NVIDIA RTX 4090',
    category: 'both',
    basePrice: '18xxx',
    trend: 'down',
    popular: true,
    specs: { vram: '24GB GDDR6X', tdp: '450W', cuda: '16384' }
  },
  {
    name: 'NVIDIA RTX 4080 SUPER',
    category: 'gaming',
    basePrice: '82xx',
    trend: 'stable',
    specs: { vram: '16GB GDDR6X', tdp: '320W', cuda: '10240' }
  },
  {
    name: 'NVIDIA RTX 4080',
    category: 'gaming',
    basePrice: '71xx',
    trend: 'down',
    specs: { vram: '16GB GDDR6X', tdp: '320W', cuda: '9728' }
  },
  {
    name: 'NVIDIA RTX 3090',
    category: 'both',
    basePrice: '58xx',
    trend: 'stable',
    specs: { vram: '24GB GDDR6X', tdp: '350W', cuda: '10496' }
  },
  {
    name: 'NVIDIA RTX PRO 6000 工作站',
    category: 'ai',
    basePrice: '51xxx',
    trend: 'stable',
    popular: true,
    specs: { vram: '48GB GDDR6', tdp: '300W', cuda: '18176' }
  },
  {
    name: 'NVIDIA RTX PRO 6000 服务器',
    category: 'ai',
    basePrice: '55xxx',
    trend: 'stable',
    specs: { vram: '48GB GDDR6', tdp: '300W', cuda: '18176' }
  },
  {
    name: 'NVIDIA RTX A6000',
    category: 'ai',
    basePrice: '24500',
    trend: 'stable',
    popular: true,
    specs: { vram: '48GB GDDR6', tdp: '300W', cuda: '10752' }
  },
  {
    name: 'NVIDIA RTX A5000',
    category: 'ai',
    basePrice: '12500',
    trend: 'stable',
    specs: { vram: '24GB GDDR6', tdp: '230W', cuda: '8192' }
  },
  {
    name: 'NVIDIA RTX A4000',
    category: 'ai',
    basePrice: '3950',
    trend: 'down',
    specs: { vram: '16GB GDDR6', tdp: '140W', cuda: '6144' }
  }
];

let currentPrices = [...INITIAL_PRICES];

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsing and CORS
  app.use(express.json());

  // ----------------------------------------------------
  // API Routes
  // ----------------------------------------------------
  
  // Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      shop: "成都显卡一号店 (Chengdu GPU No.1 Studio)"
    });
  });

  // Category list and complete stock catalog (Real-time Inventory query)
  app.get("/api/inventory", (req, res) => {
    const { category, inStock } = req.query;
    let filtered = [...currentInventory];

    if (category) {
      filtered = filtered.filter(item => item.category.toLowerCase() === (category as string).toLowerCase());
    }

    if (inStock === "true") {
      filtered = filtered.filter(item => item.quantity > 0);
    }

    res.json({
      success: true,
      lastUpdated: new Date().toLocaleTimeString(),
      totalCount: currentInventory.length,
      count: filtered.length,
      items: filtered
    });
  });

  // REST API: Change stock level for specific items (facilitating external POS software integration)
  app.post("/api/inventory/update-stock", (req, res) => {
    const { id, quantityChange, setQuantity } = req.body;
    const item = currentInventory.find(i => i.id === id);

    if (!item) {
      return res.status(404).json({ success: false, error: "未找到对应的库存配件" });
    }

    if (typeof setQuantity === "number") {
      item.quantity = Math.max(0, setQuantity);
    } else if (typeof quantityChange === "number") {
      item.quantity = Math.max(0, item.quantity + quantityChange);
    }

    // Refresh stock tags
    if (item.quantity === 0) {
      item.status = "缺货";
    } else if (item.quantity <= 3) {
      item.status = "库存紧张";
    } else {
      item.status = "有货";
    }

    res.json({
      success: true,
      message: `配件 [${item.name}] 库存已成功更新。`,
      updatedItem: item
    });
  });

  // GET /api/prices - Retrieve today's pricing quotes
  app.get("/api/prices", (req, res) => {
    res.json({
      success: true,
      lastUpdated: new Date().toLocaleTimeString(),
      totalCount: currentPrices.length,
      prices: currentPrices
    });
  });

  // POST /api/prices/update-price - Update a specific model's price and trend from ERP
  app.post("/api/prices/update-price", (req, res) => {
    const { name, basePrice, trend } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: "请提供英伟达显卡型号名称 (name)" });
    }

    const item = currentPrices.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (!item) {
      return res.status(404).json({ success: false, error: `未找到名称为 [${name}] 的对应显卡型号` });
    }

    if (basePrice !== undefined) {
      item.basePrice = String(basePrice);
    }
    if (trend !== undefined) {
      if (trend === "up" || trend === "down" || trend === "stable") {
        item.trend = trend;
      } else {
        return res.status(400).json({ success: false, error: "trend 参数必须是 'up' | 'down' | 'stable' 之一" });
      }
    }

    res.json({
      success: true,
      message: `显卡 [${item.name}] 的行情价格已成功通过 ERP 系统同步更新！`,
      updatedPrice: item
    });
  });

  // GET PC Parts - Returns parts list explicitly for the PC Builder categories
  app.get("/api/pc-parts", (req, res) => {
    res.json({
      success: true,
      categories: ["CPU", "GPU", "Motherboard", "RAM", "SSD", "PSU", "Cooler", "Case"],
      parts: currentInventory
    });
  });

  // POST PC Builder: Validate Build list and calculate parameters
  app.post("/api/pc-builder/build", (req, res) => {
    const { cpuId, gpuId, mbId, ramId, ssdId, psuId, coolerId, caseId } = req.body;

    const partsMap = {
      cpu: currentInventory.find(i => i.id === cpuId),
      gpu: currentInventory.find(i => i.id === gpuId),
      mb: currentInventory.find(i => i.id === mbId),
      ram: currentInventory.find(i => i.id === ramId),
      ssd: currentInventory.find(i => i.id === ssdId),
      psu: currentInventory.find(i => i.id === psuId),
      cooler: currentInventory.find(i => i.id === coolerId),
      case: currentInventory.find(i => i.id === caseId)
    };

    const warnings: string[] = [];
    const successes: string[] = [];
    let totalPrice = 0;
    let totalWattageNeed = 0;
    let actualPowerSupply = 0;

    // Accumulate base prices
    let selectedCount = 0;
    let outOfStockCount = 0;
    
    Object.entries(partsMap).forEach(([key, part]) => {
      if (part) {
        selectedCount++;
        totalPrice += part.price;
        if (part.category === "CPU" || part.category === "GPU") {
          totalWattageNeed += part.wattage || 100;
        } else {
          totalWattageNeed += 25; // standard base load for board, RAM, fan RGB
        }

        // Real-time Inventory matching check
        if (part.quantity <= 0) {
          outOfStockCount++;
          warnings.push(`❌ 缺货警报: 您选配的 ${part.category === "CPU" ? "处理器" : part.category === "GPU" ? "显卡" : part.category === "Motherboard" ? "主板" : part.category === "RAM" ? "内存" : part.category === "SSD" ? "固态硬盘" : part.category === "PSU" ? "电源" : part.category === "Cooler" ? "散热" : "机箱"} [${part.name}] 武侯实体总仓目前显示缺货中，我们将优先调度周边转网，建议更改为其它现货！`);
        } else if (part.quantity <= 3) {
          warnings.push(`⚠️ 货源紧张: 所选的 [${part.name}] 今日库存极度紧张，当前仅存 ${part.quantity} 件，建议尽快提报锁定！`);
        }
      }
    });

    if (selectedCount > 0 && outOfStockCount === 0) {
      successes.push(`✅ 货源充足: 已调配核验武侯大仓，所选 ${selectedCount} 款软硬件组件目前均有全新现货充足，可闪电装配发货！`);
    }

    // 1. CPU & Motherboard Pin compatibility
    if (partsMap.cpu && partsMap.mb) {
      if (partsMap.cpu.pinCode !== partsMap.mb.pinCode) {
        warnings.push(`⚠️ 兼容警告: 所选CPU [${partsMap.cpu.name}] 使用 ${partsMap.cpu.pinCode} 接口，但主板规格为 ${partsMap.mb.pinCode}。针脚针距不配，无法插入安装！`);
      } else {
        successes.push(`✅ CPU 与主板物理插槽相互吻合 (${partsMap.cpu.pinCode})`);
      }
    }

    // 2. RAM & Motherboard type compatibility
    if (partsMap.ram && partsMap.mb) {
      if (partsMap.mb.ramType && partsMap.ram.ramType && partsMap.mb.ramType !== partsMap.ram.ramType) {
        warnings.push(`⚠️ 兼容警告: 所选主板适配 ${partsMap.mb.ramType} 内存，而您选配了 ${partsMap.ram.ramType}。卡槽及运行电压不相容！`);
      } else {
        successes.push(`✅ 内存代数与主板完美相融 (${partsMap.ram.ramType || "DDR5"})`);
      }
    }

    // 3. Power Supply validation
    if (partsMap.psu) {
      actualPowerSupply = partsMap.psu.wattage || 0;
      const marginWattage = Math.round(totalWattageNeed * 1.25); // recommend 25% overhead
      if (actualPowerSupply < totalWattageNeed) {
        warnings.push(`❌ 电源警告: 选配电源额定功率仅为 ${actualPowerSupply}W，整机极限拉载预计需要 ${totalWattageNeed}W。通电极易触发过流断电保护！`);
      } else if (actualPowerSupply < marginWattage) {
        warnings.push(`⚠️ 负载提醒: 电源功率为 ${actualPowerSupply}W，虽理论能带动最大额定 ${totalWattageNeed}W，但未预留 25% 安全余量 (推荐配备 ${marginWattage}W 以上电源)`);
      } else {
        successes.push(`✅ 电源供应富裕，完美应对满载跑分拉负荷 (${actualPowerSupply}W)`);
      }
    }

    // 4. Server-grade deep learning hardware assessment
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

    res.json({
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
        case: partsMap.case?.name || "未选配"
      }
    });
  });

  // POST PC Builder Quote submission
  app.post("/api/pc-builder/quote", (req, res) => {
    const { buildData, userName, userPhone, userWechat } = req.body;
    
    if (!userName || !userPhone) {
      return res.status(400).json({ success: false, error: "请填写联系人姓名与电话号码，方便客服上门送货及质保！" });
    }

    const quoteId = `CD-GPU-${Date.now().toString().slice(-6)}`;
    
    res.json({
      success: true,
      quoteId,
      message: "🎉 您的在线定制装机方案已提报至后台一号仓库！客服专家团队已锁定您的选配方案，将在3分钟内电话或微信联系您落实最终加装折扣与送件测试服务！",
      summary: {
        quoteId,
        userName,
        userPhone,
        userWechat: userWechat || "未填写",
        priceEstimate: buildData ? buildData.totalPrice : 0,
        submittedAt: new Date().toLocaleString()
      }
    });
  });

  // ----------------------------------------------------
  // Vite Integration & Asset Handling
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Express Backend Server] Booted successfully and running on http://localhost:${PORT}`);
  });
}

startServer();
