# 数码圈工具站小程序

小程序和官网共用本项目的 Express 后端，再由后端通过现有 ERP Open API 读取行情和库存。源码已从独立 Next.js 进销存项目迁到这里。

## 本地运行

1. 在网站根目录的本地 `.env` 配置现有 `ERP_BASE_URL` 和 `ERP_API_KEY`（仅服务端使用）。
2. 网站根目录执行 `PORT=3311 npm run dev:api`。
3. 微信开发者工具导入本目录。当前仍为开发用 `touristappid`；`config.js` 默认连接正式网站 `https://cdgpu.cn`。需要本地联调时临时改成 `http://127.0.0.1:3311`，发布前恢复 HTTPS。
4. 未配置 ERP 或连接失败时显示服务不可用，不使用网站演示库存替代真实数据。

## 接口对应

| 小程序功能 | 网站后端 | ERP 来源 |
| --- | --- | --- |
| 行情与测算 | GET /api/miniprogram/market-prices?q= | /prices/market-quotes |
| 在售商品 | GET /api/miniprogram/products?category=GPU&q= | /inventory/items（已入库 / 已上架） |
| 商品详情 | GET /api/miniprogram/products?id= | 同上，按库存单件 ID 匹配 |
| 门店联系方式 | GET /api/miniprogram/contact | 与网站共用 CONTACT_INFO |

行情与估价只提供 refBuyPrice 对应的回收参考价，不返回或显示行情零售价；未提供有效回收报价的型号不进入行情列表。日期使用 ERP 的 updateTime，缺失时显示“未提供更新日期”。选购商品的售价仍使用 estSellPrice，缺失时参考 marketPrice。不会把参考价当作已支付订单金额。

分类固定为 ERP 的物理商品分类，默认显卡；没有“全部库存”或“组装拆卸”分类。库存按单件展示，每页 9 件。客户接口不返回成本、SN、供应商、内部备注或连接密钥。

## 询价与购买

小程序提供真实门店电话、复制微信号和复制商品询价信息。当前网站没有可持久化的 ERP 公开询价接口，因此不提交旧的模拟报价接口，不宣称已写入 CRM 或已锁定库存。客户无需提供电话给小程序。

## 真机与发布

网站发布会包含新增接口；在微信公众平台配置 `https://cdgpu.cn` 为 request 合法域名并换成正式 AppID 后，仍需开发者工具真机预览和微信平台审核。服务器接口上线不等于小程序已经在微信发布。
