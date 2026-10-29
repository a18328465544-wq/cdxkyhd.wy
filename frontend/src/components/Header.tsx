import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, X, MessageSquare, Phone, ScanLine, Newspaper, ChevronDown, Wrench, BarChart3 } from 'lucide-react';
import { CONTACT_INFO } from '../lib/contact';
import { scrollToSectionTarget } from '../lib/navigation';
import { Button } from './ui/controls';
import { useSiteNavigation } from '../routes/SiteNavigation';

interface HeaderProps {
  onOpenContact: () => void;
}

export default function Header({ onOpenContact }: HeaderProps) {
  const { pathname } = useLocation();
  const { navigate } = useSiteNavigation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const isGpuSnPage = pathname === '/gpu-sn.php' || pathname === '/gpu-sn';
  const isCommunityPage = pathname === '/community' || pathname.startsWith('/community/');
  const isBuildPage = pathname === '/build' || pathname === '/build/';
  const isHardwareToolsPage = pathname === '/tools' || pathname.startsWith('/tools/');
  const isGpuRankingPage = pathname === '/gpu-ranking' || pathname === '/gpu-ranking/';
  const isGpuDailyPage = pathname.replace(/\/$/, '') === '/gpu-daily';
  const isSubPage = isGpuSnPage || isCommunityPage || isBuildPage || isHardwareToolsPage || isGpuRankingPage || isGpuDailyPage;
  const [activeSection, setActiveSection] = useState(isGpuDailyPage ? 'gpu-daily' : isGpuSnPage ? 'gpu-sn-lookup' : isCommunityPage ? 'community' : isBuildPage ? 'build' : isHardwareToolsPage ? 'tools' : isGpuRankingPage ? 'gpu-ranking' : 'home');
  const { phoneDisplay, phoneHref } = CONTACT_INFO;

  const navItems = [
    { id: 'home', name: '首页' },
    { id: 'pricing', name: '回收行情' },
    { id: 'inventory', name: '现货库存' },
    { id: 'build', name: '装机方案' },
    { id: 'cases', name: '客户案例' },
    { id: 'contact', name: '到店指引' }
  ];
  const primaryNavItems = navItems.filter((item) => item.id !== 'cases');
  const moreIsActive = isHardwareToolsPage || isGpuRankingPage || isGpuSnPage || activeSection === 'cases';
  const toolLabel = isGpuRankingPage ? '显卡天梯' : isGpuSnPage ? 'SN 日期查询' : activeSection === 'cases' ? '客户案例' : '硬件工具';

  useLayoutEffect(() => {
    setMobileMenuOpen(false);
    setIsScrolled(window.scrollY > 20);
    setActiveSection(isGpuDailyPage ? 'gpu-daily' : isGpuSnPage ? 'gpu-sn-lookup' : isCommunityPage ? 'community' : isBuildPage ? 'build' : isHardwareToolsPage ? 'tools' : isGpuRankingPage ? 'gpu-ranking' : 'home');
    document.querySelectorAll('#desktop-navbar details[open]').forEach(element => element.removeAttribute('open'));
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        document.getElementById('mobile-menu-toggle-btn')?.focus();
      }
    };
    const onResize = () => { if (window.innerWidth >= 1280) setMobileMenuOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      // Simple active link highlight by position
      if (isSubPage) return;
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
  }, [isSubPage]);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    if (id === 'gpu-sn-lookup') {
      if (!isGpuSnPage) navigate('/gpu-sn.php');
      return;
    }
    if (id === 'build') {
      if (!isBuildPage) navigate('/build');
      return;
    }
    if (isSubPage) {
      navigate(id === 'home' ? '/' : `/#${id}`);
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      scrollToSectionTarget(element, 80);
      setActiveSection(id);
    }
  };

  return (
    <>
    {mobileMenuOpen && <button type="button" tabIndex={-1} aria-label="关闭导航菜单" onClick={() => setMobileMenuOpen(false)} className="fixed inset-x-0 bottom-0 top-16 z-30 bg-slate-950/20 sm:top-20 xl:hidden" />}
    <header
      id="main-app-header"
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled || isSubPage
          ? 'bg-white/85 backdrop-blur-md border-b border-slate-200/80'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="relative bg-white/95 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between">
          
          {/* Logo Brand Title */}
          <button
            type="button"
            id="brand-logo-container"
            onClick={() => scrollToSection('home')}
            aria-label="成都显卡一号店首页"
            className="flex shrink-0 items-center gap-2.5 whitespace-nowrap cursor-pointer group text-left"
          >
            <img
              src="/favicon.svg"
              alt=""
              aria-hidden="true"
              className="h-9 w-9 shrink-0 sm:h-10 sm:w-10"
            />
            <span>
              <span className="text-base font-bold text-slate-900 sm:text-xl block whitespace-nowrap">
                成都显卡一号店
              </span>
              <span className="mt-0.5 block text-xs font-medium text-slate-600">
                实体仓储 · 同城极速发货
              </span>
            </span>
          </button>

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
            <a href="/gpu-daily" aria-current={isGpuDailyPage ? 'page' : undefined} className={`shrink-0 whitespace-nowrap rounded-lg px-2 py-2 text-xs font-medium xl:px-2.5 xl:text-sm ${isGpuDailyPage ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-700'}`}>显卡日报</a>
            <a href="/community" aria-current={isCommunityPage ? 'page' : undefined} className={`shrink-0 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium ${isCommunityPage ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-700'}`}>交流社区</a>
            <details className="group relative shrink-0">
              <summary
                aria-label="硬件工具与更多页面"
                className={`flex cursor-pointer list-none items-center gap-1 whitespace-nowrap rounded-lg px-2 py-2 text-xs font-medium transition-colors marker:hidden [&::-webkit-details-marker]:hidden xl:px-2.5 xl:text-sm ${moreIsActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-700'}`}
              >
                {toolLabel}
                <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
              </summary>
              <div className="absolute right-0 top-full z-50 mt-2 min-w-44 overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                <p className="px-3 py-2 text-xs font-medium text-slate-600">硬件查询与检测</p>
                <a
                  href="/gpu-ranking"
                  aria-current={isGpuRankingPage ? 'page' : undefined}
                  className={`flex items-center gap-2 rounded-md px-3 py-2.5 text-sm transition-colors ${isGpuRankingPage ? 'bg-blue-50 font-medium text-blue-700' : 'text-slate-700 hover:bg-slate-50 hover:text-blue-700'}`}
                >
                  <BarChart3 className="h-4 w-4" aria-hidden="true" />显卡天梯
                </a>
                <a href="/gpu-sn.php" aria-current={isGpuSnPage ? 'page' : undefined} className={`flex min-h-11 items-center gap-2 rounded-md px-3 py-2.5 text-sm ${isGpuSnPage ? 'bg-blue-50 font-medium text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}><ScanLine className="h-4 w-4" />SN 日期查询</a>
                <a
                  href="/tools"
                  aria-current={isHardwareToolsPage ? 'page' : undefined}
                  className={`flex items-center gap-2 rounded-md px-3 py-2.5 text-sm transition-colors ${isHardwareToolsPage ? 'bg-blue-50 font-medium text-blue-700' : 'text-slate-700 hover:bg-slate-50 hover:text-blue-700'}`}
                >
                  <Wrench className="h-4 w-4" aria-hidden="true" />硬件工具
                </a>
                <div className="mx-2 mt-1 border-t border-slate-200 pt-1">
                  <button type="button" onClick={event => { scrollToSection('cases'); event.currentTarget.closest('details')?.removeAttribute('open'); }} aria-current={!isCommunityPage && activeSection === 'cases' ? 'location' : undefined} className={`block min-h-11 w-full rounded-md px-1 py-2.5 text-left text-sm ${!isCommunityPage && activeSection === 'cases' ? 'font-medium text-blue-700' : 'text-slate-600 hover:text-blue-700'}`}>客户案例</button>
                </div>
              </div>
            </details>
          </nav>

          {/* Call-to-actions Header Buttons */}
          <div id="header-actions" className="hidden shrink-0 items-center gap-2 xl:flex xl:gap-3">
            <a
              href={phoneHref}
              title={phoneDisplay}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-blue-600 xl:px-3"
            >
              <Phone className="h-3.5 w-3.5 text-blue-600" />
              <span className="hidden 2xl:inline">{phoneDisplay}</span>
              <span className="sr-only 2xl:hidden">电话联系 {phoneDisplay}</span>
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
              className="flex h-11 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white max-[360px]:w-10 max-[360px]:px-0"
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
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navbar-drawer"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Navigation Panels */}
      {mobileMenuOpen && (
        <nav id="mobile-navbar-drawer" aria-label="手机导航" className="site-mobile-menu xl:hidden bg-white border-y border-slate-200 shadow-lg">
          <div className="px-4 pt-3 pb-2">
            <p className="mb-2 text-xs font-semibold text-slate-500">常用功能</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: '/gpu-daily', name: '显卡日报', icon: Newspaper, active: isGpuDailyPage },
                { href: '/gpu-ranking', name: '性能天梯', icon: BarChart3, active: isGpuRankingPage },
                { href: '/tools', name: '硬件工具', icon: Wrench, active: isHardwareToolsPage },
                { href: '/gpu-sn.php', name: 'SN 日期查询', icon: ScanLine, active: isGpuSnPage },
              ].map(({ href, name, icon: Icon, active }) => <a key={href} href={href} aria-current={active ? 'page' : undefined} onClick={() => setMobileMenuOpen(false)} className={`flex min-h-12 min-w-0 items-center gap-2 rounded-lg border px-3 text-sm font-medium ${active ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}><Icon className="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />{name}</a>)}
            </div>
          </div>
          <div className="border-t border-slate-100 px-4 pt-3"><p className="text-xs font-semibold text-slate-500">门店服务与交流</p></div>
          <div className="grid grid-cols-2 gap-1 px-3 py-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                aria-current={activeSection === item.id ? 'location' : undefined}
                className={`min-h-11 w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === item.id
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {item.name}
              </button>
            ))}
            <a
              href="/community"
              onClick={() => setMobileMenuOpen(false)}
              aria-current={isCommunityPage ? 'page' : undefined}
              className={`flex min-h-11 items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isCommunityPage ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50 hover:text-blue-700'}`}
            >
              交流社区
            </a>
          </div>
          <div className="grid grid-cols-2 items-center gap-3 border-t border-slate-100 bg-white px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button
              id="mobile-drawer-contact-btn"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenContact();
              }}
              variant="primary"
              size="sm"
              className="w-full"
            >
              <MessageSquare className="h-4 w-4" />
              微信咨询
            </Button>
            <a
              href={phoneHref}
              className="flex min-h-11 items-center justify-center gap-1.5 text-sm font-medium text-slate-700"
            >
              <Phone className="h-4 w-4 text-blue-600" />
              {phoneDisplay}
            </a>
          </div>
        </nav>
      )}
    </header>
    </>
  );
}
