import { load, type CheerioAPI } from "cheerio";
import { resolveSeoPage, type SeoPageContent } from "@cdxkyhd/shared";
import type { GpuRankingSnapshot } from "./gpuRankingService.js";

const pageUrl = "https://cdgpu.cn/gpu-ranking";
const { title, description } = resolveSeoPage("/gpu-ranking")!;

type SearchablePagePath =
  | "/"
  | "/gpu-sn.php"
  | "/build"
  | "/tools"
  | "/tools/keyboard"
  | "/tools/mouse"
  | "/tools/audio"
  | "/tools/monitor";

type SearchablePage = {
  path: SearchablePagePath;
  heading: string;
  intro: string;
  about: string;
  sections: Array<{
    heading: string;
    paragraphs?: string[];
    items?: Array<{ text: string; href?: string }>;
  }>;
  related: Array<{ text: string; href: string }>;
};

const toolLinks = [
  { text: "键盘按键检测", href: "/tools/keyboard" },
  { text: "鼠标状态检测", href: "/tools/mouse" },
  { text: "耳机与音响检测", href: "/tools/audio" },
  { text: "显示器画面检测", href: "/tools/monitor" },
];

const searchablePages: Record<SearchablePagePath, SearchablePage> = {
  "/": {
    path: "/",
    heading: "成都显卡一号店",
    intro: "提供成都显卡回收与二手显卡交易咨询、电脑装机选配、显卡行情和库存查询，以及免费的硬件查询与检测工具。",
    about: "成都显卡回收、二手显卡交易与电脑组装",
    sections: [
      {
        heading: "显卡行情与门店库存",
        paragraphs: ["查看今日显卡行情和门店商品信息，了解具体型号、成色、箱说及库存标识。商品价格和状态会变化，购买或回收前请与门店确认。"],
        items: [
          { text: "查看显卡行情与回收参考", href: "/#pricing" },
          { text: "查看二手显卡与其他硬件库存", href: "/#inventory" },
        ],
      },
      {
        heading: "电脑装机与硬件查询",
        items: [
          { text: "在线模拟装机与电脑配置预算", href: "/build" },
          { text: "显卡天梯图与 GPU 跑分对比", href: "/gpu-ranking" },
          { text: "显卡 SN 序列号与生产日期查询", href: "/gpu-sn.php" },
          { text: "键盘、鼠标、耳机和显示器在线检测", href: "/tools" },
        ],
      },
    ],
    related: [{ text: "联系成都门店", href: "/#contact" }, { text: "显卡与装机交流社区", href: "/community" }],
  },
  "/gpu-sn.php": {
    path: "/gpu-sn.php",
    heading: "显卡 SN 码查询生产日期",
    intro: "选择显卡品牌并输入显卡标签上的序列号，按可验证的编码规则查看生产日期范围、规则依据和可信度。",
    about: "显卡序列号与生产日期查询",
    sections: [
      {
        heading: "查询方式与支持范围",
        paragraphs: [
          "查询前先选择显卡品牌，再输入 SN 序列号；支持粘贴或使用扫码枪输入。不同品牌和产品系列采用的编码规则并不相同。",
          "规则证据不足或暂不支持的序列号会明确提示待确认，不会用猜测日期代替查询结果。",
        ],
      },
      {
        heading: "生产日期与保修信息说明",
        paragraphs: [
          "页面结果是根据公开规则和参考样例进行的编码推算，不代表品牌对某一张显卡的官方确认，也不能单独用于判断保修状态。",
          "涉及生产日期、保修资格或售后服务时，请以显卡品牌官方查询入口或客服确认为准。",
        ],
      },
    ],
    related: [
      { text: "显卡性能天梯", href: "/gpu-ranking" },
      { text: "硬件自检工具", href: "/tools" },
    ],
  },
  "/build": {
    path: "/build",
    heading: "在线模拟装机与电脑配置",
    intro: "按处理器、显卡和其他配件组合电脑配置，查看预算与装机提示，再根据实际用途调整方案。",
    about: "电脑硬件选配与装机",
    sections: [
      {
        heading: "可选配件与配置参考",
        paragraphs: [
          "配置器覆盖处理器、显卡、主板、内存、固态硬盘、电源、散热和机箱等常见配件类别；具体可选型号取决于当前可用的商品数据。",
          "页面会根据已选配件展示预算、整机功耗估算以及部分兼容性提示。估算用于初步筛选，不代替完整的硬件规格核对。",
        ],
      },
      {
        heading: "库存与报价确认",
        paragraphs: [
          "硬件库存和价格会变化，线上展示内容仅作配置参考。下单或装机前，请联系门店确认具体型号、配件状态、价格和交付安排。",
        ],
      },
    ],
    related: [
      { text: "显卡性能天梯", href: "/gpu-ranking" },
      { text: "查看门店现货", href: "/#inventory" },
    ],
  },
  "/tools": {
    path: "/tools",
    heading: "电脑硬件在线自检工具",
    intro: "按需打开键盘、鼠标、音频或显示器检测页面，在浏览器中完成基础功能检查。",
    about: "电脑外设在线检测工具",
    sections: [
      {
        heading: "选择检测项目",
        items: [
          { ...toolLinks[0], text: "键盘按键检测：检查按键响应与输入状态" },
          { ...toolLinks[1], text: "鼠标状态检测：检查按键、滚轮、拖动与回报率" },
          { ...toolLinks[2], text: "耳机与音响检测：播放声道与频率测试音" },
          { ...toolLinks[3], text: "显示器画面检测：查看纯色、灰阶、渐变与运动图案" },
        ],
      },
      {
        heading: "检测结果说明",
        paragraphs: [
          "工具通过浏览器可访问的输入事件、音频播放或测试图案辅助检查设备状态。不同浏览器、操作系统、驱动和连接方式可能影响检测表现。",
          "检测结果仅用于初步排查，不能替代专业仪器检测或售后服务机构的故障判断。",
        ],
      },
    ],
    related: [
      { text: "显卡 SN 日期查询", href: "/gpu-sn.php" },
      { text: "在线装机配置", href: "/build" },
    ],
  },
  "/tools/keyboard": {
    path: "/tools/keyboard",
    heading: "在线键盘按键检测",
    intro: "在页面中按下键盘按键，查看浏览器是否收到对应输入，并辅助定位没有响应的按键。",
    about: "键盘按键响应检测",
    sections: [
      {
        heading: "检测内容",
        paragraphs: [
          "键盘检测页面会记录可识别的按键输入，并提供按键测试、双击测试和本轮检测记录等功能，适合用于初步检查键位响应。",
          "浏览器或操作系统可能拦截部分系统快捷键；遇到特殊按键无法检测时，可尝试更换浏览器或在操作系统设置中核对。",
        ],
      },
      {
        heading: "使用提示",
        paragraphs: ["测试前请点击检测区域并逐个按下按键。网页检测不能替代键盘拆检，也不能判断轴体、电路板等内部硬件的具体故障。"],
      },
    ],
    related: [{ text: "其他硬件自检工具", href: "/tools" }, { text: "鼠标检测", href: "/tools/mouse" }],
  },
  "/tools/mouse": {
    path: "/tools/mouse",
    heading: "在线鼠标测试与状态检测",
    intro: "通过网页交互检查鼠标移动、按键、滚轮和拖动表现，辅助判断常见输入异常。",
    about: "鼠标输入与按键检测",
    sections: [
      {
        heading: "可检查的鼠标状态",
        paragraphs: [
          "工具提供鼠标按键响应、微动双击、滚轮、拖动稳定性和回报率等测试项目。检测结果受浏览器事件精度、鼠标连接方式和系统设置影响。",
          "回报率等网页测量值适合做初步参考，不应视为专业硬件仪器的测量结果。",
        ],
      },
      {
        heading: "排查建议",
        paragraphs: ["如果发现按键或移动异常，可更换 USB 接口、清洁鼠标并在另一台设备上复测；问题持续时建议联系售后检测。"],
      },
    ],
    related: [{ text: "其他硬件自检工具", href: "/tools" }, { text: "键盘检测", href: "/tools/keyboard" }],
  },
  "/tools/audio": {
    path: "/tools/audio",
    heading: "在线耳机与音响测试",
    intro: "播放测试音检查耳机和音响的声道输出，并辅助排查连接、左右声道或频率表现异常。",
    about: "耳机与音响声道检测",
    sections: [
      {
        heading: "测试项目",
        paragraphs: [
          "页面提供声道配置、左右声道播放、频率测试和环绕声定位等项目，可辅助确认音频设备是否能按预期输出。",
          "播放声音需要浏览器授权或用户主动操作。开始测试前请调低音量，避免突然播放较大音量的测试音。",
        ],
      },
      {
        heading: "结果说明",
        paragraphs: ["测试音的听感会受到耳机、音箱、声卡、系统混音和环境噪声影响，网页检测结果仅用于初步判断。"],
      },
    ],
    related: [{ text: "其他硬件自检工具", href: "/tools" }, { text: "显示器检测", href: "/tools/monitor" }],
  },
  "/tools/monitor": {
    path: "/tools/monitor",
    heading: "在线显示器画面检测",
    intro: "使用全屏测试图案检查显示器画面表现，辅助观察坏点、漏光、灰阶、渐变和运动拖影。",
    about: "显示器画面与像素检测",
    sections: [
      {
        heading: "显示器检测项目",
        items: [
          { text: "坏点检查：切换纯色背景，观察亮点、暗点或异常像素" },
          { text: "漏光与暗角检查：在黑色或白色画面下观察边缘亮度" },
          { text: "灰阶与渐变检查：查看暗部层次、色带和颜色过渡" },
          { text: "运动图案检查：辅助观察拖影和画面响应表现" },
        ],
      },
      {
        heading: "检测前注意",
        paragraphs: [
          "建议清洁屏幕，并在适当环境光下逐项查看；漏光表现与面板类型、亮度设置和拍摄角度有关。",
          "显示器网页检测用于肉眼观察，不会自动判定面板合格与否，也不能替代厂商质检标准。",
        ],
      },
    ],
    related: [{ text: "其他硬件自检工具", href: "/tools" }, { text: "在线装机配置", href: "/build" }],
  },
};

