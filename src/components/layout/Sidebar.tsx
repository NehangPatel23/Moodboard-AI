'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Layers3, LayoutDashboard, Plus, Settings2, Sparkles } from 'lucide-react';

const navItems = [
  { href: '/app', label: 'My Boards', icon: LayoutDashboard },
  { href: '/app/new', label: 'New Board', icon: Plus },
  { href: '/templates', label: 'Templates', icon: Sparkles },
  { href: '/settings', label: 'Settings', icon: Settings2 },
];

function isActivePath(pathname: string, href: string) {
  if (href === '/app') {
    return pathname === '/app' || pathname.startsWith('/app/boards');
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-black/5 bg-[rgba(248,247,244,0.82)] px-5 py-6 backdrop-blur-xl md:flex md:flex-col">
      <Link
        href="/"
        className="flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
          <Layers3 className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">MoodBoard AI</div>
          <div className="text-xs text-slate-500">Creative direction workspace</div>
        </div>
      </Link>

      <div className="mt-8 px-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
          Workspace
        </p>
      </div>

      <nav className="mt-3 space-y-1" aria-label="Primary">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition',
                active
                  ? 'bg-white text-slate-900 shadow-[0_10px_30px_rgba(15,23,42,0.06)] ring-1 ring-black/5'
                  : 'text-slate-500 hover:bg-white/70 hover:text-slate-900',
              )}
            >
              <Icon className={cn('h-4 w-4', active ? 'text-slate-900' : 'text-slate-400')} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}