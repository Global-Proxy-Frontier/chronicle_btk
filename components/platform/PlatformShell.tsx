'use client';

import {
  Activity,
  Compass,
  FileSpreadsheet,
  Gauge,
  GitCompareArrows,
  ListFilter,
  Radar,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  matchers: string[];
};

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Ana Sayfa', icon: Gauge, matchers: ['/dashboard'] },
  { href: '/customers', label: 'Inceleme Listesi', icon: ListFilter, matchers: ['/customers', '/cases'] },
  { href: '/live-analyses', label: 'Canli 5 Profil', icon: Radar, matchers: ['/live-analyses'] },
  { href: '/map', label: 'Harita ve Ag', icon: Compass, matchers: ['/map'] },
  { href: '/compare', label: 'Karsilastirma', icon: GitCompareArrows, matchers: ['/compare'] },
  { href: '/reports', label: 'Raporlar', icon: FileSpreadsheet, matchers: ['/reports'] },
  { href: '/system', label: 'Sistem', icon: ShieldCheck, matchers: ['/system'] },
];

function isActivePath(pathname: string, item: NavItem) {
  return item.matchers.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default function PlatformShell({ title, children }: { title: string; children: ReactNode }) {
  const pathname = usePathname();
  const nowLabel = new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date());

  return (
    <div className="relative min-h-screen px-3 pb-6 pt-4 md:px-5">
      <div className="mx-auto grid max-w-[1520px] gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="panel-card h-fit p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-auto custom-scrollbar">
          <div className="panel-soft mb-5 p-4">
            <p className="text-[11px] uppercase tracking-[0.28em] text-sky-200/85">Chronicle AML</p>
            <h2 className="mt-2 text-lg font-semibold text-white">Risk Intelligence Console</h2>
            <p className="mt-1 text-xs muted-text">1000 precompute kayit + 5 canli AI analiz</p>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActivePath(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    active
                      ? 'flex items-center gap-2 rounded-xl border border-sky-400/65 bg-sky-500/18 px-3 py-2 text-sm font-medium text-slate-50 shadow-[0_0_0_1px_rgba(56,189,248,0.22)]'
                      : 'flex items-center gap-2 rounded-xl border border-slate-700/65 bg-slate-900/35 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:bg-slate-900/65 hover:text-slate-50'
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="panel-soft mt-6 p-3 text-xs muted-text">
            <div className="mb-2 flex items-center gap-2 text-slate-200">
              <Activity className="h-3.5 w-3.5 animate-soft-pulse text-emerald-300" />
              Sistem Durumu
            </div>
            <p>Canli analiz sadece secili demo kayitlarinda calisir. Precompute veri korunur.</p>
          </div>
        </aside>

        <main className="panel-card relative overflow-hidden p-4 md:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_82%_4%,rgba(37,99,235,0.18),transparent_32%),radial-gradient(circle_at_55%_115%,rgba(20,184,166,0.14),transparent_35%)]" />

          <header className="relative mb-5 border-b border-slate-700/55 pb-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-sky-200/80">Finance AI Monitoring</p>
                <h1 className="mt-1 text-2xl font-semibold text-slate-50 md:text-3xl">{title}</h1>
              </div>
              <div className="panel-soft hidden rounded-xl px-3 py-2 text-xs text-slate-200 md:block">
                Son guncelleme: <span className="font-semibold text-slate-50">{nowLabel}</span>
              </div>
            </div>
          </header>

          <nav className="relative mb-4 grid grid-cols-3 gap-2 lg:hidden">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActivePath(pathname, item);
              return (
                <Link
                  key={`mobile-${item.href}`}
                  href={item.href}
                  className={
                    active
                      ? 'panel-soft flex items-center justify-center gap-1 rounded-xl border-sky-400/65 px-2 py-2 text-[11px] font-medium text-sky-50'
                      : 'panel-soft flex items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] text-slate-200'
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="relative">{children}</div>
        </main>
      </div>
    </div>
  );
}