export const SEARCHABLE_SEO_PAGE_PATHS = [
  "/",
  "/gpu-sn.php",
  "/gpu-sn",
  "/build",
  "/tools",
  "/tools/keyboard",
  "/tools/mouse",
  "/tools/audio",
  "/tools/monitor",
] as const;

function normalizeSearchablePath(pathname: string): SearchablePagePath | null {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  if (normalizedPath === "/gpu-sn") return "/gpu-sn.php";
  return Object.hasOwn(searchablePages, normalizedPath) ? normalizedPath as SearchablePagePath : null;
}

function createQuestionsSection($: CheerioAPI, page: SeoPageContent) {
  const section = $("<section>").attr("aria-label", page.questionHeading);
  section.append($("<h2>").text(page.questionHeading));
  for (const { question, answer } of page.questions) {
    section.append(
      $("<details>")
        .append($("<summary>").text(question))
        .append($("<p>").text(answer)),
    );
  }
  return section;
}

export function renderSearchablePageSeoHtml(appShell: string, pathname: string) {
  const pagePath = normalizeSearchablePath(pathname);
  const page = pagePath ? searchablePages[pagePath] : null;
  if (!page) throw new Error(`No SEO page configured for ${pathname}`);
  const metadata = resolveSeoPage(page.path)!;

  const $ = load(appShell);
  const head = $("head").first();
  const root = $("#root").first();
  if (!head.length || !root.length) throw new Error("Frontend app shell is missing head or #root");

  const pageTitle = $("title").first();
  if (pageTitle.length) pageTitle.text(metadata.title);
  else head.append($("<title>").text(metadata.title));

  const setMeta = (selector: string, attributes: Record<string, string>) => {
    const existing = head.find(selector).first();
    const element = existing.length ? existing : $("<meta>").appendTo(head);
    for (const [key, value] of Object.entries(attributes)) element.attr(key, value);
  };

  const canonicalUrl = `https://cdgpu.cn${page.path}`;
  setMeta('meta[name="description"]', { name: "description", content: metadata.description });
  setMeta('meta[name="robots"]', { name: "robots", content: "index,follow" });
  setMeta('meta[property="og:type"]', { property: "og:type", content: "website" });
  setMeta('meta[property="og:site_name"]', { property: "og:site_name", content: "成都显卡一号店" });
  setMeta('meta[property="og:title"]', { property: "og:title", content: metadata.title });
  setMeta('meta[property="og:description"]', { property: "og:description", content: metadata.description });
  setMeta('meta[property="og:url"]', { property: "og:url", content: canonicalUrl });
  setMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary" });
  head.find('link[rel="canonical"]').remove();
  head.append($("<link>").attr({ rel: "canonical", href: canonicalUrl }));

  head.find("script[data-seo-page]").remove();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: metadata.title,
    description: metadata.description,
    isPartOf: { "@type": "WebSite", name: "成都显卡一号店", url: "https://cdgpu.cn/" },
    about: { "@type": "Thing", name: page.about },
  };
  head.append(
    $("<script>")
      .attr({ type: "application/ld+json", "data-seo-page": page.path })
      .text(JSON.stringify(structuredData)),
  );

  const main = $("<main>").attr({ id: "page-seo-fallback", "aria-label": page.heading });
  main.append(
    $("<header>")
      .append($("<h1>").text(page.heading))
      .append($("<p>").text(page.intro)),
  );

  for (const section of page.sections) {
    const content = $("<section>").append($("<h2>").text(section.heading));
    for (const paragraph of section.paragraphs ?? []) content.append($("<p>").text(paragraph));
    if (section.items?.length) {
      const list = $("<ul>");
      for (const item of section.items) {
        const listItem = $("<li>");
        if (item.href) listItem.append($("<a>").attr("href", item.href).text(item.text));
        else listItem.text(item.text);
        list.append(listItem);
      }
      content.append(list);
    }
    main.append(content);
  }

  main.append(createQuestionsSection($, metadata));
  const related = $("<nav>").attr("aria-label", "相关页面");
  page.related.forEach((link, index) => {
    if (index > 0) related.append(" · ");
    related.append($("<a>").attr("href", link.href).text(link.text));
  });
  main.append(related);

  root.empty().append(main);
  return $.html();
}

function formatSourceDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Shanghai",
  }).format(date);
}

export function renderGpuRankingSeoHtml(appShell: string, snapshot: GpuRankingSnapshot | null) {
  const $ = load(appShell);
  const head = $("head").first();
  const root = $("#root").first();
  if (!head.length || !root.length) throw new Error("Frontend app shell is missing head or #root");

  const pageTitle = $("title").first();
  if (pageTitle.length) pageTitle.text(title);
  else head.append($("<title>").text(title));

  const setMeta = (selector: string, attributes: Record<string, string>) => {
    const existing = head.find(selector).first();
    const element = existing.length ? existing : $("<meta>").appendTo(head);
    for (const [key, value] of Object.entries(attributes)) element.attr(key, value);
  };

  setMeta('meta[name="description"]', { name: "description", content: description });
  setMeta('meta[name="robots"]', { name: "robots", content: "index,follow" });
  setMeta('meta[property="og:type"]', { property: "og:type", content: "website" });
  setMeta('meta[property="og:site_name"]', { property: "og:site_name", content: "成都显卡一号店" });
  setMeta('meta[property="og:title"]', { property: "og:title", content: title });
  setMeta('meta[property="og:description"]', { property: "og:description", content: description });
  setMeta('meta[property="og:url"]', { property: "og:url", content: pageUrl });
  setMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary" });
  head.find('link[rel="canonical"]').remove();
  head.append($("<link>").attr({ rel: "canonical", href: pageUrl }));

  head.find("script[data-seo-page]").remove();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: title,
    description,
    isPartOf: {
      "@type": "WebSite",
      name: "成都显卡一号店",
      url: "https://cdgpu.cn/",
    },
    about: { "@type": "Thing", name: "显卡性能对比" },
  };
  head.append(
    $("<script>")
      .attr({ type: "application/ld+json", "data-seo-page": "gpu-ranking" })
      .text(JSON.stringify(structuredData)),
  );

  const main = $("<main>").attr({ id: "gpu-ranking-seo-fallback", "aria-label": "显卡性能天梯说明" });
  main.append(
    $("<header>")
      .append($("<h1>").text("显卡性能天梯"))
      .append($("<p>").text("对比显卡游戏帧数、光线追踪、3DMark、Blender 与 Geekbench GPU 成绩，并查看门店现货匹配。")),
  );
  main.append(
    $("<section>")
      .append($("<h2>").text("游戏性能成绩（2K）"))
      .append($("<p>").text("以下成绩用于同一测试项目与分辨率下的横向参考。不同测试平台、游戏版本和驱动会影响结果，不能把游戏帧数与合成跑分直接混为一谈。")),
  );

  const rankingRows = (snapshot?.models ?? [])
    .map((model) => ({ model: model.model, metric: model.raster[1] }))
    .filter(({ model, metric }) => model && Number.isFinite(metric?.fps) && metric.fps > 0 && Number.isFinite(metric?.relativeScore))
    .sort((left, right) => right.metric.fps - left.metric.fps)
    .slice(0, 10);

  if (rankingRows.length > 0) {
    const table = $("<table>").attr({ "aria-label": "显卡 2K 光栅游戏性能成绩" });
    table.append(
      $("<thead>").append(
        $("<tr>")
          .append($("<th>").attr("scope", "col").text("显卡型号"))
          .append($("<th>").attr("scope", "col").text("平均帧数"))
          .append($("<th>").attr("scope", "col").text("相对成绩")),
      ),
    );
    const body = $("<tbody>");
    for (const row of rankingRows) {
      body.append(
        $("<tr>")
          .append($("<th>").attr("scope", "row").text(row.model))
          .append($("<td>").text(`${row.metric.fps.toFixed(1)} FPS`))
          .append($("<td>").text(`${row.metric.relativeScore.toFixed(1)}%`)),
      );
    }
    table.append(body);
    main.find("section").first().append(table);

    const sourceDate = formatSourceDate(snapshot?.sourceUpdatedAt ?? null);
    if (sourceDate) main.find("section").first().append($("<p>").text(`游戏成绩来源：Tom's Hardware GPU Hierarchy；源站数据更新于 ${sourceDate}。`));
  } else {
    main.find("section").first().append($("<p>").text("游戏成绩正在同步，当前可先查看下方榜单口径与数据来源说明。"));
  }

  const modes = $("<ul>")
    .append($("<li>").text("游戏实测：光栅与光线追踪，提供 1080p、2K、4K 分辨率成绩。"))
    .append($("<li>").text("3DMark：Time Spy Graphics 与 Port Royal 分开比较。"))
    .append($("<li>").text("渲染与计算：查看 Blender Cycles、Geekbench Vulkan、OpenCL 和 CUDA 成绩。"));
  main.append(
    $("<section>")
      .append($("<h2>").text("榜单包含哪些测试"))
      .append(modes)
      .append($("<p>").text("每类成绩采用各自的测试口径；页面会标明数据来源、样本或检查时间。购买前请结合显卡具体型号、整机配置和实际用途判断。")),
  );
  main.append(createQuestionsSection($, resolveSeoPage("/gpu-ranking")!));
  main.append(
    $("<nav>").attr("aria-label", "相关页面")
      .append($("<a>").attr("href", "/build").text("在线装机配置"))
      .append(" · ")
      .append($("<a>").attr("href", "/#inventory").text("查看门店现货")),
  );

  root.empty().append(main);
  return $.html();
}
