import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import SectionHeader from './ui/SectionHeader';

export default function AboutUsSection() {
  return (
    <section className="border-t border-slate-200 bg-white py-12 sm:py-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <SectionHeader
          eyebrow="关于我们"
          title="从真实经营出发，持续做好显卡与算力服务"
          description="成都显卡一号店由郭鑫创办，专注显卡流通、电脑装机与本地算力服务。创始人的经历、项目实践与持续记录，整理在个人站中。"
          className="mb-0"
        />
        <a
          href="https://guoxin.cdgpu.cn/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 lg:self-auto"
        >
          访问创始人个人站
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
