import React, { useState, useEffect } from 'react';
import { Menu, X, Cpu, MessageSquare, Phone } from 'lucide-react';

interface HeaderProps {
  onOpenContact: () => void;
}

export default function Header({ onOpenContact }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const navItems = [
    { id: 'home', name: '首页' },
    { id: 'pricing', name: '今日行情' },
    { id: 'inventory', name: '实时库存' },
    { id: 'pc-builder', name: '在线装机' },
    { id: 'workstation', name: 'AI工作站' },
    { id: 'cases', name: '客户案例' },
    { id: 'contact', name: '联系我们' }
  ];

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
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // height of the sticky header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveSection(id);
    }
  };

  return (
    <header
      id="main-app-header"
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
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
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-500/10 group-hover:scale-105 transition duration-300">
              <Cpu className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900 tracking-tight sm:text-xl block">
                成都显卡一号店
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-blue-600 font-semibold block -mt-1">
                Chengdu GPU No.1
              </span>
            </div>
          </div>

          {/* Desktop Navigation Linkages */}
          <nav id="desktop-navbar" className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  activeSection === item.id
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-650 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                {item.name}
              </button>
            ))}
          </nav>

          {/* Call-to-actions Header Buttons */}
          <div id="header-actions" className="hidden sm:flex items-center gap-3">
            <a
              href="tel:18328465544"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-655 hover:text-blue-600 hover:bg-slate-50 transition"
            >
              <Phone className="h-3.5 w-3.5 text-blue-600" />
              183-2846-5544
            </a>
            <button
              id="header-quick-estimate"
              onClick={onOpenContact}
              className="flex items-center gap-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-sm font-semibold shadow-sm transition hover:scale-101 active:scale-99 cursor-pointer"
            >
              <MessageSquare className="h-4 w-4" />
              微信估价
            </button>
          </div>

          {/* Mobile hamburger menu toggle */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              id="header-mobile-estimate-icon"
              onClick={onOpenContact}
              className="sm:hidden flex h-9 px-3 items-center justify-center gap-1 rounded-full bg-blue-600 text-white text-xs font-bold"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              微信
            </button>
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Navigation Panels */}
      {mobileMenuOpen && (
        <div id="mobile-navbar-drawer" className="lg:hidden bg-white border-b border-gray-100 shadow-lg divide-y divide-gray-50 animate-fade-in">
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
          </div>
          <div className="p-4 bg-slate-50 space-y-3">
            <button
              id="mobile-drawer-contact-btn"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenContact();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 py-3.5 text-sm font-bold text-white shadow-md active:scale-98"
            >
              <MessageSquare className="h-4 w-4" />
              立即微信估价 (3分钟出价)
            </button>
            <a
              href="tel:18328465544"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3.5 text-sm font-semibold text-gray-700 active:scale-98"
            >
              <Phone className="h-4 w-4 text-blue-600" />
              联系客服电话：183-2846-5544
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
