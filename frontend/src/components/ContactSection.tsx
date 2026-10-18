import React, { useState } from 'react';
import { ArrowUpRight, Check, Clock, Copy, MapPin, MessageSquare, Navigation, Phone, Store } from 'lucide-react';
import { CONTACT_INFO } from '../lib/contact';
import { storeLinks } from '../lib/storeLinks';
import { Button } from './ui/controls';
import SectionHeader from './ui/SectionHeader';

interface ContactSectionProps {
  onOpenContact: () => void;
}

const STORE_ADDRESS = '成都市武侯区天府三街新希望国际 B 座 2507';

const ROUTE_STEPS = [
  { title: '地铁 1 号线「天府三街」站', detail: '从 A 口出站' },
  { title: '步行约 200 米', detail: '到新希望国际 B 座' },
  { title: '乘电梯到 25 楼', detail: '2507 室就是门店' },
];

const MAP_LINKS = [
  { label: '高德地图', href: 'https://uri.amap.com/search?keyword=%E6%96%B0%E5%B8%8C%E6%9C%9B%E5%9B%BD%E9%99%85&city=510100' },
  { label: 'Apple 地图', href: 'https://maps.apple.com/?q=%E6%96%B0%E5%B8%8C%E6%9C%9B%E5%9B%BD%E9%99%85B%E5%BA%A7&address=%E6%88%90%E9%83%BD%E5%B8%82%E6%AD%A6%E4%BE%AF%E5%8C%BA%E5%A4%A9%E5%BA%9C%E4%B8%89%E8%A1%97' },
];

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(current => (current === key ? null : current)), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };
  return { copied, copy };
}

export default function ContactSection({ onOpenContact }: ContactSectionProps) {
  const { wechatId, phoneDisplay, phoneHref } = CONTACT_INFO;
  const { copied, copy } = useCopy();

  return (
    <section className="border-t border-slate-200 bg-slate-50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="到店指引"
          title="欢迎来店里当面交易"
          description="成都本地可以直接到店烤机结算；外地客户微信联系后顺丰保价到付。"
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="flex flex-col rounded-2xl bg-white p-6 ring-1 ring-slate-200 sm:p-8 lg:col-span-5">
            <h3 className="text-xl font-semibold text-slate-950">成都显卡一号店</h3>
            <p className="mt-1 text-sm text-slate-500">显卡回收 · 二手交易 · AI 工作站装机</p>

            <dl className="mt-8 space-y-6">
              <div className="flex gap-4">
                <dt className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <MapPin className="h-5 w-5" /><span className="sr-only">门店地址</span>
                </dt>
                <dd>
                  <span className="block text-base font-medium text-slate-950">{STORE_ADDRESS}</span>
                  <span className="mt-1 block text-sm text-slate-500">地铁 1 号线天府三街站 A 口，步行约 200 米</span>
                </dd>
              </div>
              <div className="flex gap-4">
                <dt className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Phone className="h-5 w-5" /><span className="sr-only">联系电话</span>
                </dt>
                <dd>
                  <a href={phoneHref} className="block text-base font-medium tabular-nums text-slate-950 hover:text-blue-700">{phoneDisplay}</a>
                  <span className="mt-1 block text-sm text-slate-500">营业时间外也可以来电或微信留言</span>
                </dd>
              </div>
              <div className="flex gap-4">
                <dt className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Clock className="h-5 w-5" /><span className="sr-only">营业时间</span>
                </dt>
                <dd>
                  <span className="block text-base font-medium text-slate-950">每天 10:00 – 20:00</span>
                  <span className="mt-1 block text-sm text-slate-500">全年无休，周末可预约看机与 AI 工作站测试</span>
                </dd>
              </div>
              <div className="flex gap-4">
                <dt className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <MessageSquare className="h-5 w-5" /><span className="sr-only">微信号</span>
                </dt>
                <dd className="flex flex-1 flex-wrap items-center justify-between gap-3">
                  <span>
                    <span className="block text-base font-medium text-slate-950">{wechatId}</span>
                    <span className="mt-1 block text-sm text-slate-500">微信号</span>
                  </span>
                  <Button id="contact-section-copy-btn" size="sm" onClick={() => copy('wechat', wechatId)}>
                    {copied === 'wechat' ? <><Check className="h-4 w-4 text-emerald-600" />已复制</> : <><Copy className="h-4 w-4 text-slate-400" />复制</>}
                  </Button>
                </dd>
              </div>
            </dl>

            <div className="mt-auto grid grid-cols-1 gap-3 pt-8 sm:grid-cols-2">
              <Button id="contact-section-primary-whatsapp" onClick={onOpenContact} variant="primary" size="lg" className="w-full">
                <MessageSquare className="h-4 w-4" />
                微信咨询
              </Button>
              <a
                href={phoneHref}
                data-erp-control="button"
                data-variant="secondary"
                data-size="lg"
                className="w-full"
              >
                <Phone className="h-4 w-4 text-slate-500" />
                打电话
              </a>
            </div>

            {storeLinks.length > 0 && (
              <div className="mt-6 border-t border-slate-100 pt-5">
                <h4 className="mb-3 text-sm font-medium text-slate-700">线上店铺</h4>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {storeLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      data-erp-control="button"
                      data-variant="secondary"
                      data-size="md"
                      className="w-full justify-between"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Store className="h-4 w-4 text-blue-600" />
                        {link.label}
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-slate-400" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col rounded-2xl bg-white p-6 ring-1 ring-slate-200 sm:p-8 lg:col-span-7">
            <h3 className="text-xl font-semibold text-slate-950">怎么到店</h3>
            <p className="mt-1 text-sm text-slate-500">新希望国际 B 座，地铁出站步行 3 分钟左右</p>

            <ol className="relative mt-8 space-y-8 border-l border-slate-200 pl-8">
              {ROUTE_STEPS.map((step, idx) => (
                <li key={step.title} className="relative">
                  <span className="absolute -left-[45px] flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white ring-4 ring-white">
                    {idx + 1}
                  </span>
                  <p className="text-base font-medium text-slate-950">{step.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{step.detail}</p>
                </li>
              ))}
            </ol>

            <div className="mt-auto flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {MAP_LINKS.map(link => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    data-erp-control="button"
                    data-variant="secondary"
                    data-size="md"
                  >
                    <Navigation className="h-4 w-4 text-blue-600" />
                    {link.label}导航
                  </a>
                ))}
              </div>
              <button
                type="button"
                onClick={() => copy('address', STORE_ADDRESS)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-700"
              >
                {copied === 'address' ? <><Check className="h-4 w-4 text-emerald-600" />地址已复制</> : <><Copy className="h-4 w-4" />复制地址</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
