const calculators = [
  { href: "/tools/hashrate-rental", label: "算力租赁计算器" },
];

export function CalculatorNav({ active }: { active: string }) {
  return <nav aria-label="计算器分类" className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
    {calculators.map(item => <a key={item.href} href={item.href} aria-current={active === item.href ? "page" : undefined}
      className={`rounded-lg border px-4 py-3 text-center text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${active === item.href ? "border-blue-200 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700"}`}>
      {item.label}
    </a>)}
  </nav>;
}
