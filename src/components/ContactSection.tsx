import React, { useState } from 'react';
import { MapPin, Phone, MessageSquare, Clock, ShieldCheck, Copy, Check, Navigation, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

interface ContactSectionProps {
  onOpenContact: () => void;
}

export default function ContactSection({ onOpenContact }: ContactSectionProps) {
  const [copied, setCopied] = useState(false);
  const wechatId = 'GPU-CD183';
  const phoneNumber = '183-2846-5544';

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
    <section
      id="contact"
      className="bg-slate-50 py-16 sm:py-24 border-b border-slate-100"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Module Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 sm:mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full inline-block">
            Get In Touch · 线下实体见
          </span>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight sm:text-4xl">
            欢迎莅临实体门店检测交易
          </h2>
          <p className="text-base sm:text-lg text-gray-500 leading-relaxed font-sans">
            无论您在成都本地想要到店当面烤机结账，还是省外客户想要顺丰到付保价寄卡，都可以随时通过微信、电话联系客服。
          </p>
        </div>

        {/* Contact Split Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-stretch">
          
          {/* Left Column: Direct info details */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs">
            
            <div className="space-y-6">
              <span className="text-[10px] tracking-widest text-blue-600 uppercase font-black block font-mono">
                STORE INFORMATION · 门店详情
              </span>

              {/* 1. Name */}
              <div className="space-y-1">
                <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                  成都显卡一号店
                </h3>
                <p className="text-xs text-gray-400 font-medium font-sans">
                  主营范围：显卡回收 · 二手交易 · AI工作站组装配置 · 硬件每日即时报价
                </p>
              </div>

              {/* Information Rows */}
              <div className="space-y-4 pt-3 border-t border-slate-100">
                
                {/* Physical address */}
                <div className="flex items-start gap-3.5 text-xs sm:text-sm text-gray-600">
                  <div className="h-9 w-9 shrink-0 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <MapPin className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] block font-semibold uppercase font-mono">
                      STORE PHYSICAL LOCATION
                    </span>
                    <span className="font-bold text-gray-800 font-sans block mt-0.5">
                      成都市武侯区天府三街新希望国际B座2507
                    </span>
                    <span className="text-[10px] text-gray-400 block mt-0.5 font-sans">
                      (地铁1号线天府三街站A出口步行约200米即达，交通极其便捷)
                    </span>
                  </div>
                </div>

                {/* Telephone */}
                <div className="flex items-start gap-3.5 text-xs sm:text-sm text-gray-600">
                  <div className="h-9 w-9 shrink-0 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Phone className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] block font-semibold uppercase font-mono">
                      TELEPHONE HOTLINE
                    </span>
                    <a
                      href={`tel:${phoneNumber.replace(/-/g, '')}`}
                      className="font-bold text-blue-600 hover:underline leading-tight block mt-0.5 font-mono text-base"
                    >
                      {phoneNumber}
                    </a>
                    <span className="text-[10px] text-gray-400 block mt-0.5 font-sans">
                      (拨打后30秒接听，支持深夜或公休紧急卡价清盘询价)
                    </span>
                  </div>
                </div>

                {/* Working hours */}
                <div className="flex items-start gap-3.5 text-xs sm:text-sm text-gray-600">
                  <div className="h-9 w-9 shrink-0 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Clock className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] block font-semibold uppercase font-mono">
                      BUSINESS OPERATION HOURS
                    </span>
                    <span className="font-bold text-gray-800 font-sans block mt-0.5">
                      每天 10:00 - 20:00
                    </span>
                    <span className="text-[10px] text-gray-400 block mt-0.5 font-sans">
                      (无休营业，支持周末预约看机置换及AI工作站上门测试)
                    </span>
                  </div>
                </div>

              </div>

            </div>

            {/* Quick Copy WeChat Action Block */}
            <div className="pt-6 border-t border-slate-100 space-y-3.5">
              
              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="h-5 w-5 text-blue-500 shrink-0" />
                  <div>
                    <span className="text-[10px] text-gray-400 block font-semibold">微信号复制</span>
                    <span className="font-mono text-sm font-black text-gray-800">{wechatId}</span>
                  </div>
                </div>

                <button
                  id="contact-section-copy-btn"
                  onClick={handleCopy}
                  className="flex items-center gap-1 hover:bg-blue-50 hover:text-blue-700 active:scale-95 transition rounded-xl border border-gray-200 bg-white py-2 px-3 text-xs font-bold text-gray-700 cursor-pointer"
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
                </button>
              </div>

              {copied && (
                <span className="text-[10px] text-emerald-600 text-center block font-medium animate-fade-in -mt-1">
                  微信号已复制！可微信添加即时解答。
                </span>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  id="contact-section-primary-whatsapp"
                  onClick={onOpenContact}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-3.5 text-xs font-bold transition active:scale-98 cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4" />
                  微信扫码咨询
                </button>
                <a
                  href="https://s.amap.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white hover:bg-slate-50 py-3.5 text-xs font-bold transition text-gray-700 active:scale-98"
                >
                  <Navigation className="h-4 w-4 text-blue-500" />
                  高德到店导航
                </a>
              </div>

            </div>

          </div>

          {/* Right Column: Custom interactive Mock Map block with premium aesthetics */}
          <div className="lg:col-span-7 bg-slate-900 rounded-3xl p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between border border-slate-800 shadow-xl group/map">
            
            {/* Tech grid overlays */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-40" />

            {/* Glowing neon location orbs */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[350px] rounded-full bg-blue-500/5 blur-3xl" />

            <div className="relative z-10">
              <span className="text-[10px] tracking-widest text-blue-400 uppercase font-black block font-mono">
                INTERACTIVE LOBBY MAP · 地图指引
              </span>
              <h3 className="text-xl font-bold text-white mt-1.5 tracking-tight">
                新希望国际 · 楼宇实效指引
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                成都市核心金融高新区核心写字楼25楼，楼下配有充足的地下停车位、大堂配有中央刷卡进门。
              </p>
            </div>

            {/* Simulated Map Board rendered using beautiful HTML & Tailwind */}
            <div className="relative z-10 my-6 h-64 border border-slate-700/60 rounded-2xl bg-slate-950 p-4 overflow-hidden flex flex-col justify-end">
              
              {/* Fake roads and lines inside mock map */}
              <div className="absolute inset-x-0 top-1/4 h-2 bg-slate-800/50" /> {/* Tianfu 3rd */}
              <div className="absolute inset-x-0 top-2/3 h-2 bg-slate-800/50" />
              <div className="absolute left-1/3 top-0 bottom-0 w-2 bg-slate-800/50" /> {/* Metro line */}
              <div className="absolute left-2/3 top-0 bottom-0 w-2 bg-slate-800/50" />

              {/* Metro Station Marker */}
              <div className="absolute left-1/3 top-1/4 -translate-x-3 -translate-y-3 z-10 flex flex-col items-center">
                <div className="h-5 w-5 rounded-full bg-indigo-600 border border-indigo-400 flex items-center justify-center shadow">
                  <span className="text-[8px] font-bold text-white">M</span>
                </div>
                <span className="bg-slate-900 border border-slate-700 text-white font-semibold text-[8px] px-1.5 py-0.5 rounded shadow mt-1">
                  天府三街地铁站A出口
                </span>
              </div>

              {/* Our Store Pointer Marker */}
              <div className="absolute left-2/3 top-1/3 -translate-x-3 -translate-y-4 z-20 flex flex-col items-center group-hover/map:scale-105 transition-transform duration-500">
                {/* Radial ring pinging animation */}
                <span className="absolute top-1.5 h-3 w-3 rounded-full bg-blue-400 animate-ping opacity-75" />
                <div className="h-7 w-7 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center shadow-lg text-white">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="bg-blue-500 text-white font-black text-[9px] px-2 py-1 rounded shadow-lg mt-1 border border-blue-400 flex items-center gap-1">
                  <span>成都显卡一号店 (B座2507)</span>
                </div>
              </div>

              {/* Surrounding Landmark annotations */}
              <div className="absolute right-5 bottom-8 text-[9px] text-gray-500 font-bold bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800">
                新希望国际大厦群
              </div>
              <div className="absolute left-4 bottom-4 text-[9px] text-gray-500 font-bold bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800">
                复城国际中心商圈
              </div>

              {/* Map Footer status */}
              <div className="relative z-30 bg-slate-900/80 backdrop-blur-xs border border-slate-800 rounded-xl px-3 py-2.5 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1 text-blue-400 font-bold">
                  <ShieldCheck className="h-4 w-4 text-blue-400" />
                  实名登记实体商铺
                </div>
                <span className="text-gray-400">大堂无障碍畅行，电梯直上25楼</span>
              </div>

            </div>

            {/* Support guidance comments */}
            <div className="relative z-10 text-[11px] text-slate-400 font-medium">
              💡 <strong>来客指南：</strong>成都高新区客户建议坐1号线地铁直达，开车亦可以直接导航“新希望国际负二楼停车场”，出站出库极为迅速。任何疑问随时拨打 183-2846-5544。
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
