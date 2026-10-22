# 一号店显卡日报

已于2026-10-21上线，正式页面 https://cdgpu.cn/gpu-daily 。本地实现日期：2026-10-21。入口 `/gpu-daily`，只读接口 `/api/gpu-daily`。

## 已接通

- 前端沿用网站 Header / Footer，导航新增“显卡日报”；支持按型号/显存筛选，手机与桌面布局。
- 服务端读取 `GPU_DAILY_PRICE_FILE`；未配置时使用网站根目录 `data/gpu-daily/prices.json`。不连接采集管理接口或 ERP 行情写接口。
- 独立采价模块 `gpu-price-daily/website_sync.py` 导出当天已核对的全新整卡报价。`server.py` 启动后，有启用的 `data/website-publish.json` 即每60秒同步，保存结果到 `data/website-publish-status.json`。
- 当前本机配置已启用，输出至本项目 `data/gpu-daily/prices.json`。已配置SSH远程同步至 `/home/ubuntu/cdweb-data/gpu-daily/prices.json`，正式网站已部署并公开验收。
- 当前真实数据：9个型号/显存有待核对全新候选，5090 32GB缺价；公开0/10。未自动确认任何报价。

## 展示规则

只发布当天 `confirmed`、`new_retail` 且型号/显存/店铺/来源完整的报价。每个平台保留最低值，再比较已接入平台。不是全网最低或成交价，也不代表一号店自有库存。现有淘宝适配器尚无真实凭据，不会产生淘宝报价；闲鱼不进入全新价表。

服务端和浏览器再次白名单校验：固定10个型号/显存，金额为人民币整数分；只接受商品规范链接；丢弃内部字段，重新计算最低值。只读接口禁止缓存，网页每分钟检查数据，页面打开跨日也自动清空旧价格。缺失、损坏或过期文件不回退昨日价格。

## 本地查看

1. 启动独立采价模块：双击 `gpu-price-daily/启动显卡日报.command`。
2. 网站正常启动：在本项目运行 `npm run dev`，查看 `http://127.0.0.1:5173/gpu-daily`。
3. 正式页面为 `https://cdgpu.cn/gpu-daily`。本轮3011临时预览已关闭，原有3001进程保留。
4. 当天报价在采价工作台核对完成后，最多约一分钟输出文件，再由客户页面下次检查时显示。机器睡眠、采价受阻或本地服务关闭时，不能保证当天获取新价。

## 正式发布与回滚

本轮已按以下流程执行，版本 `gpu-daily-20261021T052553Z-6ab8dd3`，基于原线上6ab8dd3仅应用22个显卡日报相关文件的改动。服务器安装、构建、类型检查、全套检查和3307候选验收通过后，切换网站进程；ERP进程PID保持不变。

备份目录 `/home/ubuntu/backups/gpu-daily-20261021T052553Z-6ab8dd3`，其中 `rollback.py` 可恢复前一网站版本。原版本及持久数据保留，未执行线上回滚演练。构建版本是白名单源文件补丁包，未提交或推送Git。完整来源及文件哈希见 `output/gpu-daily/release-manifest.json`，发布回执见 `output/gpu-daily/deployment-receipt.json`。

先准备仅包含显卡日报改动的发布版本。工作区另有计算器、统计等未提交改动，不应直接把整个工作区当作仅显卡日报版本发布。

1. 在网站持久目录准备公开文件，例如 `/home/ubuntu/cdweb-data/gpu-daily/prices.json`；在服务器网站环境设置 `GPU_DAILY_PRICE_FILE` 指向该绝对路径，保留现有 `.env`、论坛和跑分数据链接。
2. 本机采价配置 `data/website-publish.json` 加上 `ssh_target` 和 `remote_file`。使用已配置的 SSH 身份及已信任的主机密钥，不把密钥填进 JSON。`ssh_target` 可为 SSH 配置别名或 `user@host`。

   ```json
   {
     "enabled": true,
     "output": "/absolute/local/path/prices.json",
     "ssh_target": "website-ssh-alias",
     "remote_file": "/home/ubuntu/cdweb-data/gpu-daily/prices.json"
   }
   ```

3. 重启独立采价服务启用配置；可用 `python3 website_sync.py` 单次验证。只上传白名单公开JSON，SSH无交互、验证主机身份、30秒超时、临时文件写完原子替换。同步失败记录错误，不报告上传成功。
4. 网站使用独立候选版本构建，先检查临时端口的页面/API、缺价及过期行为，再切换正式网站进程。保留当前网站版本以便回滚，不重启 ERP 进程。
5. 公开验收 `https://cdgpu.cn/gpu-daily` 和 `/api/gpu-daily`，确认前端页面、报价状态、来源及日期一致。没有已核对报价时公开0/10是正常结果，不为上线填充价格。

## 本轮验证

网站 build、三工作区类型检查、现有全套检查通过；新增4项接口/数据边界检查和2项客户卡片检查通过。独立采价模块75项Python检查通过。浏览器已验证真实待核对状态、型号/显存筛选、390px手机布局；保存预览 `output/gpu-daily/preview.png`。未在真实数据库写入合成报价。

公开域名验收：页面与API正常，date=2026-10-21、10个版本、9个待核对、0条公开价格；网站仍连接ERP，GPU库存152项；手机导航及型号筛选通过。线上截图 `output/gpu-daily/live.png`、`live-mobile.png`。本机采价服务需保持运行，电脑休眠或平台阻断时无法保证当日采价。
