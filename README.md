# 成都显卡一号店网站

这个仓库已经整理成前后端分离结构：

- `frontend/`: React + Vite 网站页面
- `backend/`: Express API Gateway，负责对接 ERP 后端
- `shared/`: 前后端共享 TypeScript 类型

## 模块边界

- 前端 `routes/` 管理独立页面路径与页面容器，首页内容由 `components/HomePage.tsx` 组合；页面仍按需加载。
- 后端 `routes/` 按健康检查、跑分、SN、库存行情和装机拆分 API 注册；论坛路由继续独立维护。
- `services/erpCatalogService.ts` 封装 ERP Open API 与商品映射；`services/mockCatalogStore.ts` 只用于未配置 ERP 时的开发回退。
- 这是单体应用内的模块化拆分，不拆服务。真实库存与商品数据仍以 ERP 为准，论坛仍使用独立持久化目录。

## 本地启动

```bash
npm install
npm run dev
```

默认端口：

- 前端: `http://localhost:5173`
- 后端: `http://localhost:3001`

开发环境里，前端访问 `/api/*` 会通过 Vite proxy 转发到后端。

## 接 ERP 后端

复制环境变量：

```bash
cp .env.example .env
```

填入真实 ERP Open API 地址：

```bash
ERP_BASE_URL=https://gpu-erp.cdgpu.cn/api/open
ERP_API_KEY=your-token
```

后端会优先通过 ERP Open API 读取和同步这些能力：

- `GET /api/inventory`: 从 ERP 库存汇总转换为网站库存卡片
- `POST /api/inventory/update-stock`: 按 SN 调用 ERP 入库/出库/移库扫码流转
- `GET /api/prices`: 从 ERP 行情参考的指导回收价生成网页行情展示，缺少行情卡时才回退库存汇总
- `POST /api/prices/update-price`: 按 `productId` 同步 ERP 商品预计出货价
- `GET /api/pc-parts`: 从 ERP 库存汇总生成装机配件清单
- `POST /api/pc-builder/build`: 网站本地做装机兼容性和价格计算
- `POST /api/pc-builder/quote`: 网站本地生成报价咨询单

如果没有设置 `ERP_BASE_URL`，后端会使用本地 mock fallback，方便开发和预览。

## 显卡 SN 出厂日期查询

网站的 SN 查询由 `shared/src/gpuSnDate.ts` 规则引擎提供，不依赖 ERP 是否配置完成：

- `GET /api/gpu-sn/rules`: 返回品牌、规则状态、证据说明和官方售后入口
- `POST /api/gpu-sn/parse`: 请求体为 `{ "brandId": "gigabyte", "sn": "...", "productModel": "RTX 5090" }`

解析结果会区分规则推算、部分识别、格式无效和待验证；只有已有依据的格式才返回日期范围。ERP 后续接入时应复用 `@cdxkyhd/shared` 解析引擎，避免维护第二份 SN 规则。

## 显卡性能天梯数据源

- 游戏 FPS 来自 Tom's Hardware；Blender Cycles 来自 Blender Open Data。两者仍按各自版本和测试项目独立展示。
- Geekbench 7 Vulkan / OpenCL / CUDA 使用 Geekbench Browser API。需配置 `GEEKBENCH_BROWSER_API_KEY`，并在确认可展示成绩后将 `GEEKBENCH_REDISPLAY_ALLOWED=true`。后端按型号查询最近最多 100 条有效可见结果，分别取中位数，每 6 小时同步；显存型号、移动版及 D 版不会混配。
- 3DMark Time Spy Graphics / Port Royal 不抓取公开网页。需将获得展示授权、仅含有效默认频率成绩的导出文件放到持久路径，并配置 `THREE_DMARK_RANKING_DATA_FILE` 和 `THREE_DMARK_REDISPLAY_ALLOWED=true`。文件格式为 JSON，顶层字段为 `schemaVersion: 1`、`sourceUrl`（3dmark.com URL）、`sourceUpdatedAt`（ISO 时间）、`filtering: "valid-stock-only"` 和 `models`；每款显卡包含 `model`、`timeSpyGraphicsScores` 与/或 `portRoyalScores` 数组。后端取每组分数的中位数并记录样本数，每 15 分钟检查文件变化。
- 未配置授权或数据文件时，网站保留对应模式入口但显示待接入状态，不生成估算成绩。新增跑分不会和 FPS 混成一个总分。

## 玩家交流社区

