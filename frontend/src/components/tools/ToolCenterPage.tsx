import { ArrowRight, AudioLines, Calculator, Gem, Keyboard, Mouse, Monitor } from "lucide-react";

const TOOLS = [
  {
    href: "/tools/hashrate-rental",
    title: "算力租赁计算器",
    description: "核算租金、服务费与电费，查看回本天数、资金缺口与不同运营时长的回报。",
    icon: Calculator,
  },
  {
    href: "/tools/prl-mining",
    title: "PRL 珍珠币挖矿计算器",
    description: "结合 PRL 价格测算产币、电费、回本天数与计划期资金回收情况。",
    icon: Gem,
  },
  {
    href: "/tools/keyboard",
    title: "键盘检测",
    description: "逐个按下键位，确认输入响应并定位连击或失灵按键。",
    icon: Keyboard,
  },
  {
    href: "/tools/mouse",
    title: "鼠标检测",
    description: "检查移动、左右键、滚轮与拖动，观察设备响应情况。",
    icon: Mouse,
  },
  {
    href: "/tools/audio",
    title: "耳机与音频",
    description: "播放左右声道与频率测试音，快速检查耳机或音箱。",
    icon: AudioLines,
  },
  {
    href: "/tools/monitor",
    title: "显示器检测",
    description: "通过纯色、灰阶与运动图案，辅助观察屏幕显示状态。",
    icon: Monitor,
  },
];

export default function ToolCenterPage() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-12 pt-24 sm:px-6 sm:pt-28 lg:px-8">
      <header className="border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-bold text-slate-950 sm:text-4xl">硬件工具</h1>
        <p className="mt-2 text-sm text-slate-600">两类独立收益计算器与电脑外设检测</p>
      </header>

      {[{ title: "收益计算器", tools: TOOLS.slice(0, 2) }, { title: "电脑外设检测", tools: TOOLS.slice(2) }].map(group => <section key={group.title} className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">{group.title}</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {group.tools.map(({ href, title, description, icon: Icon }) => (
          <a key={href} href={href} className="group flex min-h-[76px] items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 transition hover:border-blue-300 hover:bg-blue-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition group-hover:bg-blue-100 group-hover:text-blue-700">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-slate-950">{title}</h3>
              <p className="mt-1 text-sm leading-5 text-slate-600">{description}</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-700" aria-hidden="true" />
          </a>
        ))}
        </div>
      </section>)}

      <aside className="mt-4 border-t border-slate-200 pt-3 text-xs leading-5 text-slate-500">
        计算与检测在浏览器本地进行，结果仅供参考。
      </aside>
    </main>
  );
}

