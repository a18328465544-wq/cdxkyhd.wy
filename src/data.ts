import { GpuPrice, WorkflowStep, Advantage, StationTier, CaseItem, FAQItem, GalleryPhoto } from './types';

export const GPU_PRICES_DATA: GpuPrice[] = [
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

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    step: 1,
    title: '发送显卡信息',
    desc: '提供品牌、型号、成色、SN码、购买时间及烤机截图/视频，以便进行初步判定。'
  },
  {
    step: 2,
    title: '初步估价报价',
    desc: '客服根据当日行情、品牌溢价、保修期和显卡成色，快速给出合理的参考底价。'
  },
  {
    step: 3,
    title: '到店 / 顺丰检测',
    desc: '成都本地支持到店，当面烤机测试；外地支持顺丰到付，到货后全程视频验卡。'
  },
  {
    step: 4,
    title: '现场确价秒打款',
    desc: '检测无误后，现场确认成交，无需预留、拒绝拖账、秒打款到指定账户。'
  }
];

export const ADVANTAGES_DATA: Advantage[] = [
  {
    title: '成都实体门店',
    desc: '拥有真实线下商铺，省去中间网店虚拟套路，到店交易更靠谱，安全性100%。',
    iconName: 'store'
  },
  {
    title: '专业当面检测',
    desc: '提供GPU-Z参数核对、Furmark（甜甜圈）烤机和SN防拆标签核查，公开透明。',
    iconName: 'shieldCheck'
  },
  {
    title: '确认现场秒款',
    desc: '一经检测核查完毕并当场落定，即时转账到账，绝不压款，资金极速落袋。',
    iconName: 'banknote'
  },
  {
    title: '长期坚守高端回收',
    desc: '专营 4090、4080S、3090、A系列计算卡等高端/AI显卡，提供极强资金池吞吐支撑。',
    iconName: 'gem'
  },
  {
    title: '外地顺丰到付',
    desc: '省外贵重商品全部顺丰保价寄送，接收、拆箱与检测环节全程高清视频录制留证。',
    iconName: 'truck'
  },
  {
    title: '每日价格透明',
    desc: '每天根据国内外行情走势、芯片波动，对标源头价格，拒不虚高、诚信报价。',
    iconName: 'trendingUp'
  }
];

export const AI_STATIONS_DATA: StationTier[] = [
  {
    id: 'entry',
    title: '入门 AI 绘图主机',
    subtitle: '适合：AI绘图、轻量大模型、本地部署体验与学术科研新人',
    gpuRecommend: 'RTX 4070 Ti SUPER / RTX 3090 / RTX 4080',
    budgetRange: '1万 - 2万',
    benefits: [
      '完美运行 SD / Fooocus & ComfyUI',
      '轻松运行 Llama 3 (8B) / 7B 级中小型中文模型',
      '千元级水冷，高效抗温差散热',
      '超高性价比，支持日常设计创作者升级需求'
    ]
  },
  {
    id: 'advanced',
    title: '进阶双卡算力主机',
    subtitle: '适合：多卡并行大模型开发、批量 ComfyUI 生成、海量数据集微调',
    gpuRecommend: '双 RTX 3090 24G * 2 (共48G VRAM) / 双 RTX 4090',
    budgetRange: '2万 - 5万',
    benefits: [
      '支持 48GB / 64GB 混合大显存深度学习部署',
      '完美适配 ComfyUI 工作流、批量秒级高清出图',
      '升级高瓦数服务器级金牌电源，保障长跑无死机',
      '提供垂直分体风道和高效安静冷却架构'
    ],
    popular: true
  },
  {
    id: 'professional',
    title: '专业企业级 AI 工作站',
    subtitle: '适合：大型企业商用推理服务、大模型高并发微调、多模态多模型并行',
    gpuRecommend: '多卡 RTX 4090 / A6000 / 专业 AI 计算卡',
    budgetRange: '5万以上',
    benefits: [
      '专属定制的AI高性能液冷或风冷降噪服务器架',
      '最高支持 192GB 巨量多显卡组合，针对 PyTorch 加速优化',
      '高规格主板、企业级高容ECC高速内存与多路M.2高性能阵列',
      '免费配置主流本地环境包，支持上门交付保修期'
    ]
  }
];

