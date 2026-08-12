'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  QrCode,
  Calendar,
  Users,
  CreditCard,
  Trophy,
  BarChart3,
  Settings,
  Sparkles,
  Menu,
  X
} from 'lucide-react';
import { SignOutButton } from '@/components/SignOutButton';

interface AdminNavigationProps {
  admin: {
    email: string;
    role: string;
  };
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Scan Attendance', href: '/admin/scanner', icon: QrCode, highlight: true },
  { name: 'Events', href: '/admin/events', icon: Calendar },
  { name: 'Members', href: '/admin/members', icon: Users },
  { name: 'ID Cards', href: '/admin/id-cards', icon: CreditCard },
  { name: 'Monthly Leaderboard', href: '/admin/leaderboard/monthly', icon: Trophy },
  { name: 'All-Time Leaderboard', href: '/admin/leaderboard/all-time', icon: Trophy },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

/* The five slots of the mobile tab bar. Everything else lives in the "More" sheet. */
const tabBarHrefs = ['/admin', '/admin/events', '/admin/scanner', '/admin/leaderboard/monthly'];
const sheetItems = navigation.filter((item) => !tabBarHrefs.includes(item.href));

export function AdminNavigation({ admin, children }: AdminNavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Navigating from inside the sheet should leave it behind.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  const getPageTitle = () => {
    // Longest matching prefix wins so /admin/members/import still reads "Members".
    const item = [...navigation]
      .sort((a, b) => b.href.length - a.href.length)
      .find((n) => pathname === n.href || pathname.startsWith(`${n.href}/`));
    return item ? item.name : 'CRR-Attendence';
  };

  return (
    <div className="flex h-dvh bg-slate-950 font-sans text-white overflow-hidden relative">
      {/* Desktop Sidebar (lg screens) */}
      <aside className="hidden lg:flex w-64 bg-slate-900 border-r border-slate-800 flex-col shrink-0">
        {/* Brand */}
        <div className="h-16 px-5 border-b border-slate-800 flex items-center gap-2.5 bg-slate-950/40">
          <img src="/logo.png" className="h-8 w-8 rounded-full object-cover border border-slate-800" alt="CRR Logo" />
          <span className="font-extrabold text-xs tracking-widest uppercase text-slate-100">
            CRR-Attendence
          </span>
        </div>

        {/* User Card */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/20">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-950/55 border border-slate-800">
            <img src="/logo.png" className="h-10 w-10 rounded-full object-cover border border-slate-800 shrink-0" alt="Logo" />
            <div className="overflow-hidden">
              <p className="text-xs text-slate-400 font-medium">Logged in as</p>
              <p className="text-sm font-bold text-slate-200 truncate">{admin.email}</p>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 mt-1 border border-indigo-500/20">
                {admin.role}
              </span>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                  item.highlight
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/15 hover:from-indigo-500 hover:to-purple-500'
                    : isActive
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 shrink-0 ${
                  item.highlight ? 'text-white' : isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-white transition-colors'
                }`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/30">
          <SignOutButton />
        </div>
      </aside>

      {/* Mobile "More" sheet backdrop */}
      <div
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden={!mobileMenuOpen}
        className={`fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-200 ${
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Mobile "More" sheet — slides up from the bottom, never in from the side */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`fixed inset-x-0 bottom-0 max-h-[85dvh] flex flex-col bg-slate-900 border-t border-slate-800 rounded-t-3xl z-50 shadow-2xl transform transition-transform duration-300 ease-out lg:hidden ${
          mobileMenuOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Pull handle */}
        <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto my-3 shrink-0" />

        {/* Sheet header */}
        <div className="px-5 pb-3 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <img src="/logo.png" className="h-7 w-7 rounded-full object-cover border border-slate-800 shrink-0" alt="CRR Logo" />
            <span className="font-extrabold text-xs tracking-widest uppercase text-slate-100 truncate">
              CRR-Attendence
            </span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
            className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 active:bg-slate-800 active:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable sheet body */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
        >
          {/* User card */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/55 border border-slate-800">
            <img src="/logo.png" className="h-9 w-9 rounded-full object-cover border border-slate-800 shrink-0" alt="Logo" />
            <div className="min-w-0">
              <p className="text-xs text-slate-400 font-medium">Logged in as</p>
              <p className="text-sm font-bold text-slate-200 truncate">{admin.email}</p>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 mt-1 border border-indigo-500/20">
                {admin.role}
              </span>
            </div>
          </div>

          {/* Remaining destinations */}
          <div className="space-y-1.5">
            {sheetItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-3.5 text-sm font-semibold rounded-xl transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 active:bg-slate-800/60 active:text-white'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="h-px bg-slate-800" />

          <SignOutButton />
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden w-full min-w-0 relative">
        {/* Header */}
        <header className="h-14 sm:h-16 border-b border-slate-800 flex items-center justify-between gap-3 px-4 lg:px-8 bg-slate-900/40 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/logo.png"
              className="h-7 w-7 rounded-full object-cover border border-slate-800 shrink-0 lg:hidden"
              alt="CRR Logo"
            />
            <span className="text-slate-400 text-sm hidden lg:inline">Dashboard</span>
            <span className="text-slate-600 hidden lg:inline">/</span>
            <span className="text-slate-100 font-bold text-sm sm:text-base truncate">{getPageTitle()}</span>
          </div>

          <div className="flex items-center shrink-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-xs text-indigo-400 font-medium">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden md:inline">CRR-Attendence Active Ops</span>
              <span className="md:hidden">Live</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 bg-slate-950 w-full pb-[calc(6rem+env(safe-area-inset-bottom,0px))] lg:pb-8">
          {children}
        </main>

        {/* Bottom Tab Bar (mobile only) */}
        <nav className="fixed inset-x-0 bottom-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex items-stretch justify-around z-40 lg:hidden px-2 pb-safe select-none">
          {/* Tab 1: Dashboard */}
          <Link
            href="/admin"
            className={`flex flex-col items-center justify-center flex-1 h-16 gap-1 transition-colors ${
              pathname === '/admin' ? 'text-indigo-400 font-black' : 'text-slate-400 font-medium'
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-[10px] leading-none tracking-tight">Home</span>
          </Link>

          {/* Tab 2: Events */}
          <Link
            href="/admin/events"
            className={`flex flex-col items-center justify-center flex-1 h-16 gap-1 transition-colors ${
              pathname.startsWith('/admin/events') ? 'text-indigo-400 font-black' : 'text-slate-400 font-medium'
            }`}
          >
            <Calendar className="h-5 w-5" />
            <span className="text-[10px] leading-none tracking-tight">Events</span>
          </Link>

          {/* Tab 3: Scan (raised primary action) */}
          <Link
            href="/admin/scanner"
            className="flex flex-col items-center justify-end flex-1 h-16 pb-1.5 gap-1 shrink-0 select-none"
          >
            <div className="h-14 w-14 -mt-8 rounded-full bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 border-4 border-slate-950 text-white active:scale-95 transition-transform">
              <QrCode className="h-6 w-6" />
            </div>
            <span className={`text-[10px] leading-none font-black tracking-wide uppercase ${
              pathname === '/admin/scanner' ? 'text-indigo-400' : 'text-slate-400'
            }`}>
              Scan
            </span>
          </Link>

          {/* Tab 4: Leaderboard */}
          <Link
            href="/admin/leaderboard/monthly"
            className={`flex flex-col items-center justify-center flex-1 h-16 gap-1 transition-colors ${
              pathname.startsWith('/admin/leaderboard') ? 'text-indigo-400 font-black' : 'text-slate-400 font-medium'
            }`}
          >
            <Trophy className="h-5 w-5" />
            <span className="text-[10px] leading-none tracking-tight">Ranks</span>
          </Link>

          {/* Tab 5: More */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-expanded={mobileMenuOpen}
            aria-label="Open menu"
            className={`flex flex-col items-center justify-center flex-1 h-16 gap-1 transition-colors ${
              mobileMenuOpen ? 'text-indigo-400 font-black' : 'text-slate-400 font-medium'
            }`}
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px] leading-none tracking-tight">More</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