- 网站入口：`/community`；审核入口：`/community/manage`
- 游客可浏览、搜索和查看话题；注册社区账号（用户名和密码）后可发帖、回复、上传图片和举报。当前不依赖短信服务，暂不支持自助找回密码。
- 新帖子和回复默认进入审核队列，通过后才公开。帖子支持五类硬件/服务话题、标签、图片及 ERP 在售型号关联。
- 社区数据单独存放在 `FORUM_DATA_DIR`，不写入 ERP 库存数据。首版使用适合单实例低流量的 JSON 持久存储；部署时需将目录放在持久磁盘并纳入备份。若运行多实例或社区规模增长，应迁移到独立 PostgreSQL 数据库。
- 生产登录需要稳定的 `FORUM_SESSION_SECRET`；审核后台另需 `FORUM_ADMIN_PASSWORD`。会话密钥至少 32 字节，管理员密码至少 16 个字符。密码使用带随机盐的 scrypt 派生值存储，不保存明文。
- 如果服务只经由一层自有反向代理访问，可设置 `TRUST_PROXY=1`，让短信限流使用真实客户端地址；不要在可被绕过的部署中启用。
- 论坛图片只接受 JPG、PNG、WebP，单张不超过 5MB。生产服务器需允许 `FORUM_DATA_DIR` 下的图片目录持久写入。

## 构建与检查

```bash
npm run lint
npm run build
npm start
```

## 网站访问统计

- 在百度统计中添加网站并获取跟踪代码，将 `hm.js?` 后的 32 位站点 ID 配置到项目根目录 `.env` 的 `VITE_BAIDU_TONGJI_ID`。
- 前端构建会读取根目录 `.env`；统计脚本只在生产构建中加载。单页应用的 History 路由会记录页面访问，首页锚点跳转不会重复计为页面访问。
- 安装后在百度统计“主页 → 网站概况”查看今日 PV、UV、IP；在“报告 → 流量分析 → 网站流量趋势分析”按天查看趋势。
- 统计从启用并发布代码后开始，不能补录启用前的数据。

## 算力租赁计算器

- 入口：`/tools/hashrate-rental`，也可从硬件工具列表和页脚进入。
- 纯浏览器计算，支持租入算力、自有设备出租两种模式，小时、日单价与订单总价；收入选填。服务费按租金或折算后收入收取，电费不重复计入已含电的租价。
- 可填写设备购置、部署等初始投入及计划运营天数，查看每日、30 日、365 日经营净收益、静态回本周期、计划期投入后结余及资本回报率；初始投入不重复计入经营成本。净收益非正时不计算回本天数，外推按同等收入与成本连续运行。
- 收入按有效交付率折算，租金与电费按全租期计算；不支持自动推断整日、阶梯或最低消费规则，此类合同需先换算为订单总价。
- 计算模型：`frontend/src/lib/rentalCalculator.js`；检查：`npm run test:rental-calculator -w frontend`。


### PRL 珍珠币挖矿计算器

- 独立入口 `/tools/prl-mining`，与 `/tools/hashrate-rental` 在工具中心和分类导航并列。
- 算力模式：单卡 TH/s × 数量 × 每 TH/s 的 24 小时 PRL 产出 × 小时/24 × 有效比例 × (1−软件抽水) × (1−矿池费)。
- 实际到账模式：直接使用整组设备自然日净到账量，不再扣产出相关费用，不再乘卡数或时长；时长仍用于电费。
- 每日用电 = [(单卡 W × 数量 + 配套 W) × 运行小时 + 整机停挖 W × (24−运行小时)] / 1000。
- 每日净收益 = 净产币量 × 人民币单价 × (1−折算费用率) − 电费 − 其他每日费用。
- 静态回本 = 整组初始投入 / 正的每日净收益；计划结余只扣一次初始投入，不计残值。币价支持自动获取与手动设置；产出和费用由用户填写，无 GPU 保证算力预设。

- 行情接口 `GET /api/market/prl` 固定查询 CoinGecko `pearl-2`（Pearl Research；PRL / PEARL），返回 CNY、USD、24 小时人民币变化率、报价时间和状态。
- 服务端缓存 60 秒并合并并发请求；失败后 30 秒内不重试，10 秒上游超时。客户端每分钟刷新，手动价格不会被刷新覆盖。行情失败或报价超过 15 分钟时停止自动参与计算；最多展示 24 小时内历史报价并明确标记。
- 可选 `COINGECKO_DEMO_API_KEY` 仅配置在服务端。无 Key 的公开接口已完成本地联通；正式使用可能遇到接口额度限制。来源文档：https://docs.coingecko.com/demo/reference/simple-price 。

### 两类计算器的完整回本展示

- 统一回本面板置于主要结果区，设备投入和计划天数置于表单顶部；支持 30、90、180、365 天快捷计划。
- 回本天数 / 月数 / 年数、完整运营天数、计划内能否回本、预计回收投入比例（预测而非实际回款）、计划结束后仍需运营天数。
- 计划期资金缺口 = max(初始投入 − 计划期经营净收益, 0)，包含经营亏损；目标日净收益 = 初始投入 / 计划天数。
- 30、90、180、365 天及自定义计划对比表分别计算累计经营净收益与扣除一次初始投入后的结余，不把各期累计金额再次相加。
- 保留缺少参数、零投入、收支持平、经营亏损和溢出状态；零投入时资本回报率不适用。币价涨跌或租赁收入变动情景同时显示回本天数与月数。
