import React, { useState } from 'react';
import { X, Copy, Check, MessageSquare, Phone, MapPin, Clock, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export default function ContactModal({
  isOpen,
  onClose,
  title = '在线客服 / 微信估价',
  subtitle = '微信扫码添加或拨打电话，成都实体门店专家即时给您出具准确行情价'
}: ContactModalProps) {
  const [copied, setCopied] = useState(false);
  const wechatId = 'GPU-CD183'; // Mock real WeChat pattern
  const phoneNumber = '183-2846-5544';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(wechatId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div id="contact-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          {/* Header Banner Accent */}
          <div className="h-2 bg-blue-605" />

          {/* Close button */}
          <button
            id="close-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="p-6 md:p-8">
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                客服在线时间 10:00 - 20:00
              </span>
              <h3 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">{subtitle}</p>
            </div>

            {/* Content Details */}
            <div className="space-y-6">
              {/* WeChat QR Mock Area and Info */}
              <div className="flex flex-col sm:flex-row gap-6 items-center justify-center p-5 rounded-2xl bg-slate-50 border border-slate-100">
                {/* Simulated QR Code using elegant CSS */}
                <div className="relative flex h-32 w-32 items-center justify-center rounded-xl bg-white p-2 shadow-sm border border-slate-200">
                  <div className="absolute inset-0.5 border-2 border-dashed border-slate-300 rounded-lg p-1">
                    {/* Visual representation of a QR Code */}
                    <div className="grid grid-cols-6 grid-rows-6 gap-0.5 h-full w-full">
                      {Array.from({ length: 36 }).map((_, i) => {
                        // Corner squares
                        const isCorner =
                          (i < 3 || (i >= 6 && i < 9) || (i >= 12 && i < 15)) &&
                          (i % 6 < 3);
                        const isTopRightCorner =
                          (i < 3 || (i >= 6 && i < 9) || (i >= 12 && i < 15)) &&
                          (i % 6 >= 3);
                        const isBottomLeftCorner =
                          (i >= 18 && (i % 6 < 3));
                        
                        const isSolid = isCorner || (i === 11) || (i === 17) || (i === 22) || (i === 28) || (i === 33) || (i === 34) || (i === 35);
                        return (
                          <div
                            key={i}
                            className={`rounded-xs ${
                              isSolid
                                ? 'bg-slate-800'
                                : (i % 2 === 0 && i % 3 !== 0)
                                ? 'bg-blue-600'
                                : 'bg-transparent'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                  {/* Small logo at center */}
                  <div className="absolute flex h-8 w-8 items-center justify-center rounded bg-blue-600 shadow-md">
                    <MessageSquare className="h-4 w-4 text-white" />
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-3">
                  <div>
                    <span className="text-xs text-gray-400 block mb-0.5">微信专属通道</span>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="font-mono text-base font-bold text-gray-800 bg-blue-50 px-2.5 py-1 rounded border border-blue-100">
                        {wechatId}
                      </span>
                      <button
                        id="copy-wechat-btn"
                        onClick={handleCopy}
                        className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-slate-100 active:scale-95 transition text-gray-600 tooltip"
                        title="复制微信号"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-emerald-600 animate-scale" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {copied && (
                      <span className="text-xs text-emerald-600 font-medium block mt-1 animate-fade-in">
                        微信号已复制！请打开微信粘贴添加
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 leading-normal">
                    截图显卡外观、烤机性能、型号，添加微信后专家将在3分钟内发出确切收购报价方案。
                  </p>
                </div>
              </div>

              {/* Direct Call & Map Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <a
                  href={`tel:${phoneNumber.replace(/-/g, '')}`}
                  className="flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50/55 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100/50 transition active:scale-98"
                >
                  <Phone className="h-4 w-4" />
                  拨号联系店主
                </a>
                <a
                  href="https://s.amap.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 hover:bg-slate-50 transition active:scale-98"
                >
                  <MapPin className="h-4 w-4" />
                  高德地图导航
                </a>
              </div>

              {/* Offline Store Information Grid */}
              <div className="border-t border-gray-100 pt-5 space-y-3">
                <div className="flex items-start gap-2.5 text-xs text-gray-600">
                  <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-gray-800">实体店导航：</span>
                    成都武侯区天府三街新希望国际B座2507
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-gray-600">
                  <Clock className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-gray-800">到店检测交易：</span>
                    支持当面烤机测试，秒款结算，现场环境极佳。
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Trust Line */}
          <div className="bg-slate-50 border-t border-slate-100 py-3.5 px-6 text-center">
            <span className="text-xs text-slate-400 font-medium">
              防骗保障：成都正规实体店执照备存 · 面付秒款资金无忧
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
