import React, { useState } from 'react';
import { MapPin, Phone, MessageSquare, Clock, ShieldCheck, Copy, Check, Navigation, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { CONTACT_INFO } from '../lib/contact';
import { Button } from './ui/controls';

interface ContactSectionProps {
  onOpenContact: () => void;
}

export default function ContactSection({ onOpenContact }: ContactSectionProps) {
  const [copied, setCopied] = useState(false);
  const { wechatId, phoneDisplay, phoneHref } = CONTACT_INFO;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(wechatId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <section className="border-b border-slate-200 bg-white py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Module Title */}
        <div className="mx-auto mb-9 max-w-3xl space-y-3 text-center sm:mb-11">
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full inline-block">
            线下实体门店
          </span>
          <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            欢迎莅临实体门店检测交易
          </h2>
          <p className="text-sm leading-6 text-slate-600 sm:text-base">
            无论您在成都本地想要到店当面烤机结账，还是省外客户想要顺丰到付保价寄卡，都可以随时通过微信、电话联系客服。
          </p>
        </div>

        {/* Contact Split Grid Layout */}
        <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-12 lg:gap-6">
          
          {/* Left Column: Direct info details */}
          <div className="flex flex-col justify-between space-y-7 rounded-lg border border-slate-200 bg-white p-5 sm:p-6 lg:col-span-5">
            
            <div className="space-y-6">
              <span className="block text-xs font-semibold text-blue-700">
                门店详情
              </span>

              {/* 1. Name */}
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-950">
                  成都显卡一号店
                </h3>
                <p className="text-sm leading-5 text-slate-600">
                  主营范围：显卡回收 · 二手交易 · AI工作站组装配置 · 硬件每日即时报价
                </p>
              </div>

              {/* Information Rows */}
              <div className="space-y-4 pt-3 border-t border-slate-100">
                
                {/* Physical address */}
                <div className="flex items-start gap-3 text-sm text-slate-700">
                  <div className="h-9 w-9 shrink-0 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <MapPin className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-slate-500">
                      门店地址
                    </span>
                    <span className="font-bold text-gray-800 font-sans block mt-0.5">
                      成都市武侯区天府三街新希望国际B座2507
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      (地铁1号线天府三街站A出口步行约200米即达，交通极其便捷)
                    </span>
                  </div>
                </div>

                {/* Telephone */}
                <div className="flex items-start gap-3 text-sm text-slate-700">
                  <div className="h-9 w-9 shrink-0 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Phone className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-slate-500">
                      联系电话
                    </span>
                    <a
                      href={phoneHref}
                      className="font-bold text-blue-600 hover:underline leading-tight block mt-0.5 font-mono text-base"
                    >
                      {phoneDisplay}
                    </a>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      (拨打后30秒接听，支持深夜或公休紧急卡价清盘询价)
                    </span>
                  </div>
                </div>

                {/* Working hours */}
                <div className="flex items-start gap-3 text-sm text-slate-700">
                  <div className="h-9 w-9 shrink-0 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Clock className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-slate-500">
                      营业时间
                    </span>
                    <span className="font-bold text-gray-800 font-sans block mt-0.5">
                      每天 10:00 - 20:00
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      (无休营业，支持周末预约看机置换及AI工作站上门测试)
                    </span>
                  </div>
                </div>

              </div>

            </div>

            {/* Quick Copy WeChat Action Block */}
            <div className="pt-6 border-t border-slate-100 space-y-3.5">
              
              <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="h-5 w-5 text-blue-500 shrink-0" />
                  <div>
                    <span className="block text-xs font-medium text-slate-500">微信号</span>
                    <span className="font-mono text-sm font-black text-gray-800">{wechatId}</span>
                  </div>
                </div>

                <Button
                  id="contact-section-copy-btn"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-600 animate-scale" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 text-gray-400" />
                      复制微信
                    </>
                  )}
                </Button>
              </div>

              {copied && (
                <span className="-mt-1 block text-center text-xs font-medium text-emerald-700 animate-fade-in">
                  微信号已复制！可微信添加即时解答。
                </span>
              )}

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button
                  id="contact-section-primary-whatsapp"
                  onClick={onOpenContact}
                  variant="primary"
                  size="lg"
                  className="w-full"
                >
                  <MessageSquare className="h-4 w-4" />
                  微信扫码咨询
                </Button>
                <a
                  href="https://uri.amap.com/search?keyword=%E6%96%B0%E5%B8%8C%E6%9C%9B%E5%9B%BD%E9%99%85&city=510100"
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.99]"
                >
                  <Navigation className="h-4 w-4 text-blue-500" />
                  高德到店导航
                </a>
              </div>

            </div>

          </div>

          <div className="flex flex-col justify-between gap-6 rounded-lg border border-slate-200 bg-slate-50 p-5 sm:p-6 lg:col-span-7">
            <div>
              <span className="text-sm font-semibold text-blue-700">门店位置</span>
              <h3 className="mt-2 text-xl font-bold text-slate-950">新希望国际 B 座 2507 室</h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                成都市武侯区天府三街。地铁 1 号线天府三街站 A 出口步行约 200 米。
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <MapPin className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <span className="block text-xs font-medium text-slate-500">详细地址</span>
                <span className="mt-1 block text-sm font-semibold leading-6 text-slate-900">成都市武侯区天府三街新希望国际 B 座 2507</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-sm">
              <span className="flex items-center gap-2 text-slate-700"><ShieldCheck className="h-4 w-4 text-emerald-700" />到店检测与交易</span>
              <span className="text-slate-500">营业时间：每天 10:00 - 20:00</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
