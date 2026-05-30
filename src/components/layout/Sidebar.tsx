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
    <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white/80 px-5 py-6 backdrop-blur md:flex md:flex-col">
      <Link
        href="/"
        className="flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
          <Layers3 className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-950">MoodBoard AI</div>
          <div className="text-xs text-slate-500">Creative direction workspace</div>
        </div>
      </Link>

      <nav className="mt-8 space-y-1" aria-label="Sidebar">
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
                  ? 'bg-slate-100 text-slate-950 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
              )}
            >
              <Icon className={cn('h-4 w-4', active ? 'text-slate-950' : 'text-slate-500')} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}