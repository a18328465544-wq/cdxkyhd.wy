import React from 'react';
import { Cpu, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="footer" className="bg-slate-900 text-slate-400 py-12 border-t border-slate-950 font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800">
          
          {/* Left Brand info */}
          <div className="flex items-center gap-2.5 text-center md:text-left">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <span className="text-white font-bold text-sm block">成都显卡一号店</span>
              <span className="text-[10px] font-mono uppercase text-slate-500">Chengdu GPU No.1 Center</span>
            </div>
          </div>

          {/* Slogans */}
          <div className="flex items-center gap-4 flex-wrap justify-center text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
              资质执照备存
            </span>
            <span className="h-1 w-1 bg-slate-700 rounded-full" />
            <span>物理实体门店</span>
            <span className="h-1 w-1 bg-slate-700 rounded-full" />
            <span>当面烤机打款</span>
          </div>

        </div>

        {/* Legal footprint disclaimer */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 text-[11px] text-slate-500">
          
          <div className="text-center md:text-left space-y-1">
            <p>© {currentYear} 成都显卡一号店. All Rights Reserved. 四川省ICP备88888888号-1</p>
            <p className="max-w-xl text-[10px] text-slate-600 font-medium">
              免责申明：本站所有显卡回收价格、AI工作站组装参数供用户参考判定，任何因违规改装或极端用途（挖矿过载跑分烧坏等）导致的损失归属对应当事人，最终报价以门店检测确价为准。
            </p>
          </div>

          <div className="inline-flex items-center gap-1 text-slate-600 font-bold">
            <span>Powered by Chengdu Tech Partners</span>
            <Heart className="h-3 w-3 text-rose-605 fill-rose-600/15" />
          </div>

        </div>

      </div>
    </footer>
  );
}
