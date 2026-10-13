import React, { useState, useEffect } from 'react';
import { Menu, X, Cpu, MessageSquare, Phone, ScanLine, ArrowUpRight, ChevronDown } from 'lucide-react';
import { CONTACT_INFO } from '../lib/contact';
import { scrollToSectionTarget } from '../lib/navigation';
import { Button } from './ui/controls';

interface HeaderProps {
  onOpenContact: () => void;
}

export default function Header({ onOpenContact }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const isGpuSnPage = window.location.pathname === '/gpu-sn.php' || window.location.pathname === '/gpu-sn';
  const isCommunityPage = window.location.pathname === '/community' || window.location.pathname.startsWith('/community/');
  const [activeSection, setActiveSection] = useState(isGpuSnPage ? 'gpu-sn-lookup' : isCommunityPage ? 'community' : 'home');
  const { phoneDisplay, phoneHref } = CONTACT_INFO;

  const navItems = [
    { id: 'home', name: '首页' },
    { id: 'pricing', name: '今日行情' },
    { id: 'inventory', name: '实时库存' },
    { id: 'pc-builder', name: '在线装机' },
    { id: 'workstation', name: 'AI工作站' },
    { id: 'cases', name: '客户案例' },
    { id: 'contact', name: '联系我们' }
  ];
  const primaryNavItems = navItems.filter((item) => item.id !== 'cases');
  const moreIsActive = isCommunityPage || activeSection === 'cases';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      // Simple active link highlight by position
      const scrollPosition = window.scrollY + 120;
      for (const item of navItems) {
        const el = document.getElementById(item.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(item.id);
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    if (id === 'gpu-sn-lookup') {
      if (!isGpuSnPage) window.location.href = '/gpu-sn.php';
      return;
    }
    if (isGpuSnPage || isCommunityPage) {
      window.location.href = id === 'home' ? '/' : `/#${id}`;
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      scrollToSectionTarget(element, 80);
      setActiveSection(id);
    }
  };

  return (
    <header
      id="main-app-header"
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled || isGpuSnPage
          ? 'bg-white/85 backdrop-blur-md shadow-sm border-b border-gray-100'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between">
          
          {/* Logo Brand Title */}
          <div
            id="brand-logo-container"
            onClick={() => scrollToSection('home')}
            className="flex shrink-0 items-center gap-2.5 whitespace-nowrap cursor-pointer group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-500/10 group-hover:scale-105 transition duration-300">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900 tracking-tight sm:text-xl block whitespace-nowrap">
                成都显卡一号店
              </span>
              <span className="mt-0.5 block text-xs font-medium text-slate-600">
                实体仓储 · 同城极速发货
              </span>
            </div>
          </div>

          {/* Desktop Navigation Linkages */}
          <nav id="desktop-navbar" aria-label="主导航" className="hidden xl:flex items-center gap-0.5">
            {primaryNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                aria-current={!isCommunityPage && activeSection === item.id ? 'location' : undefined}
                className={`shrink-0 whitespace-nowrap rounded-lg px-2 py-2 text-xs font-medium transition-colors cursor-pointer xl:px-2.5 xl:text-sm ${
                  !isCommunityPage && activeSection === item.id
                  ? 'text-blue-700 bg-blue-50'
                    : 'text-slate-600 hover:text-blue-700 hover:bg-slate-50'
                }`}
              >
                {item.name}
              </button>
            ))}
            <details className="group relative shrink-0">
              <summary
                aria-label="更多页面"
                className={`flex cursor-pointer list-none items-center gap-1 whitespace-nowrap rounded-lg px-2 py-2 text-xs font-medium transition-colors marker:hidden [&::-webkit-details-marker]:hidden xl:px-2.5 xl:text-sm ${moreIsActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-700'}`}
              >
                更多
                <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
              </summary>
              <div className="absolute right-0 top-full z-50 mt-2 min-w-36 overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                <button
                  type="button"
                  onClick={(event) => {
                    scrollToSection('cases');
                    event.currentTarget.closest('details')?.removeAttribute('open');
                  }}
                  aria-current={!isCommunityPage && activeSection === 'cases' ? 'location' : undefined}
                  className={`block w-full rounded-md px-3 py-2.5 text-left text-sm transition-colors ${!isCommunityPage && activeSection === 'cases' ? 'bg-blue-50 font-medium text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  客户案例
                </button>
                <a
                  href="/community"
                  aria-current={isCommunityPage ? 'page' : undefined}
                  className={`block rounded-md px-3 py-2.5 text-sm transition-colors ${isCommunityPage ? 'bg-blue-50 font-medium text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  交流社区
                </a>
              </div>
            </details>
          </nav>

          {/* Call-to-actions Header Buttons */}
          <div id="header-actions" className="hidden shrink-0 items-center gap-2 xl:flex xl:gap-3">
            <a
              href={phoneHref}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-blue-600 xl:px-3"
            >
              <Phone className="h-3.5 w-3.5 text-blue-600" />
              {phoneDisplay}
            </a>
            <a
              href="/gpu-sn.php"
              aria-current={isGpuSnPage ? 'page' : undefined}
              className={isGpuSnPage
                ? 'hidden lg:flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-blue-200 bg-blue-50 px-2 py-2 text-xs font-semibold text-blue-700 transition xl:px-3'
                : 'hidden lg:flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 xl:px-3'}
            >
              <ScanLine className="h-3.5 w-3.5 text-blue-600" />
              SN 日期查询
            </a>
            <Button
              id="header-quick-estimate"
              onClick={onOpenContact}
              variant="primary"
              size="sm"
              className="whitespace-nowrap"
            >
              <MessageSquare className="h-4 w-4" />
              微信估价
            </Button>
          </div>

          {/* Mobile hamburger menu toggle */}
          <div className="flex items-center gap-2 xl:hidden">
            <button
              id="header-mobile-estimate-icon"
              onClick={onOpenContact}
              aria-label="微信估价"
              title="微信估价"
              className="flex h-9 items-center justify-center gap-1 rounded-full bg-blue-600 px-3 text-xs font-bold text-white max-[360px]:w-9 max-[360px]:px-0"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="max-[360px]:sr-only">微信估价</span>
            </button>
            <Button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              size="icon"
              variant="ghost"
              aria-label={mobileMenuOpen ? "关闭菜单" : "打开菜单"}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Navigation Panels */}
      {mobileMenuOpen && (
        <div id="mobile-navbar-drawer" className="xl:hidden bg-white border-b border-gray-100 shadow-lg divide-y divide-gray-50 animate-fade-in">
          <div className="px-3 py-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                  activeSection === item.id
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-slate-50'
                }`}
              >
                {item.name}
              </button>
            ))}
            <a
              href="/community"
              onClick={() => setMobileMenuOpen(false)}
              aria-current={isCommunityPage ? 'page' : undefined}
              className={`block w-full rounded-xl px-4 py-3 text-base font-medium transition-colors ${isCommunityPage ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50 hover:text-blue-700'}`}
            >
              交流社区
            </a>
          </div>
          <div className="border-y border-gray-100 bg-slate-50/70 px-4 py-3">
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">独立查询工具</p>
            <a
              href="/gpu-sn.php"
              aria-current={isGpuSnPage ? 'page' : undefined}
              onClick={() => setMobileMenuOpen(false)}
              className={isGpuSnPage
                ? 'flex min-h-11 items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-3.5 text-sm font-semibold text-blue-700 transition'
                : 'flex min-h-11 items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700'}
            >
              <span className="flex items-center gap-2"><ScanLine className="h-4 w-4 text-blue-600" />显卡 SN 出厂日期</span>
              <ArrowUpRight className="h-4 w-4 text-slate-400" />
            </a>
          </div>
          <div className="p-4 bg-slate-50 space-y-3">
            <Button
              id="mobile-drawer-contact-btn"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenContact();
              }}
              variant="primary"
              size="lg"
              className="w-full"
            >
              <MessageSquare className="h-4 w-4" />
              立即微信估价 (3分钟出价)
            </Button>
            <a
              href={phoneHref}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3.5 text-sm font-semibold text-gray-700 active:scale-98"
            >
              <Phone className="h-4 w-4 text-blue-600" />
              联系客服电话：{phoneDisplay}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
