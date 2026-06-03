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
    <section
      id="advantages"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 border-b border-slate-100"
    >
      
      {/* Module Title Accent */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 sm:mb-16">
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full inline-block">
          Why Choose Us · 六大实体店优势
        </span>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight sm:text-4xl">
          为什么成都市民选择显卡一号店？
        </h2>
        <p className="text-base sm:text-lg text-gray-500 leading-relaxed font-sans">
          不做纯网络空号，不做皮包二贩。我们在武侯高新区拥有真实物理店面支持到店，当面烤机、流程全透明，为您提供最放心的安全体验。
        </p>
      </div>

      {/* Grid structure displaying 6 cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {ADVANTAGES_DATA.map((adv, idx) => (
          <div
            key={idx}
            className="group relative bg-white rounded-2xl p-6 border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300 hover:scale-101 shrink-0"
          >
            {/* Visual gradient backdrop effect */}
            <div className="absolute top-0 right-0 h-16 w-16 bg-blue-50/20 rounded-bl-3xl group-hover:bg-blue-500/5 transition duration-300" />

            <div className="space-y-4">
              <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                {getIcon(adv.iconName)}
              </div>
              
              <h3 className="text-base font-bold text-gray-900 tracking-tight sm:text-lg">
                {adv.title}
              </h3>
              
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-sans">
                {adv.desc}
              </p>
            </div>

          </div>
        ))}
      </div>

    </section>
  );
}
