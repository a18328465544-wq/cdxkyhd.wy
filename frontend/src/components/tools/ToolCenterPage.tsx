import { ArrowRight, AudioLines, Calculator, ChartNoAxesColumnIncreasing, Cpu, Keyboard, Mouse, Monitor, Newspaper, ScanLine } from "lucide-react";
import { Link } from "react-router-dom";

const TOOLS = [
  {
    href: "/build",
    title: "在线装机",
    description: "游戏、生产力与本地 AI 选配，查看配件预算与基础兼容性。",
    icon: Cpu,
    group: "选购与对比",
  },
  {
    href: "/gpu-ranking",
    title: "显卡性能天梯",
    description: "按游戏帧数、3DMark 或渲染成绩，比较不同型号。",
    icon: ChartNoAxesColumnIncreasing,
    group: "选购与对比",
  },
  {
    href: "/gpu-daily",
    title: "显卡日报",
    description: "查看全新显卡有效采样报价、历史走势与首发参考价。",
    icon: Newspaper,
    group: "选购与对比",
  },
  {
    href: "/gpu-sn.php",
    title: "SN 生产日期查询",
    description: "按品牌与序列号查询生产日期，核对结果依据与适用范围。",
    icon: ScanLine,
    group: "查询与检测",
  },
  {
    href: "/tools/hashrate-rental",
    title: "算力租赁计算器",
    description: "核算租金、服务费与电费，查看回本天数、资金缺口与不同运营时长的回报。",
    icon: Calculator,
    group: "成本计算",
  },
  {
    href: "/tools/keyboard",
    title: "键盘检测",
    description: "逐个按下键位，确认输入响应并定位连击或失灵按键。",
    icon: Keyboard,
    group: "查询与检测",
  },
  {
    href: "/tools/mouse",
    title: "鼠标检测",
    description: "检查移动、左右键、滚轮与拖动，观察设备响应情况。",
    icon: Mouse,
    group: "查询与检测",
  },
  {
    href: "/tools/audio",
    title: "耳机与音频",
    description: "播放左右声道与频率测试音，快速检查耳机或音箱。",
    icon: AudioLines,
    group: "查询与检测",
  },
  {
    href: "/tools/monitor",
    title: "显示器检测",
    description: "通过纯色、灰阶与运动图案，辅助观察屏幕显示状态。",
    icon: Monitor,
    group: "查询与检测",
  },
];

export default function ToolCenterPage() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-12 pt-24 sm:px-6 sm:pt-28 lg:px-8">
      <header className="page-heading">
        <div><h1 className="page-title">硬件工具</h1>
        <p className="page-description">选硬件、查信息、测外设、算成本。</p></div>
      </header>

      {["选购与对比", "查询与检测", "成本计算"].map(title => <section key={title} className="mt-6" aria-label={title}>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">{title}</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {TOOLS.filter(tool => tool.group === title).map(({ href, title, description, icon: Icon }) => (
          <Link key={href} to={href} className="group flex min-h-[76px] items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 transition hover:border-blue-300 hover:bg-blue-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition group-hover:bg-blue-100 group-hover:text-blue-700">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-slate-950">{title}</h3>
              <p className="mt-1 text-sm leading-5 text-slate-600">{description}</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-700" aria-hidden="true" />
          </Link>
        ))}
        </div>
      </section>)}

      <aside className="mt-4 border-t border-slate-200 pt-3 text-xs leading-6 text-slate-600">
        查询与检测结果仅供参考，不能替代专业检测；价格以有效报价及门店确认为准。
      </aside>
    </main>
  );
}

