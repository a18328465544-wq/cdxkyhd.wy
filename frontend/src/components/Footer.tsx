import React from 'react';
import { storeLinks } from '../lib/storeLinks';

const FOOTER_LINKS = [
  { label: '显卡日报 · 全新价格', href: '/gpu-daily' },
  { label: '回收行情', href: '/#pricing' },
  { label: '现货库存', href: '/#inventory' },
  { label: '装机方案', href: '/build' },
  { label: 'SN 日期查询', href: '/gpu-sn.php' },
  { label: '显卡性能天梯', href: '/gpu-ranking' },
  { label: '交流社区', href: '/community' },
  { label: '硬件自检', href: '/tools' },
  { label: '到店指引', href: '/#contact' },
];

export default function Footer({ compact = false }: { compact?: boolean }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="footer" className={`bg-slate-950 text-slate-300 ${compact ? 'py-7 sm:py-8' : 'py-10 sm:py-12'}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-10">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <img src="/favicon.svg" alt="" aria-hidden="true" className="h-9 w-9 shrink-0" />
              <span className="text-base font-semibold text-white">成都显卡一号店</span>
            </div>
            <p className="mt-3 text-sm leading-6">
              成都市武侯区天府三街新希望国际 B 座 2507<br />
              每天 10:00 – 20:00
            </p>
          </div>

          <nav aria-label="页脚导航" className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3 sm:gap-x-8">
            {FOOTER_LINKS.map(link => (
              <a key={link.href} href={link.href} className="flex min-h-8 items-center break-words transition-colors hover:text-white">{link.label}</a>
            ))}
            {storeLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className={`${compact ? 'mt-5' : 'mt-8'} border-t border-white/15 pt-4 text-xs leading-6 text-slate-400`}>
          <p>© {currentYear} 成都显卡一号店 版权所有</p>
          <p className="mt-2 max-w-3xl">
            本站显卡回收价格与 AI 工作站配置参数仅供参考，最终报价以门店检测结果为准。因违规改装或极端用途（如超负荷挖矿）造成的损失由当事人自行承担。
          </p>
        </div>
      </div>
    </footer>
  );
}
