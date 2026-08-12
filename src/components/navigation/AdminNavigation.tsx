'use client';

import { useState } from 'react';
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
  UserCircle2,
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

export function AdminNavigation({ admin, children }: AdminNavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

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

  const getPageTitle = () => {
    const item = navigation.find(n => n.href === pathname);
    return item ? item.name : 'CRR-Attendence';
  };

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-white overflow-hidden relative">
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

      {/* Mobile Drawer Navigation Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer (lg hidden) */}
      <aside 
        className={`fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 z-50 transform transition-transform duration-300 lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-0 -left-64'
        }`}
      >
        {/* Brand with Close Icon */}
        <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" className="h-8 w-8 rounded-full object-cover border border-slate-800" alt="CRR Logo" />
            <span className="font-extrabold text-xs tracking-widest uppercase text-slate-100 font-sans">
              CRR-Attendence
            </span>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-850 text-slate-450 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
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
                onClick={() => setMobileMenuOpen(false)}
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

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-4 lg:px-8 bg-slate-900/40 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white lg:hidden active:scale-95 transition-all"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm hidden sm:inline">Dashboard</span>
              <span className="text-slate-600 hidden sm:inline">/</span>
              <span className="text-slate-200 font-medium text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">{getPageTitle()}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-xs text-indigo-400 font-medium scale-90 sm:scale-100">
              <Sparkles className="h-3.5 w-3.5" />
              <span>CRR-Attendence Active Ops</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
