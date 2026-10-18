import { resolveSeoPage } from "@cdxkyhd/shared";
import { ChevronDown } from "lucide-react";

const relatedTools = [
  { href: "/build", label: "在线模拟装机" },
  { href: "/gpu-ranking", label: "显卡天梯图与跑分" },
  { href: "/gpu-sn.php", label: "显卡 SN 生产日期查询" },
  { href: "/tools", label: "电脑硬件在线检测" },
];

export default function PageQuestions({ pathname }: { pathname: string }) {
  const page = resolveSeoPage(pathname);
  if (!page) return null;
  const currentPath = pathname.replace(/\/+$/, "") || "/";

  return (
    <section aria-labelledby="page-questions-heading" className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
      <div className="border-t border-slate-200 pt-6">
        <h2 id="page-questions-heading" className="text-lg font-semibold text-slate-950">{page.questionHeading}</h2>
        <div className="mt-3 divide-y divide-slate-200">
          {page.questions.map(({ question, answer }) => (
            <details key={question} className="group py-3">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 rounded-sm text-sm font-medium leading-6 text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 break-words">{question}</span>
                <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-slate-500 transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="max-w-4xl pt-2 pr-8 text-sm leading-7 text-slate-600">{answer}</p>
            </details>
          ))}
        </div>
        <nav aria-label="相关硬件工具" className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {relatedTools.filter(({ href }) => href !== currentPath && !(href === "/gpu-sn.php" && currentPath === "/gpu-sn")).map(({ href, label }) => (
            <a key={href} href={href} className="text-blue-700 underline decoration-blue-200 underline-offset-4 hover:decoration-blue-700">{label}</a>
          ))}
        </nav>
      </div>
    </section>
  );
}
