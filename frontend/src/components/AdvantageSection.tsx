import React from 'react';
import { ADVANTAGES_DATA } from '../data';
import { Store, ShieldCheck, Banknote, Gem, Truck, TrendingUp, Sparkles } from 'lucide-react';

export default function AdvantageSection() {
  // Map string to Lucide icons
  const getIcon = (name: string) => {
    switch (name) {
      case 'store':
        return <Store className="h-6 w-6 text-blue-600" />;
      case 'shieldCheck':
        return <ShieldCheck className="h-6 w-6 text-blue-600" />;
      case 'banknote':
        return <Banknote className="h-6 w-6 text-blue-600" />;
      case 'gem':
        return <Gem className="h-6 w-6 text-blue-600" />;
      case 'truck':
        return <Truck className="h-6 w-6 text-blue-600" />;
      case 'trendingUp':
        return <TrendingUp className="h-6 w-6 text-blue-600" />;
      default:
        return <Sparkles className="h-6 w-6 text-blue-600" />;
    }
  };

  return (
    <section className="border-b border-slate-200 bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      
      {/* Module Title Accent */}
      <div className="mx-auto mb-9 max-w-3xl space-y-3 text-center sm:mb-11">
        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full inline-block">
          六大实体店优势
        </span>
        <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
          为什么成都市民选择显卡一号店？
        </h2>
        <p className="text-sm leading-6 text-slate-600 sm:text-base">
          不做纯网络空号，不做皮包二贩。我们在武侯高新区拥有真实物理店面支持到店，当面烤机、流程全透明，为您提供最放心的安全体验。
        </p>
      </div>

      {/* Grid structure displaying 6 cards */}
      <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
        {ADVANTAGES_DATA.map((adv, idx) => (
          <div
            key={idx}
            className="flex min-w-0 gap-4 border-t border-slate-200 py-5 sm:px-2"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                {getIcon(adv.iconName)}
            </div>
            <div className="min-w-0 space-y-2">
              
              <h3 className="text-base font-semibold text-slate-900">
                {adv.title}
              </h3>
              
              <p className="text-sm leading-6 text-slate-600">
                {adv.desc}
              </p>
            </div>

          </div>
        ))}
      </div>

    </section>
  );
}
