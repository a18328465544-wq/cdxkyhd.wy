# 成都显卡一号店网站

这个仓库已经整理成前后端分离结构：

- `frontend/`: React + Vite 网站页面
- `backend/`: Express API Gateway，负责对接 ERP 后端
- `shared/`: 前后端共享 TypeScript 类型

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
