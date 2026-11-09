import React, { useState } from 'react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { X, Copy, Check, Phone, MapPin, Clock } from 'lucide-react';
import { CONTACT_INFO } from '../lib/contact';
import { trackConversion } from '../lib/conversionAnalytics';
import { Button } from './ui/controls';

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
  const { wechatId, phoneDisplay, phoneHref, wechatQrPath } = CONTACT_INFO;

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
    <BaseDialog.Root open onOpenChange={open => {if (!open) onClose();}}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="fixed inset-0 z-50 bg-slate-950/30" />
        <BaseDialog.Viewport id="contact-modal-overlay" className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
        <BaseDialog.Popup className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-lg border border-[var(--erp-color-border)] bg-white shadow-[var(--erp-shadow-popover)] sm:rounded-lg">

          {/* Close button */}
          <BaseDialog.Close render={<Button id="close-modal-btn" size="icon" variant="ghost" aria-label="关闭" className="absolute right-4 top-4"><X className="h-5 w-5" /></Button>} />

          <div className="p-4 sm:p-6 md:p-8">
            <div className="mb-4 px-7 text-center sm:mb-6 sm:px-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                客服在线时间 10:00 - 20:00
              </span>
              <BaseDialog.Title className="text-xl font-semibold text-slate-900">{title}</BaseDialog.Title>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed"><span className="sm:hidden">复制微信号添加好友，或保存二维码到微信识别。</span><span className="hidden sm:inline">{subtitle}</span></p>
            </div>

            {/* Content Details */}
            <div className="space-y-6">
              {/* WeChat QR Area and Info */}
              <div className="flex flex-col-reverse gap-4 items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 sm:flex-row sm:gap-6 sm:p-5">
                <div className="relative flex h-48 w-40 sm:h-64 sm:w-52 items-center justify-center overflow-hidden rounded-xl bg-white p-2 shadow-sm border border-slate-200">
                  <img
                    src={wechatQrPath}
                    alt={`微信二维码 ${wechatId}`}
                    className="h-full w-full rounded-lg object-contain"
                    loading="eager"
                    decoding="async"
                  />
                </div>

                <div className="flex-1 text-center sm:text-left space-y-3">
                  <div>
                    <span className="text-xs text-slate-400 block mb-0.5">微信专属通道</span>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="font-mono text-base font-bold text-slate-800 bg-blue-50 px-2.5 py-1 rounded border border-blue-100">
                        {wechatId}
                      </span>
                      <Button
                        id="copy-wechat-btn"
                        onClick={handleCopy}
                        size="icon"
                        aria-label="复制微信号"
                        title="复制微信号"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-emerald-600 animate-scale" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {copied && (
                      <span className="text-xs text-emerald-600 font-medium block mt-1 animate-fade-in">
                        微信号已复制！请打开微信粘贴添加
                      </span>
                    )}
                  </div>
                  <p className="hidden text-xs text-slate-500 leading-normal sm:block">
                    截图显卡外观、烤机性能、型号，添加微信后专家将在3分钟内发出确切收购报价方案。
                  </p>
                </div>
              </div>

              {/* Direct Call & Map Action Buttons */}
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <a
                  href={phoneHref}
                  onClick={() => trackConversion('phone_click')}
                  className="flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50/55 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100/50 transition active:scale-98"
                  title={`拨打 ${phoneDisplay}`}
                >
                  <Phone className="h-4 w-4" />
                  拨号联系店主
                </a>
                <a
                  href="https://s.amap.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition active:scale-98"
                >
                  <MapPin className="h-4 w-4" />
                  高德地图导航
                </a>
              </div>

              {/* Offline Store Information Grid */}
              <div className="border-t border-slate-100 pt-5 space-y-3">
                <div className="flex items-start gap-2.5 text-xs text-slate-600">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-slate-800">实体店导航：</span>
                    成都武侯区天府三街新希望国际B座2507
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-600">
                  <Clock className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-slate-800">到店检测交易：</span>
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
        </BaseDialog.Popup>
        </BaseDialog.Viewport>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
