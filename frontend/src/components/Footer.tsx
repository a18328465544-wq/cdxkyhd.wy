import React from 'react';
import { Cpu, ShieldCheck } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="footer" className="border-t border-slate-200 bg-slate-50 py-10 text-slate-600 font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col items-center justify-between gap-5 border-b border-slate-200 pb-6 md:flex-row">
          
          {/* Left Brand info */}
          <div className="flex items-center gap-2.5 text-center md:text-left">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-sm font-semibold text-slate-950">成都显卡一号店</span>
            </div>
          </div>

          {/* Slogans */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-slate-600">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
              资质执照备存
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span>物理实体门店</span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span>当面烤机打款</span>
          </div>

        </div>

        {/* Legal footprint disclaimer */}
        <div className="flex flex-col items-center justify-between gap-4 pt-6 text-xs text-slate-500 md:flex-row">
          
          <div className="text-center md:text-left space-y-1">
            <p>© {currentYear} 成都显卡一号店 版权所有</p>
            <p className="max-w-xl text-xs leading-5 text-slate-500">
              免责申明：本站所有显卡回收价格、AI工作站组装参数供用户参考判定，任何因违规改装或极端用途（挖矿过载跑分烧坏等）导致的损失归属对应当事人，最终报价以门店检测确价为准。
            </p>
          </div>

        </div>

      </div>
    </footer>
  );
}
