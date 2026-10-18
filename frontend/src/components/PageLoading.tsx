interface SectionFallbackProps {
  label: string;
  minHeight: string;
}

export function SectionFallback({ label, minHeight }: SectionFallbackProps) {
  return (
    <div className="w-full border-t border-slate-200 bg-white" style={{ minHeight }}>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="text-sm font-semibold text-blue-700">{label}</div>
        <div className="mt-4 h-9 w-72 max-w-full animate-pulse rounded-lg bg-slate-100" />
        <div className="mt-4 h-4 w-96 max-w-full animate-pulse rounded bg-slate-100" />
        <div className="mt-10 h-48 w-full animate-pulse rounded-2xl bg-slate-50" />
      </div>
    </div>
  );
}

export function ContactModalFallback() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
      <div className="rounded-2xl bg-white px-5 py-4 text-sm font-bold text-slate-700 shadow-xl">
        正在打开微信估价窗口...
      </div>
    </div>
  );
}