export const CLIENT_CASES: CaseItem[] = [
  {
    id: 1,
    tag: '上门店面交易',
    title: '成都武侯区本地客户交易 4080S 显卡、现场自提 RTX 5080 配件',
    desc: '客户张老师上门置换。将原本的影驰4080S在显卡一号店现场当面Furmark烤机。经过15分钟高负荷跑分与外观SN核对，我们给出 6200 元抵扣金，当场为老师配齐并测试全套 RTX 5080 全新高端AI组装机，补差款即刻微信结清。',
    time: '2小时前'
  },
  {
    id: 2,
    tag: '顺丰视频收卡',
    title: '外地老客户极速空运顺丰到付检测 RTX 4090 全包秒款',
    desc: '一位来自深圳的常年合作GPU出租工作室的老板，顺丰加里保价发货 4 张 RTX 4090 到我司。客服收到包裹在监控下开箱视频验卡。11点接货，11点20分拷机验证成功，无拆无修、压力测试无啸叫无坏道，下午11点半将 7.x万 打入老板卡中。',
    time: '昨天'
  },
  {
    id: 3,
    tag: '工作站升级置换',
    title: '四川大学某实验室升级双卡 AI 服务器，4张3080回收折旧',
    desc: '川大材料学院需要升级本地 ComfyUI 与大模型并行测试，联系我们上门。我们上门取走 4 张老款 3080 回收，折现近万元。为实验室升级了一套搭配双 RTX 3090 (共 48G 显存) 的全套液冷 AI 塔式工作站，上门协助其完成 Cuda/PyTorch 部署环境。',
    time: '3天前'
  }
];

export const FAQ_DATA: FAQItem[] = [
  {
    q: '显卡顺丰过来到付安全吗？支持哪些快递？',
    a: '我们强烈建议并支持【顺丰快递到付保价】。我们接到顺丰快递后，会提供全程拆箱过程的超清闭路录屏监控，并开启视频与您本人视频连线当面验卡，确保物品完全无差、安全公开。若是您的卡在路途由快递受损，可按保价索赔，对您没有任何额外经济风险。'
  },
  {
    q: '会存在到了门店临时压价的情况吗？报价是否准确？',
    a: '成都显卡一号店主打诚实守约。只要您前期描述的外观、品牌、型号、购买经历、是否拆修与您的卡片一致，我们给出的估价即是最终结款价。只有当设备在当场测试中发现如：SN金手指对应不上、显卡电容烧毁、拆标已破需要修、严重氧化等前期沟通不符的暗病，我们才会如实讲解成色扣减条件，否则一律按承诺秒付全款。'
  },
  {
    q: '成都市区本地如何看卡、买卖？可以直接到店吗？',
    a: '当然欢迎！您可以直接导航成都市武侯区【天府三街新希望国际B座2507】。带上您的爱卡，店里配备有专业测试台、测试大屏、多卡工作站，可以当面看着我们做 Furmark、3DMark、GPU-Z 等多维度物理和软件测试。当面确认，满意后支持微信/支付宝/银行卡即时秒付现金，喝杯热茶的时间全流程就能结清。'
  },
  {
    q: '目前哪些显卡回收价更好？老款神卡30系列和A系列收吗？',
    a: '当前市场对高端游戏显卡和算力 AI 卡的需求极高。所以 NVIDIA RTX 5090、4090、4080 SUPER、3090、3080 回收价非常坚挺，甚至常有行情上浮！另外，像专业工作站 A6000、A5000、A4000 及 Tesla 系列等企业服务器显卡，我们同样有一手稳定的清算渠道，资金量大，有多少整批收多少。'
  },
  {
    q: '电脑店除了回收可以帮我们装 AI 工作站吗？环境包免费给吗？',
    a: '是的！我们致力于解决一站式硬件需求。我们可以按您的运算规模、模型大小以及整体预算，为您组装一整套运行稳定的 AI 大模型或 ComfyUI 双卡/多卡高端静音主机。所有从本店成交的 AI 工作站客户，均可免费享受全套主流本地部署安装包及一键运行脚本（如 Stable Diffusion、Llama-3 中文体验环境），开机即跑AI！'
  }
];

export const GALLERY_MOCK_PHOTOS: GalleryPhoto[] = [
  {
    tag: '真实店面',
    title: '成都显卡一号店实体商铺门面',
    mockUrl: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80',
    desc: '位于武侯商圈天府三街新希望国际B座，高规格、正规写字楼商铺，设备充足安全客流保障。'
  },
  {
    tag: '专业测试台',
    title: '全开放式高温拷机检测台',
    mockUrl: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=600&q=80',
    desc: '现场大屏直视，支持 GPU-Z 首发真假筛查、Furmark（甜甜圈）长效压力拷机不黑屏。'
  },
  {
    tag: '库存现货',
    title: '4090 与 A 系列高端现货展示',
    mockUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=600&q=80',
    desc: '充足的旗舰显卡资金储备，让每一位来置换、交易的客户在店中均能现测现换。'
  },
  {
    tag: 'AI装机现场',
    title: '企业双卡散热静音风道工作站安装',
    mockUrl: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=600&q=80',
    desc: '对极限制冷、电源大功率长周期负荷深度调校，保证训练过程坚如磐石不掉卡。'
  },
  {
    tag: '顺丰发货区',
    title: '外地客户视频验机拆封及发货区',
    mockUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
    desc: '正规定制防撞充气胶套，支持全景摄影归档，给来自五湖四海的卡友百分百安全交付。'
  },
  {
    tag: '服务茶水台',
    title: '到店客户休闲区 (品茶吃果看测卡)',
    mockUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80',
    desc: '提供免费咖啡茶水、零食，当面检测 10~20 分钟内，您只需稍坐休憩即可收到确认秒款。'
  }
];
