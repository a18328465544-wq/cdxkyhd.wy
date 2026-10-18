import type { GpuPrice, InventoryItem } from "../types/catalog.js";

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

export const mockCatalogStore = {
  getInventory: () => currentInventory,
  replaceInventory: (items: InventoryItem[]) => { currentInventory = items; },
  getPrices: () => currentPrices,
};
