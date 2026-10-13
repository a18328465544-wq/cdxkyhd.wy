import React from 'react';
import { ADVANTAGES_DATA } from '../data';
import { Store, ShieldCheck, Banknote, Gem, Truck, TrendingUp, Sparkles, type LucideIcon } from 'lucide-react';
import SectionHeader from './ui/SectionHeader';

const ICONS: Record<string, LucideIcon> = {
  store: Store,
  shieldCheck: ShieldCheck,
  banknote: Banknote,
  gem: Gem,
  truck: Truck,
  trendingUp: TrendingUp,
};

export default function AdvantageSection() {
  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-x-16 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <SectionHeader
              eyebrow="为什么选我们"
              title="实体门店，交易更安心"
              description="武侯区天府三街有真实门店，可以到店当面烤机、当场结算，价格和检测过程全部公开。"
            />
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2 lg:col-span-7 lg:pt-10">
          {ADVANTAGES_DATA.map((adv) => {
            const Icon = ICONS[adv.iconName] ?? Sparkles;
            return (
              <div key={adv.title}>
                <dt>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="mt-4 block text-lg font-semibold text-slate-950">{adv.title}</span>
                </dt>
                <dd className="mt-2 text-base leading-7 text-slate-600">{adv.desc}</dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
