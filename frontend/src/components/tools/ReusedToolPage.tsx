import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowLeft, AudioLines, Calculator, Gem, Keyboard, Monitor, Mouse } from "lucide-react";

const TOOL_LINKS = [
  { href: "/tools/hashrate-rental", title: "算力租赁", icon: Calculator },
  { href: "/tools/prl-mining", title: "PRL 挖矿计算", icon: Gem },
  { href: "/tools/keyboard", title: "键盘", icon: Keyboard },
  { href: "/tools/mouse", title: "鼠标", icon: Mouse },
  { href: "/tools/audio", title: "音频", icon: AudioLines },
  { href: "/tools/monitor", title: "显示器", icon: Monitor },
] as const;

type ReusedToolPageProps = {
  title: string;
  src: string;
};

export function ReusedToolPage({ title, src }: ReusedToolPageProps) {
  const { pathname } = useLocation();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [frameHeight, setFrameHeight] = useState(420);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<unknown>) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (!event.data || typeof event.data !== "object") return;

      const message = event.data as { source?: unknown; type?: unknown; height?: unknown };
      if (message.source !== "cdxkyhd-pcbox-tool" || message.type !== "height") return;

      const height = Number(message.height);
      if (Number.isFinite(height) && height >= 240 && height <= 8000) {
        setFrameHeight(Math.ceil(height));
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-10 pt-24 sm:px-6 sm:pt-28 lg:px-8">
      <nav aria-label="硬件检测工具" className="-mx-4 flex min-w-0 items-center gap-1 overflow-x-auto border-b border-slate-200 px-4 pb-3 sm:mx-0 sm:px-0">
        <a
          href="/tools"
          className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          工具列表
        </a>
        <span className="mx-1 h-5 w-px shrink-0 bg-slate-200" aria-hidden="true" />
        {TOOL_LINKS.map(({ href, title: linkTitle, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <a
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {linkTitle}
            </a>
          );
        })}
      </nav>

      <section aria-label={`${title}页面`} className="relative mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {!loaded && (
          <div className="absolute inset-x-0 top-0 z-10 flex h-10 items-center gap-2 border-b border-slate-100 bg-white px-4 text-sm text-slate-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" aria-hidden="true" />
            正在打开检测工具…
          </div>
        )}
        <iframe
          ref={frameRef}
          title={title}
          src={src}
          onLoad={() => setLoaded(true)}
          className="block w-full border-0 bg-slate-50"
          style={{ height: `${frameHeight}px` }}
          sandbox="allow-scripts allow-presentation"
          allow="autoplay"
          allowFullScreen
        />
      </section>
    </main>
  );
}
